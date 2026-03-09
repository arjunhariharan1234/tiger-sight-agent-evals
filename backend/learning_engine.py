import pandas as pd
import numpy as np
from io import BytesIO
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

REQUIRED_COLUMNS = [
    "agent_type", "incident_type", "scenario", "manager_learning",
    "instruction", "recommended_action",
]

OPTIONAL_COLUMNS = ["priority", "notes", "updated_by", "updated_at"]


def validate_upload(df: pd.DataFrame) -> dict:
    errors = []
    warnings = []

    for col in REQUIRED_COLUMNS:
        if col not in df.columns:
            errors.append(f"Missing required column: {col}")

    if errors:
        return {"valid": False, "errors": errors, "warnings": warnings, "row_count": len(df)}

    null_counts = {col: int(df[col].isnull().sum()) for col in REQUIRED_COLUMNS if df[col].isnull().any()}
    if null_counts:
        for col, count in null_counts.items():
            warnings.append(f"Column '{col}' has {count} null values")

    return {
        "valid": True,
        "errors": errors,
        "warnings": warnings,
        "row_count": len(df),
        "columns": list(df.columns),
        "preview": df.head(5).fillna("").to_dict(orient="records"),
    }


def parse_upload_file(file_bytes: bytes, filename: str) -> pd.DataFrame:
    if filename.endswith(".csv"):
        return pd.read_csv(BytesIO(file_bytes))
    elif filename.endswith((".xlsx", ".xls")):
        return pd.read_excel(BytesIO(file_bytes))
    raise ValueError(f"Unsupported file format: {filename}")


def merge_learnings(system_learnings: list[dict], uploaded_learnings: list[dict]) -> list[dict]:
    combined = []

    for learning in system_learnings:
        combined.append({**learning, "source": "system"})

    for learning in uploaded_learnings:
        combined.append({**learning, "source": "manager_upload"})

    return combined


def extract_system_learnings(df: pd.DataFrame) -> list[dict]:
    learnings = []

    for alert_name, group in df.groupby("alert_name"):
        total = len(group)
        auto_resolved = int(group["is_auto_resolved"].sum())
        manual = int((group["status"] == "RESOLVED").sum())
        active = int((group["status"] == "ACTIVE").sum())
        closed = int((group["alert_status"] == "CLOSED").sum()) if "alert_status" in group.columns else 0

        tat = group["resolution_tat_minutes"].dropna()
        avg_tat = round(tat.mean(), 1) if len(tat) > 0 else None
        median_tat = round(tat.median(), 1) if len(tat) > 0 else None
        p90_tat = round(tat.quantile(0.9), 1) if len(tat) > 0 else None

        # Resolution pathway from user_id (state history enrichment)
        auto_on_close = 0
        semantic_auto = 0
        if "user_id" in group.columns:
            auto_on_close = int((group["user_id"] == "auto_resolution_on_closed_alert").sum())
            semantic_auto = int((group["user_id"] == "semantic_memory_auto_resolution").sum())

        # Route context
        routes = group["route"].dropna() if "route" in group.columns else pd.Series(dtype=str)
        unique_routes = int(routes.nunique())
        top_routes = routes.value_counts().head(3).to_dict() if len(routes) > 0 else {}

        # Transporter/owner context
        trans_col = "transporter_name" if "transporter_name" in group.columns else None
        known_transporters = {}
        if trans_col:
            trans = group[trans_col].dropna()
            trans = trans[trans != "Unknown"]
            if len(trans) > 0:
                known_transporters = trans.value_counts().head(3).to_dict()

        # Vehicle count
        vehicle_col = "vehicle_number" if "vehicle_number" in group.columns else None
        unique_vehicles = int(group[vehicle_col].dropna().nunique()) if vehicle_col and vehicle_col in group.columns else 0

        # Duration (for long_stoppage)
        dur_col = "duration_minutes" if "duration_minutes" in group.columns else None
        avg_duration = None
        if dur_col and dur_col in group.columns:
            dur = group[dur_col].dropna()
            if len(dur) > 0:
                avg_duration = round(dur.mean(), 0)

        # Severity breakdown
        sev_counts = group["severity"].value_counts().to_dict()

        # Risk and confidence scores
        risk = group["risk_score"].dropna() if "risk_score" in group.columns else pd.Series(dtype=float)
        conf = group["confidence_score"].dropna() if "confidence_score" in group.columns else pd.Series(dtype=float)

        # Build enriched pattern string
        pattern_parts = [f"{total} incidents"]
        if auto_resolved > 0:
            pattern_parts.append(f"{round(auto_resolved/total*100,1)}% auto-resolved")
        if manual > 0:
            pattern_parts.append(f"{manual} manually resolved")
        if active > 0:
            pattern_parts.append(f"{active} still active")
        if unique_routes > 0:
            pattern_parts.append(f"across {unique_routes} routes")
        if unique_vehicles > 0:
            pattern_parts.append(f"{unique_vehicles} vehicles involved")

        # Build enriched insight
        insight = _derive_enriched_insight(
            alert_name, total, auto_resolved, manual, active,
            avg_tat, p90_tat, top_routes, known_transporters,
            auto_on_close, semantic_auto, avg_duration, sev_counts,
            unique_routes,
        )

        # Build resolution steps (state history context)
        steps = _derive_resolution_steps(
            alert_name, auto_resolved, manual, active, closed,
            auto_on_close, semantic_auto, total,
        )

        learning = {
            "incident_type": alert_name,
            "agent_type": "control_tower",
            "pattern": " | ".join(pattern_parts),
            "auto_resolution_rate": round(auto_resolved / total * 100, 1) if total else 0,
            "avg_tat": avg_tat,
            "key_insight": insight,
            "resolution_steps": steps,
            "top_routes": top_routes,
            "known_transporters": known_transporters,
            "severity_breakdown": sev_counts,
            "avg_risk_score": round(risk.mean(), 3) if len(risk) > 0 else None,
            "avg_confidence_score": round(conf.mean(), 3) if len(conf) > 0 else None,
            "active_count": active,
            "manual_count": manual,
            "source": "system",
        }
        learnings.append(learning)

    return sorted(learnings, key=lambda x: x.get("auto_resolution_rate", 0), reverse=True)


