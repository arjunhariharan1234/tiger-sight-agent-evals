import logging
import time
from contextlib import asynccontextmanager
from typing import Optional

import pandas as pd
from fastapi import FastAPI, File, UploadFile, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from dataset_loader import load_dataset, get_dataset_path
from evaluator import evaluate_transactions
from metrics_engine import (
    compute_executive_kpis,
    compute_incident_funnel,
    compute_resolution_quality,
    compute_business_value,
    compute_agent_benchmark,
    compute_severity_distribution,
    compute_incident_type_distribution,
    compute_timeline,
    compute_corridor_analysis,
    apply_filters,
)
from learning_engine import (
    validate_upload,
    parse_upload_file,
    extract_system_learnings,
    merge_learnings,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# In-memory data store
DATA_STORE = {
    "df": None,
    "anecdotal_learnings": [],
    "load_time": None,
    "eval_time": None,
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load and evaluate dataset
    start = time.time()
    try:
        path = get_dataset_path()
        df = load_dataset(path)
        DATA_STORE["load_time"] = round(time.time() - start, 2)

        eval_start = time.time()
        df = evaluate_transactions(df)
        DATA_STORE["eval_time"] = round(time.time() - eval_start, 2)

        DATA_STORE["df"] = df
        logger.info(f"Loaded {len(df)} rows in {DATA_STORE['load_time']}s, evaluated in {DATA_STORE['eval_time']}s")
    except Exception as e:
        logger.error(f"Failed to load dataset: {e}")
        raise

    yield


app = FastAPI(title="AI Evals Dashboard API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_filtered_df(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    company: Optional[str] = None,
    incident_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    corridor: Optional[str] = None,
    confidence_min: Optional[float] = None,
    confidence_max: Optional[float] = None,
) -> pd.DataFrame:
    filters = {
        "date_from": date_from,
        "date_to": date_to,
        "company": company,
        "incident_type": incident_type,
        "severity": severity,
        "status": status,
        "corridor": corridor,
        "confidence_min": confidence_min,
        "confidence_max": confidence_max,
    }
    return apply_filters(DATA_STORE["df"], {k: v for k, v in filters.items() if v is not None})


# --- Filter Options ---

@app.get("/api/filters/options")
def get_filter_options():
    df = DATA_STORE["df"]
    return {
        "companies": sorted(df["company_name"].dropna().unique().tolist()),
        "incident_types": sorted(df["alert_name"].unique().tolist()),
        "severities": sorted(df["severity"].unique().tolist()),
        "statuses": sorted(df["status"].unique().tolist()),
        "corridors": sorted(df["route"].dropna().unique().tolist())[:50],
    }


# --- Executive KPIs ---

@app.get("/api/kpis")
def get_kpis(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    company: Optional[str] = None,
    incident_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    corridor: Optional[str] = None,
    confidence_min: Optional[float] = None,
    confidence_max: Optional[float] = None,
):
    df = get_filtered_df(date_from, date_to, company, incident_type, severity, status, corridor, confidence_min, confidence_max)
    return compute_executive_kpis(df)


# --- Incident Funnel ---

@app.get("/api/funnel")
def get_funnel(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    company: Optional[str] = None,
    incident_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    corridor: Optional[str] = None,
    confidence_min: Optional[float] = None,
    confidence_max: Optional[float] = None,
):
    df = get_filtered_df(date_from, date_to, company, incident_type, severity, status, corridor, confidence_min, confidence_max)
    return compute_incident_funnel(df)


# --- Resolution Quality ---

@app.get("/api/resolution-quality")
def get_resolution_quality(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    company: Optional[str] = None,
    incident_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    corridor: Optional[str] = None,
    confidence_min: Optional[float] = None,
    confidence_max: Optional[float] = None,
):
    df = get_filtered_df(date_from, date_to, company, incident_type, severity, status, corridor, confidence_min, confidence_max)
    return compute_resolution_quality(df)


# --- Business Value ---

@app.get("/api/business-value")
def get_business_value(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    company: Optional[str] = None,
    incident_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    corridor: Optional[str] = None,
    confidence_min: Optional[float] = None,
    confidence_max: Optional[float] = None,
):
    df = get_filtered_df(date_from, date_to, company, incident_type, severity, status, corridor, confidence_min, confidence_max)
    return compute_business_value(df)


# --- Agent Benchmark ---

@app.get("/api/agent-benchmark")
def get_agent_benchmark(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    company: Optional[str] = None,
    incident_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    corridor: Optional[str] = None,
    confidence_min: Optional[float] = None,
    confidence_max: Optional[float] = None,
):
    df = get_filtered_df(date_from, date_to, company, incident_type, severity, status, corridor, confidence_min, confidence_max)
    return compute_agent_benchmark(df)


# --- Charts Data ---

@app.get("/api/charts/severity")
def get_severity_distribution(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    company: Optional[str] = None,
    incident_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    corridor: Optional[str] = None,
    confidence_min: Optional[float] = None,
    confidence_max: Optional[float] = None,
):
    df = get_filtered_df(date_from, date_to, company, incident_type, severity, status, corridor, confidence_min, confidence_max)
    return compute_severity_distribution(df)


@app.get("/api/charts/incident-types")
def get_incident_types(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    company: Optional[str] = None,
    incident_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    corridor: Optional[str] = None,
    confidence_min: Optional[float] = None,
    confidence_max: Optional[float] = None,
):
    df = get_filtered_df(date_from, date_to, company, incident_type, severity, status, corridor, confidence_min, confidence_max)
    return compute_incident_type_distribution(df)


@app.get("/api/charts/timeline")
def get_timeline(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    company: Optional[str] = None,
    incident_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    corridor: Optional[str] = None,
    confidence_min: Optional[float] = None,
    confidence_max: Optional[float] = None,
):
    df = get_filtered_df(date_from, date_to, company, incident_type, severity, status, corridor, confidence_min, confidence_max)
    return compute_timeline(df)


@app.get("/api/charts/corridors")
def get_corridors(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    company: Optional[str] = None,
    incident_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    corridor: Optional[str] = None,
    confidence_min: Optional[float] = None,
    confidence_max: Optional[float] = None,
):
    df = get_filtered_df(date_from, date_to, company, incident_type, severity, status, corridor, confidence_min, confidence_max)
    return compute_corridor_analysis(df)


# --- Learnings ---

@app.get("/api/learnings/system")
def get_system_learnings(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    company: Optional[str] = None,
    incident_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    corridor: Optional[str] = None,
    confidence_min: Optional[float] = None,
    confidence_max: Optional[float] = None,
):
    df = get_filtered_df(date_from, date_to, company, incident_type, severity, status, corridor, confidence_min, confidence_max)
    return extract_system_learnings(df)


@app.get("/api/learnings/anecdotal")
def get_anecdotal_learnings():
    return DATA_STORE["anecdotal_learnings"]


@app.get("/api/learnings/combined")
def get_combined_learnings(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    company: Optional[str] = None,
    incident_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    corridor: Optional[str] = None,
    confidence_min: Optional[float] = None,
    confidence_max: Optional[float] = None,
):
    df = get_filtered_df(date_from, date_to, company, incident_type, severity, status, corridor, confidence_min, confidence_max)
    system = extract_system_learnings(df)
    return merge_learnings(system, DATA_STORE["anecdotal_learnings"])


@app.post("/api/learnings/upload")
async def upload_learnings(file: UploadFile = File(...)):
    start = time.time()
    try:
        contents = await file.read()
        df = parse_upload_file(contents, file.filename)
        validation = validate_upload(df)

        if not validation["valid"]:
            raise HTTPException(status_code=400, detail=validation)

        # Store the learnings
        records = df.fillna("").to_dict(orient="records")
        DATA_STORE["anecdotal_learnings"].extend(records)

        upload_time = round(time.time() - start, 2)
        logger.info(f"Upload processed in {upload_time}s: {len(records)} learnings")

        return {
            "status": "success",
            "records_added": len(records),
            "total_learnings": len(DATA_STORE["anecdotal_learnings"]),
            "validation": validation,
            "upload_time": upload_time,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/learnings/upload/validate")
async def validate_upload_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = parse_upload_file(contents, file.filename)
        return validate_upload(df)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- Transaction Drilldown ---

@app.get("/api/transactions")
def get_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    company: Optional[str] = None,
    incident_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    corridor: Optional[str] = None,
    confidence_min: Optional[float] = None,
    confidence_max: Optional[float] = None,
    search: Optional[str] = None,
    internal: bool = False,
):
    df = get_filtered_df(date_from, date_to, company, incident_type, severity, status, corridor, confidence_min, confidence_max)

    if search:
        mask = (
            df["id"].str.contains(search, case=False, na=False)
            | df["alert_id"].str.contains(search, case=False, na=False)
            | df["alert_text"].str.contains(search, case=False, na=False)
            | df["route"].str.contains(search, case=False, na=False)
        )
        df = df[mask]

    total = len(df)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    page_df = df.iloc[start_idx:end_idx]

    # Customer-facing fields
    customer_fields = [
        "id", "alert_id", "alert_name", "alert_text", "status",
        "severity", "resolution_tat_minutes", "computed_confidence_score",
        "performance_summary", "company_name", "route", "location",
        "alert_generated_at", "alert_updated_at", "is_auto_resolved",
    ]

    # Internal-only fields
    internal_fields = [
        "semantic_learning", "improvement_suggestions",
        "confidence_assessment", "evaluation_source",
    ]

    fields = customer_fields + (internal_fields if internal else [])
    available_fields = [f for f in fields if f in page_df.columns]

    records = []
    for _, row in page_df[available_fields].iterrows():
        record = {}
        for col in available_fields:
            val = row[col]
            if pd.isna(val):
                record[col] = None
            elif hasattr(val, "isoformat"):
                record[col] = val.isoformat()
            else:
                record[col] = val
        records.append(record)

    return {
        "data": records,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@app.get("/api/transactions/{transaction_id}")
def get_transaction_detail(transaction_id: str, internal: bool = False):
    df = DATA_STORE["df"]
    row = df[df["id"] == transaction_id]
    if row.empty:
        raise HTTPException(status_code=404, detail="Transaction not found")

    row = row.iloc[0]
    result = {}
    for col in row.index:
        val = row[col]
        if pd.isna(val):
            result[col] = None
        elif hasattr(val, "isoformat"):
            result[col] = val.isoformat()
        else:
            result[col] = val

    if not internal:
        for field in ["semantic_learning", "improvement_suggestions", "confidence_assessment"]:
            result.pop(field, None)

    return result


# --- System Info ---

@app.get("/api/system/health")
def health():
    return {
        "status": "healthy",
        "dataset_loaded": DATA_STORE["df"] is not None,
        "total_records": len(DATA_STORE["df"]) if DATA_STORE["df"] is not None else 0,
        "load_time": DATA_STORE["load_time"],
        "eval_time": DATA_STORE["eval_time"],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
