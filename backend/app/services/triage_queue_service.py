"""Triage queue and status workflow management for request processing."""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional


class RequestStatus(str, Enum):
    """Valid request status transitions."""

    SUBMITTED = "submitted"
    TRIAGED = "triaged"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"
    ESCALATED = "escalated"
    REJECTED = "rejected"


class Triage(str, Enum):
    """Triage level for queue prioritization."""

    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


def build_triage_queue(requests: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Build a prioritized triage queue sorted by urgency and SLA."""
    queue = []
    for req in requests:
        if req.get("status") not in ["closed", "resolved", "rejected"]:
            queue.append({
                "request_id": req.get("request_id"),
                "citizen_id": req.get("citizen_id"),
                "category": req.get("category"),
                "location": req.get("location"),
                "urgency": req.get("urgency", 0.0),
                "severity_band": req.get("severity_band", "medium"),
                "routed_agency": req.get("routed_agency"),
                "sla_hours": req.get("sla_hours", 0),
                "escalation_priority": req.get("escalation_priority", 3),
                "triage_score": req.get("triage_score", 0.0),
                "status": req.get("status", "submitted"),
                "original_text": req.get("original_text", ""),
                "population_affected": req.get("population_affected", 0),
            })

    queue.sort(
        key=lambda x: (
            x["escalation_priority"],
            -x["triage_score"],
            -x["urgency"],
        )
    )
    return queue


def filter_requests_by_criteria(
    requests: List[Dict[str, Any]],
    filters: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """Filter requests by multiple criteria for dashboard queries."""
    filtered = requests

    if category := filters.get("category"):
        filtered = [r for r in filtered if r.get("category") == category]

    if status := filters.get("status"):
        filtered = [r for r in filtered if r.get("status") == status]

    if language := filters.get("language"):
        filtered = [r for r in filtered if r.get("language") == language]

    if agency := filters.get("routed_agency"):
        filtered = [r for r in filtered if r.get("routed_agency") == agency]

    if severity_band := filters.get("severity_band"):
        filtered = [r for r in filtered if r.get("severity_band") == severity_band]

    if location := filters.get("location"):
        filtered = [r for r in filtered if location.lower() in r.get("location", "").lower()]

    if min_urgency := filters.get("min_urgency"):
        filtered = [r for r in filtered if r.get("urgency", 0.0) >= min_urgency]

    if min_population := filters.get("min_population"):
        filtered = [r for r in filtered if r.get("population_affected", 0) >= min_population]

    return filtered


def compute_sla_breach_risk(request: Dict[str, Any], hours_elapsed: float) -> Dict[str, Any]:
    """Compute SLA breach risk and recommend escalation."""
    sla_hours = request.get("sla_hours", 0)
    if sla_hours == 0:
        return {"at_risk": False, "breach_risk_percentage": 0.0, "recommended_action": "monitor"}

    breach_risk_percentage = round((hours_elapsed / sla_hours) * 100, 1)
    at_risk = breach_risk_percentage >= 75
    imminent_breach = breach_risk_percentage >= 95

    recommended_action = "monitor"
    if imminent_breach:
        recommended_action = "escalate_immediately"
    elif at_risk:
        recommended_action = "escalate_soon"

    return {
        "at_risk": at_risk,
        "hours_elapsed": hours_elapsed,
        "sla_hours": sla_hours,
        "breach_risk_percentage": breach_risk_percentage,
        "imminent_breach": imminent_breach,
        "recommended_action": recommended_action,
    }


def validate_status_transition(current_status: str, new_status: str) -> Dict[str, Any]:
    """Validate if a status transition is allowed."""
    allowed_transitions = {
        RequestStatus.SUBMITTED: [RequestStatus.TRIAGED, RequestStatus.ASSIGNED, RequestStatus.REJECTED],
        RequestStatus.TRIAGED: [RequestStatus.ASSIGNED, RequestStatus.IN_PROGRESS, RequestStatus.RESOLVED, RequestStatus.CLOSED, RequestStatus.ESCALATED, RequestStatus.REJECTED],
        RequestStatus.ASSIGNED: [RequestStatus.IN_PROGRESS, RequestStatus.RESOLVED, RequestStatus.CLOSED, RequestStatus.REJECTED],
        RequestStatus.IN_PROGRESS: [RequestStatus.RESOLVED, RequestStatus.CLOSED, RequestStatus.ESCALATED],
        RequestStatus.RESOLVED: [RequestStatus.CLOSED, RequestStatus.IN_PROGRESS],
        RequestStatus.ESCALATED: [RequestStatus.IN_PROGRESS, RequestStatus.RESOLVED, RequestStatus.ASSIGNED],
        RequestStatus.CLOSED: [RequestStatus.TRIAGED, RequestStatus.IN_PROGRESS],
        RequestStatus.REJECTED: [RequestStatus.TRIAGED, RequestStatus.SUBMITTED],
    }

    try:
        current = RequestStatus(current_status) if isinstance(current_status, str) else current_status
        new = RequestStatus(new_status) if isinstance(new_status, str) else new_status
    except ValueError as e:
        return {
            "current_status": current_status,
            "new_status": new_status,
            "is_valid": False,
            "reason": f"Invalid status: {str(e)}",
        }

    is_valid = new in allowed_transitions.get(current, [])

    return {
        "current_status": current_status,
        "new_status": new_status,
        "is_valid": is_valid,
        "reason": "Valid transition" if is_valid else f"Cannot transition from {current_status} to {new_status}",
    }
