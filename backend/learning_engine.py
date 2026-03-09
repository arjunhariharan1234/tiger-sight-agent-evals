import pandas as pd
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

    # Group by incident type and extract patterns
    for alert_name, group in df.groupby("alert_name"):
        total = len(group)
        auto_resolved = group["is_auto_resolved"].sum()
        avg_tat = group["resolution_tat_minutes"].dropna().mean()

        learning = {
            "incident_type": alert_name,
            "agent_type": "control_tower",
            "pattern": f"{total} incidents observed",
            "auto_resolution_rate": round(auto_resolved / total * 100, 1) if total else 0,
            "avg_tat": round(avg_tat, 1) if pd.notna(avg_tat) else None,
            "key_insight": _derive_insight(alert_name, group),
            "source": "system",
        }
        learnings.append(learning)

    return learnings


def _derive_insight(alert_name: str, group: pd.DataFrame) -> str:
    insights = {
        "long_stoppage": "Monitor repeat stoppage locations for plant/warehouse queue optimization",
        "untracked": "GPS device health monitoring needed; consider backup tracking",
        "detention_destination": "Pre-schedule unloading to reduce destination detention",
        "detention_origin": "Loading delays indicate plant scheduling issues",
        "route_deviation": "Review approved alternate routes; update geofences",
        "over_speeding": "Driver safety training recommended; enforce speed governors",
        "continuous_driving": "Enforce mandatory rest breaks; monitor driving hours",
        "sta_breach": "Transit time estimates need recalibration for this corridor",
        "eta_breach": "ETA predictions require updated traffic/distance models",
        "transit_delay": "Corridor congestion analysis needed; consider alternate routes",
        "ewb_expiry": "Automate e-way bill extension alerts before expiry",
        "tracking_interrupted": "Tracking device reliability audit needed",
    }
    return insights.get(alert_name, f"Standard monitoring for {alert_name} incidents")
