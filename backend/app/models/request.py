from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text, JSON

from app.core.database import Base


class CitizenRequest(Base):
    __tablename__ = "citizen_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String, unique=True, index=True, nullable=False)
    citizen_id = Column(String, nullable=False)
    language = Column(String, default="Malayalam")
    original_text = Column(Text, nullable=False)
    translated_text = Column(Text)
    category = Column(String, nullable=False)
    subcategory = Column(String)
    location = Column(String, nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    administrative_region = Column(String)
    urgency = Column(Float, default=0.0)
    severity = Column(String, default="medium")
    population_affected = Column(Integer, default=0)
    infrastructure_type = Column(String)
    sentiment = Column(String, default="neutral")
    verification_status = Column(String, default="pending")
    duplicate_probability = Column(Float, default=0.0)
    ai_confidence = Column(Float, default=0.0)
    evidence = Column(Text)
    status = Column(String, default="submitted")
    normalized_content = Column(Text)
    extracted_entities = Column(JSON)
    content_quality = Column(String, default="good")
    triage_score = Column(Float, default=0.0)
    severity_band = Column(String, default="medium")
    routed_agency = Column(String)
    backup_agencies = Column(JSON)
    escalation_level = Column(String, default="normal")
    sla_hours = Column(Integer, default=0)
    escalation_priority = Column(Integer, default=3)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    assigned_to = Column(String)  # Agency staff member
    assigned_at = Column(DateTime)
