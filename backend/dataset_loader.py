import pandas as pd
import numpy as np
import time
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

COLUMN_MAP = {
    "alert_data → alert_location_lat": "lat",
    "alert_data → alert_location_lon": "lon",
    "alert_data → company_name": "company_name",
    "alert_data → driver_name": "driver_name",
    "alert_data → driver_number": "driver_number",
    "alert_data → duration_minutes": "duration_minutes",
    "alert_data → location": "location",
    "alert_data → party_type": "party_type",
    "alert_data → route": "route",
    "alert_data → transporter_id": "transporter_id",
    "alert_data → transporter_name": "transporter_name",
    "alert_data → transporter_phone_number": "transporter_phone",
    "alert_data → vehicle_number": "vehicle_number",
}


def load_dataset(file_path: str) -> pd.DataFrame:
    start = time.time()
    logger.info(f"Loading dataset from {file_path}")

    df = pd.read_excel(file_path)
    df = df.rename(columns=COLUMN_MAP)

    # Normalize severity
    df["severity"] = df["severity"].str.upper()

    # Derive resolution_tat_minutes
    df["resolution_tat_minutes"] = (
        pd.to_datetime(df["alert_updated_at"]) - pd.to_datetime(df["alert_generated_at"])
    ).dt.total_seconds() / 60.0

    # Derive flags
    df["is_critical"] = df["severity"] == "CRITICAL"
    df["is_auto_resolved"] = df["status"] == "AUTO_RESOLVED"

    # Derive incident_family from alert_name
    incident_families = {
        "long_stoppage": "Stoppage",
        "untracked": "Tracking",
        "sta_breach": "SLA",
        "tracking_interrupted": "Tracking",
        "detention_destination": "Detention",
        "continuous_driving": "Safety",
        "over_speeding": "Safety",
        "transit_delay": "Delay",
        "ewb_expiry": "Compliance",
        "route_deviation": "Route",
        "eta_breach": "SLA",
        "detention_origin": "Detention",
    }
    df["incident_family"] = df["alert_name"].map(incident_families).fillna("Other")

    # Agent type (Phase 1: all are Long Stoppage agent context)
    df["agent_type"] = "control_tower"

    elapsed = time.time() - start
    logger.info(f"Dataset loaded: {len(df)} rows in {elapsed:.2f}s")
    return df


def get_dataset_path() -> str:
    base = Path(__file__).parent.parent.parent
    files = list(base.glob("query_result_*.xlsx"))
    if files:
        return str(files[0])
    raise FileNotFoundError("No dataset file found")
