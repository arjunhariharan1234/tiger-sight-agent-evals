from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean, Text, Enum as SAEnum, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
import enum

Base = declarative_base()

DATABASE_URL = "postgresql://localhost:5432/ai_evals"


class SeverityLevel(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ResolutionStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    RESOLVED = "RESOLVED"
    AUTO_RESOLVED = "AUTO_RESOLVED"


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True)
    alert_id = Column(String, index=True)
    alert_name = Column(String, index=True)  # incident_type
    alert_text = Column(Text)
    parent_id = Column(String)
    parent_name = Column(String)
    alert_status = Column(String)
    status = Column(String, index=True)  # resolution_mode
    category = Column(String)
    source = Column(String)
    source_type = Column(String)
    tenant_id = Column(String, index=True)
    severity = Column(String, index=True)
    risk_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    user_id = Column(String, nullable=True)

    # Alert data fields
    location = Column(Text, nullable=True)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    company_name = Column(String, nullable=True)
    driver_name = Column(String, nullable=True)
    driver_number = Column(String, nullable=True)
    duration_minutes = Column(Float, nullable=True)
    party_type = Column(String, nullable=True)
    route = Column(Text, nullable=True)
    transporter_id = Column(String, nullable=True)
    transporter_name = Column(String, nullable=True)
    transporter_phone = Column(String, nullable=True)
    vehicle_number = Column(String, nullable=True)

    # Timestamps
    alert_generated_at = Column(DateTime, nullable=True)
    alert_updated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    # Derived fields
    resolution_tat_minutes = Column(Float, nullable=True)
    is_critical = Column(Boolean, default=False)
    is_auto_resolved = Column(Boolean, default=False)

    # Evaluation fields
    performance_summary = Column(Text, nullable=True)
    semantic_learning = Column(Text, nullable=True)
    improvement_suggestions = Column(Text, nullable=True)
    confidence_assessment = Column(String, nullable=True)
    evaluation_source = Column(String, nullable=True)


class AnecdotalLearning(Base):
    __tablename__ = "anecdotal_learnings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_type = Column(String, index=True)
    incident_type = Column(String, index=True)
    scenario = Column(Text)
    manager_learning = Column(Text)
    instruction = Column(Text)
    recommended_action = Column(Text)
    priority = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    updated_by = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class EvalMetrics(Base):
    __tablename__ = "eval_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    metric_name = Column(String, index=True)
    metric_value = Column(Float)
    metric_category = Column(String)
    agent_type = Column(String, nullable=True)
    computed_at = Column(DateTime, default=datetime.utcnow)
    filters_applied = Column(Text, nullable=True)


def get_engine(url=None):
    return create_engine(url or DATABASE_URL)


def get_session(engine=None):
    if engine is None:
        engine = get_engine()
    Session = sessionmaker(bind=engine)
    return Session()
