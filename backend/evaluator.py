import pandas as pd
import numpy as np
import logging
import time

logger = logging.getLogger(__name__)

# SLA thresholds in minutes by incident type
SLA_THRESHOLDS = {
    "long_stoppage": 240,
    "untracked": 360,
    "sta_breach": 120,
    "tracking_interrupted": 180,
    "detention_destination": 480,
    "continuous_driving": 60,
    "over_speeding": 30,
    "transit_delay": 360,
    "ewb_expiry": 120,
    "route_deviation": 60,
    "eta_breach": 240,
    "detention_origin": 480,
}

IMPROVEMENT_SUGGESTIONS = {
    "long_stoppage": [
        "Verify plant queue status before escalation",
        "Add transporter reliability scoring for repeat offenders",
        "Implement predictive stoppage alerts using historical patterns",
    ],
    "untracked": [
        "Improve geofence accuracy at loading/unloading points",
        "Add fallback tracking via transporter app",
        "Trigger SIM-based tracking when GPS fails",
    ],
    "detention_destination": [
        "Pre-schedule unloading slots to reduce wait times",
        "Alert warehouse team 2 hours before ETA",
        "Track detention cost per corridor",
    ],
    "route_deviation": [
        "Adjust route deviation threshold for known detour corridors",
        "Cross-reference deviation with toll plaza data",
        "Add approved deviation routes to whitelist",
    ],
    "default": [
        "Analyze root cause patterns for this incident type",
        "Monitor resolution TAT trends for improvement areas",
        "Increase automation coverage for repetitive actions",
    ],
}


def evaluate_transactions(df: pd.DataFrame) -> pd.DataFrame:
    start = time.time()
    logger.info("Evaluating transactions...")

    df = df.copy()

    df["performance_summary"] = df.apply(_generate_performance_summary, axis=1)
    df["semantic_learning"] = df.apply(_generate_semantic_learning, axis=1)
    df["improvement_suggestions"] = df.apply(_generate_improvements, axis=1)
    df["confidence_assessment"] = df.apply(_assess_confidence, axis=1)
    df["evaluation_source"] = df.apply(_determine_eval_source, axis=1)
    df["computed_confidence_score"] = df.apply(_compute_confidence_score, axis=1)

    elapsed = time.time() - start
    logger.info(f"Evaluation complete in {elapsed:.2f}s")
    return df


def _generate_performance_summary(row) -> str:
    status = row.get("status", "")
    alert_name = row.get("alert_name", "")
    tat = row.get("resolution_tat_minutes")
    sla = SLA_THRESHOLDS.get(alert_name, 240)
    duration = row.get("duration_minutes")

    if status == "AUTO_RESOLVED":
        if tat is not None and not np.isnan(tat) and tat <= sla:
            return f"Agent auto-resolved {alert_name.replace('_', ' ')} within SLA ({tat:.0f} min vs {sla} min threshold)."
        elif tat is not None and not np.isnan(tat):
            return f"Agent auto-resolved {alert_name.replace('_', ' ')} but exceeded SLA ({tat:.0f} min vs {sla} min threshold)."
        return f"Agent auto-resolved {alert_name.replace('_', ' ')} incident."

    if status == "RESOLVED":
        if tat is not None and not np.isnan(tat) and tat <= sla:
            return f"Incident resolved with manual intervention within SLA ({tat:.0f} min)."
        elif tat is not None and not np.isnan(tat):
            return f"Incident required manual intervention and exceeded SLA ({tat:.0f} min vs {sla} min threshold)."
        return "Incident resolved with manual intervention."

    if status == "ACTIVE":
        if duration is not None and not np.isnan(duration):
            return f"Incident still active. Duration: {duration:.0f} minutes. Monitoring in progress."
        return "Incident is currently active and being monitored."

    return "Incident status unknown."


