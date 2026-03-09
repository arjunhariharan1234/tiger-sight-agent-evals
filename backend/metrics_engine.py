import pandas as pd
import numpy as np
from typing import Any


def compute_executive_kpis(df: pd.DataFrame) -> dict[str, Any]:
    total = len(df)
    critical = int(df["is_critical"].sum())
    auto_resolved = int(df["is_auto_resolved"].sum())
    resolved = int(df[df["status"].isin(["RESOLVED", "AUTO_RESOLVED"])].shape[0])
    manual = resolved - auto_resolved

    tat_values = df["resolution_tat_minutes"].dropna()

    # Estimate shipment value protected (based on critical incidents resolved)
    critical_resolved = df[(df["is_critical"]) & (df["status"].isin(["RESOLVED", "AUTO_RESOLVED"]))].shape[0]
    avg_shipment_value = 500  # INR risk component per incident
    value_protected = critical_resolved * avg_shipment_value

    # AI value delivered estimate — kept realistic (under 10 Cr total)
    auto_hours_saved = auto_resolved * 0.25  # 15 min per auto-resolution
    ai_value = auto_hours_saved * 350 + auto_resolved * 50

    # Confidence scores
    conf_scores = df["computed_confidence_score"].dropna() if "computed_confidence_score" in df.columns else df["confidence_score"].dropna()

    return {
        "total_incidents": total,
        "critical_incidents": critical,
        "auto_resolved_pct": round(auto_resolved / total * 100, 1) if total > 0 else 0,
        "manual_intervention_pct": round(manual / total * 100, 1) if total > 0 else 0,
        "avg_resolution_tat": round(tat_values.mean(), 1) if len(tat_values) > 0 else 0,
        "p90_resolution_tat": round(tat_values.quantile(0.9), 1) if len(tat_values) > 0 else 0,
        "shipment_value_protected": round(value_protected, 0),
        "ai_value_delivered": round(ai_value, 0),
        "avg_confidence_score": round(conf_scores.mean(), 1) if len(conf_scores) > 0 else 0,
    }


def compute_incident_funnel(df: pd.DataFrame) -> list[dict]:
    total = len(df)
    detected = total
    qualified = int(df[df["severity"].isin(["CRITICAL", "HIGH", "MEDIUM"])].shape[0])
    prioritized = int(df[df["severity"].isin(["CRITICAL", "HIGH"])].shape[0])
    auto_resolved = int(df[df["status"] == "AUTO_RESOLVED"].shape[0])
    escalated = int(df[(df["status"] == "RESOLVED") & (df["status"] != "AUTO_RESOLVED")].shape[0])
    closed = int(df[df["alert_status"] == "CLOSED"].shape[0])
    reopened = 0  # No reopen data in current dataset

    stages = [
        {"stage": "Detected", "count": detected, "pct": 100.0},
        {"stage": "Qualified", "count": qualified, "pct": round(qualified / total * 100, 1) if total else 0},
        {"stage": "Prioritized", "count": prioritized, "pct": round(prioritized / total * 100, 1) if total else 0},
        {"stage": "Auto Resolved", "count": auto_resolved, "pct": round(auto_resolved / total * 100, 1) if total else 0},
        {"stage": "Escalated", "count": escalated, "pct": round(escalated / total * 100, 1) if total else 0},
        {"stage": "Closed", "count": closed, "pct": round(closed / total * 100, 1) if total else 0},
        {"stage": "Reopened", "count": reopened, "pct": 0.0},
    ]
    return stages


def compute_resolution_quality(df: pd.DataFrame) -> dict[str, Any]:
    total = len(df)
    resolved_df = df[df["status"].isin(["RESOLVED", "AUTO_RESOLVED"])]
    auto_resolved = df[df["status"] == "AUTO_RESOLVED"].shape[0]
    escalated = df[df["status"] == "RESOLVED"].shape[0]
    tat_values = resolved_df["resolution_tat_minutes"].dropna()

    return {
        "auto_resolution_success_rate": round(auto_resolved / total * 100, 1) if total else 0,
        "escalation_rate": round(escalated / total * 100, 1) if total else 0,
        "reopen_rate": 0.0,
        "false_positive_rate": 0.0,
        "p50_resolution_time": round(tat_values.quantile(0.5), 1) if len(tat_values) > 0 else 0,
        "p90_resolution_time": round(tat_values.quantile(0.9), 1) if len(tat_values) > 0 else 0,
    }


def compute_business_value(df: pd.DataFrame) -> dict[str, Any]:
    resolved = df[df["status"].isin(["RESOLVED", "AUTO_RESOLVED"])]
    critical_resolved = resolved[resolved["is_critical"]].shape[0]
    auto_resolved = df[df["status"] == "AUTO_RESOLVED"].shape[0]

    # Realistic estimates — total AI value should be under 10 Cr
    avg_shipment_value = 500  # INR per incident (risk component)
    risk_avoided = critical_resolved * avg_shipment_value

    avg_penalty = 200
    penalty_avoided = resolved.shape[0] * avg_penalty * 0.15
    delay_cost = resolved.shape[0] * 80 * 0.1
    detention_avoided = resolved[resolved["alert_name"].isin(["detention_destination", "detention_origin"])].shape[0] * 500
    cost_avoided = penalty_avoided + delay_cost + detention_avoided

    hours_saved = auto_resolved * 0.25  # 15 min per auto-resolution
    calls_avoided = auto_resolved * 1
    productivity_gain = hours_saved * 350

    total_value = cost_avoided + productivity_gain

    return {
        "risk_avoided": {
            "shipment_value_protected": round(risk_avoided, 0),
        },
        "cost_avoided": {
            "penalty_avoided": round(penalty_avoided, 0),
            "delay_cost_avoided": round(delay_cost, 0),
            "detention_avoided": round(detention_avoided, 0),
            "total": round(cost_avoided, 0),
        },
        "productivity_gain": {
            "manual_hours_saved": round(hours_saved, 1),
            "calls_avoided": calls_avoided,
            "value": round(productivity_gain, 0),
        },
        "ai_value_delivered": round(total_value, 0),
    }


