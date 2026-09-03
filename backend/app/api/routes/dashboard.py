"""Dashboard and analytics API routes for request management and monitoring."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.request import CitizenRequest
from app.schemas.request import RequestRead
from app.services.analytics_service import (
    compute_agency_workload,
    compute_geographic_hotspots,
    compute_language_distribution,
    compute_request_metrics,
)
from app.services.triage_queue_service import (
    build_triage_queue,
    compute_sla_breach_risk,
    filter_requests_by_criteria,
    validate_status_transition,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/metrics")
def get_request_metrics(
    db: Session = Depends(get_db),
):
    """Get aggregated metrics across all requests."""
    requests = db.query(CitizenRequest).all()
    requests_dict = [RequestRead.model_validate(r).model_dump() for r in requests]
    metrics = compute_request_metrics(requests_dict)
    return metrics


@router.get("/agency-workload")
def get_agency_workload(
    db: Session = Depends(get_db),
):
    """Get workload distribution across agencies."""
    requests = db.query(CitizenRequest).all()
    requests_dict = [RequestRead.model_validate(r).model_dump() for r in requests]
    workload = compute_agency_workload(requests_dict)
    return workload


@router.get("/geographic-hotspots")
def get_geographic_hotspots(
    db: Session = Depends(get_db),
):
    """Get geographic regions with high issue concentration."""
    requests = db.query(CitizenRequest).all()
    requests_dict = [RequestRead.model_validate(r).model_dump() for r in requests]
    hotspots = compute_geographic_hotspots(requests_dict)
    return hotspots


@router.get("/language-distribution")
def get_language_distribution(
    db: Session = Depends(get_db),
):
    """Get language distribution and multilingual patterns."""
    requests = db.query(CitizenRequest).all()
    requests_dict = [RequestRead.model_validate(r).model_dump() for r in requests]
    distribution = compute_language_distribution(requests_dict)
    return distribution


@router.get("/triage-queue")
def get_triage_queue(
    agency: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    severity_band: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Get prioritized triage queue with optional filtering."""
    requests = db.query(CitizenRequest).all()
    requests_dict = [RequestRead.model_validate(r).model_dump() for r in requests]

    if agency:
        requests_dict = [r for r in requests_dict if r["routed_agency"] == agency]

    if status:
        requests_dict = [r for r in requests_dict if r["status"] == status]

    if severity_band:
        requests_dict = [r for r in requests_dict if r["severity_band"] == severity_band]

    queue = build_triage_queue(requests_dict)
    return {"queue_length": len(queue), "queue": queue}


@router.post("/request/{request_id}/status")
def update_request_status(
    request_id: str,
    new_status: str,
    db: Session = Depends(get_db),
):
    """Update request status with validation."""
    request = db.query(CitizenRequest).filter(CitizenRequest.request_id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    validation = validate_status_transition(request.status, new_status)
    if not validation["is_valid"]:
        raise HTTPException(status_code=400, detail=validation["reason"])

    request.status = new_status
    db.commit()
    db.refresh(request)

    return {"success": True, "request_id": request_id, "new_status": new_status}


@router.get("/request/{request_id}/sla-status")
def get_request_sla_status(
    request_id: str,
    hours_elapsed: Optional[float] = Query(0.0),
    db: Session = Depends(get_db),
):
    """Get SLA breach risk for a specific request."""
    request = db.query(CitizenRequest).filter(CitizenRequest.request_id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    request_dict = RequestRead.model_validate(request).model_dump()
    sla_status = compute_sla_breach_risk(request_dict, hours_elapsed)

    return {
        "request_id": request_id,
        "agency": request.routed_agency,
        "status": request.status,
        "sla_status": sla_status,
    }


@router.get("/requests/search")
def search_requests(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    agency: Optional[str] = Query(None),
    severity_band: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    min_urgency: Optional[float] = Query(None),
    min_population: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """Search requests with multiple filter criteria."""
    requests = db.query(CitizenRequest).all()
    requests_dict = [RequestRead.model_validate(r).model_dump() for r in requests]

    filters = {}
    if category:
        filters["category"] = category
    if status:
        filters["status"] = status
    if language:
        filters["language"] = language
    if agency:
        filters["routed_agency"] = agency
    if severity_band:
        filters["severity_band"] = severity_band
    if location:
        filters["location"] = location
    if min_urgency is not None:
        filters["min_urgency"] = min_urgency
    if min_population is not None:
        filters["min_population"] = min_population

    filtered = filter_requests_by_criteria(requests_dict, filters)

    return {
        "total_results": len(filtered),
        "filters": filters,
        "results": filtered,
    }


@router.post("/request/{request_id}/assign")
def assign_request_to_staff(
    request_id: str,
    assigned_to: str,
    db: Session = Depends(get_db),
):
    """Assign a request to agency staff member."""
    request = db.query(CitizenRequest).filter(CitizenRequest.request_id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    from datetime import datetime

    request.assigned_to = assigned_to
    request.assigned_at = datetime.utcnow()
    request.status = "assigned"
    db.commit()
    db.refresh(request)

    return {
        "success": True,
        "request_id": request_id,
        "assigned_to": assigned_to,
        "status": request.status,
    }


@router.get("/audit-logs")
def get_audit_logs(
    agency: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Get system audit logs for administrative monitoring and tracking."""
    requests = db.query(CitizenRequest).all()
    logs = []
    for r in requests:
        # Creation audit log
        logs.append({
            "id": f"log-created-{r.request_id}",
            "request_id": r.request_id,
            "event_type": "request_created",
            "action": "Intake & Automated AI Triage",
            "details": f"Request intake triaged to {r.routed_agency} with {r.severity_band.upper()} severity",
            "agency": r.routed_agency or "Unassigned",
            "actor": "CIVICAI Engine",
            "timestamp": r.created_at.isoformat() if r.created_at else "2026-08-30T10:00:00Z",
            "status": r.status,
            "severity_band": r.severity_band,
        })

        # Assignment log if assigned
        if r.assigned_to:
            logs.append({
                "id": f"log-assign-{r.request_id}",
                "request_id": r.request_id,
                "event_type": "assignment",
                "action": "Staff Assignment",
                "details": f"Request assigned to officer {r.assigned_to}",
                "agency": r.routed_agency or "Unassigned",
                "actor": "Agency Admin",
                "timestamp": r.assigned_at.isoformat() if r.assigned_at else (r.updated_at.isoformat() if r.updated_at else "2026-08-30T11:00:00Z"),
                "status": r.status,
                "severity_band": r.severity_band,
            })

        # SLA status log if high or critical
        if r.severity_band in ["critical", "high"]:
            logs.append({
                "id": f"log-sla-{r.request_id}",
                "request_id": r.request_id,
                "event_type": "sla_monitoring",
                "action": "SLA Priority Watch",
                "details": f"SLA window {r.sla_hours}h active for {r.routed_agency}",
                "agency": r.routed_agency or "Unassigned",
                "actor": "System Monitor",
                "timestamp": r.created_at.isoformat() if r.created_at else "2026-08-30T10:00:00Z",
                "status": r.status,
                "severity_band": r.severity_band,
            })

    if agency:
        logs = [l for l in logs if l.get("agency") == agency]
    if event_type:
        logs = [l for l in logs if l.get("event_type") == event_type]

    logs.sort(key=lambda x: x["timestamp"], reverse=True)
    return {"total_logs": len(logs), "logs": logs}

