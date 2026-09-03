from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.request import CitizenRequest
from app.schemas.request import RequestCreate, RequestRead
from app.services.request_classifier import build_request_record

router = APIRouter(prefix="/requests", tags=["requests"])


@router.get("/health")
def requests_health():
    return {"status": "ok", "service": "requests"}


@router.post("", response_model=RequestRead, status_code=status.HTTP_201_CREATED)
def create_request(payload: RequestCreate, db: Session = Depends(get_db)):
    request_data = build_request_record(payload.model_dump())
    request_id = f"CIV-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{len(db.query(CitizenRequest).all()) + 1:04d}"
    request_data["request_id"] = request_id
    request_data["citizen_id"] = payload.citizen_id or "anon-citizen-000"

    request_model = CitizenRequest(
        request_id=request_data["request_id"],
        citizen_id=request_data["citizen_id"],
        language=request_data["language"],
        original_text=request_data["original_text"],
        translated_text=request_data["translated_text"],
        category=request_data["category"],
        subcategory=request_data["subcategory"],
        location=request_data["location"],
        latitude=request_data["latitude"],
        longitude=request_data["longitude"],
        administrative_region=request_data["administrative_region"],
        urgency=request_data["urgency"],
        severity="medium",
        population_affected=request_data["population_affected"],
        infrastructure_type=request_data["infrastructure_type"],
        sentiment=request_data["sentiment"],
        verification_status="pending",
        duplicate_probability=0.12,
        ai_confidence=request_data["ai_confidence"],
        evidence=request_data["evidence"],
        status=request_data["status"],
        normalized_content=request_data["normalized_content"],
        extracted_entities=request_data["extracted_entities"],
        content_quality=request_data["content_quality"],
        triage_score=request_data["triage_score"],
        severity_band=request_data["severity_band"],
        routed_agency=request_data["routed_agency"],
        backup_agencies=request_data["backup_agencies"],
        escalation_level=request_data["escalation_level"],
        sla_hours=request_data["sla_hours"],
        escalation_priority=request_data["escalation_priority"],
    )
    db.add(request_model)
    db.commit()
    db.refresh(request_model)
    return request_model


@router.get("", response_model=list[RequestRead])
def list_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return db.query(CitizenRequest).offset(skip).limit(limit).all()


@router.get("/{request_id}", response_model=RequestRead)
def get_request(request_id: str, db: Session = Depends(get_db)):
    item = db.query(CitizenRequest).filter(CitizenRequest.request_id == request_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return item