def _generate_semantic_learning(row) -> str:
    alert_name = row.get("alert_name", "")
    location = row.get("location", "")
    route = row.get("route", "")
    transporter = row.get("transporter_name", "")
    duration = row.get("duration_minutes")

    learnings = []

    if alert_name == "long_stoppage":
        if duration is not None and not np.isnan(duration) and duration > 600:
            learnings.append("Extended stoppage detected - possible unloading delay or plant queue issue")
        if "Unknown" not in str(location) and location:
            learnings.append(f"Stoppage pattern at: {location[:100]}")
        if transporter and transporter != "Unknown":
            learnings.append(f"Transporter involved: {transporter}")

    elif alert_name == "untracked":
        learnings.append("Vehicle tracking lost - possible GPS/SIM failure or device tampered")
        if "no pings" in str(location).lower():
            learnings.append("No pings received - device may be powered off")

    elif alert_name == "detention_destination":
        learnings.append("Detention at destination - unloading delay pattern")
        if duration is not None and not np.isnan(duration):
            learnings.append(f"Detention duration: {duration:.0f} minutes")

    elif alert_name == "route_deviation":
        learnings.append("Route deviation detected - verify if approved alternate route")
        if route:
            learnings.append(f"Expected route: {route[:100]}")

    elif alert_name == "over_speeding":
        learnings.append("Safety violation: over-speeding detected")

    elif alert_name == "continuous_driving":
        learnings.append("Safety violation: continuous driving without rest break")

    elif alert_name in ("sta_breach", "eta_breach"):
        learnings.append("SLA breach - transit time exceeded expected arrival")

    elif alert_name == "transit_delay":
        learnings.append("Transit delay pattern - check corridor congestion")

    elif alert_name == "ewb_expiry":
        learnings.append("E-way bill expiry - compliance risk")

    if not learnings:
        learnings.append(f"Standard {alert_name.replace('_', ' ')} incident")

    return " | ".join(learnings)


def _generate_improvements(row) -> str:
    alert_name = row.get("alert_name", "")
    suggestions = IMPROVEMENT_SUGGESTIONS.get(alert_name, IMPROVEMENT_SUGGESTIONS["default"])
    return " | ".join(suggestions)


def _assess_confidence(row) -> str:
    score = _compute_confidence_score(row)
    if score >= 80:
        return "HIGH"
    elif score >= 50:
        return "MEDIUM"
    return "LOW"


def _compute_confidence_score(row) -> float:
    # Data completeness (35%)
    fields = ["location", "route", "transporter_name", "vehicle_number", "duration_minutes", "driver_name"]
    non_null = sum(1 for f in fields if pd.notna(row.get(f)) and str(row.get(f)) not in ("Unknown", "NaN", "nan", ""))
    data_completeness = non_null / len(fields)

    # Resolution speed (25%)
    tat = row.get("resolution_tat_minutes")
    alert_name = row.get("alert_name", "")
    sla = SLA_THRESHOLDS.get(alert_name, 240)
    if tat is not None and not np.isnan(tat) and tat > 0:
        resolution_speed = min(1.0, sla / tat)
    else:
        resolution_speed = 0.3

    # Pattern match (20%) - based on whether incident type has known patterns
    known_patterns = {"long_stoppage", "detention_destination", "route_deviation", "over_speeding"}
    pattern_match = 0.8 if alert_name in known_patterns else 0.4

    # Consistency (10%) - based on status clarity
    status = row.get("status", "")
    consistency = 0.9 if status in ("RESOLVED", "AUTO_RESOLVED") else 0.4

    # Historical accuracy proxy (10%)
    existing_score = row.get("confidence_score")
    if existing_score is not None and not np.isnan(existing_score):
        historical = existing_score
    else:
        historical = 0.5

    score = (
        0.35 * data_completeness
        + 0.25 * resolution_speed
        + 0.20 * pattern_match
        + 0.10 * consistency
        + 0.10 * historical
    ) * 100

    return round(min(100, max(0, score)), 1)


def _determine_eval_source(row) -> str:
    user_id = row.get("user_id")
    if pd.notna(user_id) and "auto_resolution" in str(user_id):
        return "auto_resolution_system"
    if pd.notna(user_id) and "semantic_memory" in str(user_id):
        return "semantic_memory"
    if row.get("status") == "AUTO_RESOLVED":
        return "auto_resolution_system"
    return "rule_based_evaluation"