def compute_agent_benchmark(df: pd.DataFrame) -> list[dict]:
    grouped = df.groupby("alert_name").agg(
        incidents_handled=("id", "count"),
        auto_resolved=("is_auto_resolved", "sum"),
        avg_resolution_tat=("resolution_tat_minutes", "mean"),
        total_resolved=("status", lambda x: (x.isin(["RESOLVED", "AUTO_RESOLVED"])).sum()),
    ).reset_index()

    grouped["auto_resolution_rate"] = (grouped["auto_resolved"] / grouped["incidents_handled"] * 100).round(1)
    grouped["avg_resolution_tat"] = grouped["avg_resolution_tat"].round(1)

    results = []
    for _, row in grouped.iterrows():
        results.append({
            "agent_type": "control_tower",
            "incident_type": row["alert_name"],
            "incidents_handled": int(row["incidents_handled"]),
            "auto_resolution_rate": float(row["auto_resolution_rate"]),
            "avg_resolution_tat": float(row["avg_resolution_tat"]) if not np.isnan(row["avg_resolution_tat"]) else 0,
            "reopen_rate": 0.0,
        })

    return sorted(results, key=lambda x: x["incidents_handled"], reverse=True)


def compute_severity_distribution(df: pd.DataFrame) -> list[dict]:
    counts = df["severity"].value_counts().to_dict()
    return [{"severity": k, "count": int(v)} for k, v in counts.items()]


def compute_incident_type_distribution(df: pd.DataFrame) -> list[dict]:
    counts = df["alert_name"].value_counts().to_dict()
    return [{"incident_type": k, "count": int(v)} for k, v in counts.items()]


def compute_timeline(df: pd.DataFrame) -> list[dict]:
    df_copy = df.copy()
    df_copy["date"] = pd.to_datetime(df_copy["alert_generated_at"]).dt.date
    daily = df_copy.groupby("date").agg(
        total=("id", "count"),
        auto_resolved=("is_auto_resolved", "sum"),
        critical=("is_critical", "sum"),
    ).reset_index()
    daily = daily.sort_values("date")

    return [
        {
            "date": str(row["date"]),
            "total": int(row["total"]),
            "auto_resolved": int(row["auto_resolved"]),
            "critical": int(row["critical"]),
        }
        for _, row in daily.iterrows()
    ]


def compute_corridor_analysis(df: pd.DataFrame) -> list[dict]:
    corridor_df = df[df["route"].notna() & (df["route"] != "")]
    if corridor_df.empty:
        return []

    grouped = corridor_df.groupby("route").agg(
        incidents=("id", "count"),
        auto_resolved=("is_auto_resolved", "sum"),
        avg_tat=("resolution_tat_minutes", "mean"),
    ).reset_index()
    grouped = grouped.sort_values("incidents", ascending=False).head(20)

    return [
        {
            "corridor": row["route"][:80],
            "incidents": int(row["incidents"]),
            "auto_resolved": int(row["auto_resolved"]),
            "avg_tat": round(row["avg_tat"], 1) if not np.isnan(row["avg_tat"]) else 0,
        }
        for _, row in grouped.iterrows()
    ]


def apply_filters(df: pd.DataFrame, filters: dict) -> pd.DataFrame:
    filtered = df.copy()

    if filters.get("date_from"):
        filtered = filtered[pd.to_datetime(filtered["alert_generated_at"]) >= pd.to_datetime(filters["date_from"])]
    if filters.get("date_to"):
        filtered = filtered[pd.to_datetime(filtered["alert_generated_at"]) <= pd.to_datetime(filters["date_to"])]
    if filters.get("company"):
        filtered = filtered[filtered["company_name"] == filters["company"]]
    if filters.get("incident_type"):
        filtered = filtered[filtered["alert_name"] == filters["incident_type"]]
    if filters.get("severity"):
        filtered = filtered[filtered["severity"] == filters["severity"].upper()]
    if filters.get("status"):
        filtered = filtered[filtered["status"] == filters["status"]]
    if filters.get("corridor"):
        filtered = filtered[filtered["route"].str.contains(filters["corridor"], case=False, na=False)]
    if filters.get("confidence_min") is not None:
        score_col = "computed_confidence_score" if "computed_confidence_score" in filtered.columns else "confidence_score"
        filtered = filtered[filtered[score_col].fillna(0) >= filters["confidence_min"]]
    if filters.get("confidence_max") is not None:
        score_col = "computed_confidence_score" if "computed_confidence_score" in filtered.columns else "confidence_score"
        filtered = filtered[filtered[score_col].fillna(0) <= filters["confidence_max"]]

    return filtered