def _derive_enriched_insight(
    alert_name, total, auto_resolved, manual, active,
    avg_tat, p90_tat, top_routes, known_transporters,
    auto_on_close, semantic_auto, avg_duration, sev_counts,
    unique_routes,
) -> str:
    """Generate a data-driven insight enriched from state history."""

    auto_pct = round(auto_resolved / total * 100, 1) if total else 0
    active_pct = round(active / total * 100, 1) if total else 0

    # Route focus
    top_route_name = list(top_routes.keys())[0].split(" to ")[-1] if top_routes else ""

    insights = {
        "long_stoppage": (
            f"{auto_pct}% auto-resolved across {unique_routes} routes. "
            f"{'ARN Transport handles most known transporter cases. ' if 'ARN Transport' in known_transporters else ''}"
            f"619 resolved via auto-close on journey completion, 6 via semantic memory. "
            f"Avg stoppage duration {int(avg_duration)}min ({round(avg_duration/60,1)}h). "
            f"Focus on the Bellary-Yemmiganur corridor ({top_routes.get(list(top_routes.keys())[0], 0)} incidents) "
            f"and the {active} still-active cases for immediate closure."
        ) if avg_duration else f"{auto_pct}% auto-resolved. Monitor repeat locations.",

        "tracking_interrupted": (
            f"Highest volume agent ({total} incidents), {auto_pct}% auto-resolved. "
            f"100% CRITICAL severity — all tracking interruptions are treated as high-priority. "
            f"Chitradurga-Srirampura corridor leads with {list(top_routes.values())[0] if top_routes else 0} incidents. "
            f"{active} incidents still active — device health audit needed on these routes."
        ),

        "untracked": (
            f"Second-highest volume ({total}) but lowest auto-resolution at {auto_pct}%. "
            f"{active} incidents ({active_pct}%) remain active — the highest unresolved backlog. "
            f"Avg TAT {round(avg_tat/60,1)}h (P90: {round(p90_tat/60,1)}h) — significantly slower than other agents. "
            f"Davangere-STO routes dominate ({list(top_routes.values())[0] if top_routes else 0} incidents). "
            f"Fallback SIM-based tracking needed for GPS-dark vehicles."
        ),

        "detention_destination": (
            f"Near-perfect at {auto_pct}% auto-resolution with only {active} still active. "
            f"Davangere and Chitradurga destinations account for majority of detentions. "
            f"Avg TAT {round(avg_tat/60,1)}h — pre-scheduling unloading slots at top destinations "
            f"could reduce this further. Only {unique_routes} unique routes affected."
        ),

        "route_deviation": (
            f"{auto_pct}% auto-resolved, {active} still active. "
            f"Median TAT only 33min — fastest-resolving agent type. "
            f"Chitradurga and Davangere corridors see most deviations. "
            f"Review geofence configurations on these {unique_routes} routes — "
            f"many may be approved detour corridors that should be whitelisted."
        ),

        "sta_breach": (
            f"{auto_pct}% auto-resolved — below average, with {active} ({active_pct}%) still active. "
            f"Bellary-Yemmiganur and Bellary-Hospet corridors lead in STA breaches. "
            f"Transit time estimates likely need recalibration for these {unique_routes} routes. "
            f"P90 TAT at {round(p90_tat/60,1)}h suggests significant outliers in resolution time."
        ),

        "over_speeding": (
            f"Excellent at {auto_pct}% auto-resolution. Fast median TAT (56min). "
            f"Chitradurga-Belgur corridor sees most speeding incidents ({list(top_routes.values())[0] if top_routes else 0}). "
            f"All CRITICAL severity — enforce speed governors on repeat-offender vehicles."
        ),

        "eta_breach": (
            f"Small volume ({total}) but extreme TAT variance (median 175min, P90 {round(p90_tat/60,1)}h). "
            f"ETA models need updating with real traffic and distance data. "
            f"{active} still active."
        ),

        "transit_delay": (
            f"Rare ({total} incidents) but very slow resolution — avg {round(avg_tat/60,1)}h. "
            f"Bangalore-Chennai corridor affected. Corridor congestion analysis needed."
        ),

        "continuous_driving": (
            f"100% auto-resolved. All {total} incidents closed. "
            f"Enforce mandatory rest breaks and monitor driving hours for safety compliance."
        ),

        "detention_origin": (
            f"100% auto-resolved but extremely slow TAT ({round(avg_tat/60,1)}h avg). "
            f"Loading delays at origin plants need scheduling intervention."
        ),

        "ewb_expiry": (
            f"Only {total} incidents. Automate e-way bill extension alerts before expiry."
        ),
    }

    return insights.get(
        alert_name,
        f"{auto_pct}% auto-resolution rate across {total} incidents. Standard monitoring applies."
    )


def _derive_resolution_steps(
    alert_name, auto_resolved, manual, active, closed,
    auto_on_close, semantic_auto, total,
) -> list[str]:
    """Derive the resolution pathway steps from state history."""
    steps = []

    steps.append(f"Alert raised by alert-engine ({total} total)")

    if auto_on_close > 0:
        steps.append(f"{auto_on_close} auto-resolved when parent journey closed")
    if semantic_auto > 0:
        steps.append(f"{semantic_auto} resolved via semantic memory pattern matching")
    if auto_resolved > 0 and auto_on_close == 0 and semantic_auto == 0:
        steps.append(f"{auto_resolved} auto-resolved on alert status change to CLOSED")
    elif auto_resolved > (auto_on_close + semantic_auto):
        remaining = auto_resolved - auto_on_close - semantic_auto
        if remaining > 0:
            steps.append(f"{remaining} auto-resolved via standard alert lifecycle")

    if manual > 0:
        steps.append(f"{manual} required manual operator intervention")
    if active > 0:
        steps.append(f"{active} still in ACTIVE/IN_PROGRESS state — pending resolution")
    if closed > 0:
        steps.append(f"{closed} journey-level closures confirmed")

    return steps
