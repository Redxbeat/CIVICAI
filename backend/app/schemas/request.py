from typing import Any, Dict, List, Optional
from datetime import datetime

from pydantic import BaseModel, Field


class RequestCreate(BaseModel):
    original_text: str = Field(..., min_length=5)
    language: Optional[str] = "Malayalam"
    category: Optional[str] = None
    subcategory: Optional[str] = None
    location: str = "Kochi"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    urgency: Optional[float] = None
    administrative_region: Optional[str] = None
    sentiment: Optional[str] = None
    translated_text: Optional[str] = None
    citizen_id: Optional[str] = "anon-citizen-000"
    population_affected: Optional[int] = 2500
    evidence: Optional[str] = None


class RequestRead(BaseModel):
    id: int
    request_id: str
    citizen_id: str
    language: str
    original_text: str
    translated_text: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    administrative_region: Optional[str] = None
    urgency: float = 0.0
    severity: str = "medium"
    population_affected: int = 0
    infrastructure_type: Optional[str] = None
    sentiment: str = "neutral"
    verification_status: str = "pending"
    duplicate_probability: float = 0.0
    ai_confidence: float = 0.0
    evidence: Optional[str] = None
    status: str = "submitted"
    normalized_content: Optional[str] = None
    extracted_entities: Optional[Dict[str, Any]] = None
    content_quality: str = "good"
    triage_score: float = 0.0
    severity_band: str = "medium"
    routed_agency: Optional[str] = None
    backup_agencies: Optional[List[str]] = None
    escalation_level: str = "normal"
    sla_hours: int = 0
    escalation_priority: int = 3
    created_at: datetime
    updated_at: datetime
    assigned_to: Optional[str] = None
    assigned_at: Optional[datetime] = None

    class Config:
        from_attributes = True
