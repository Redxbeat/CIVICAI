"""Audit logging for request status changes and workflow events."""

from __future__ import annotations

from typing import Any, Dict, List, Optional


def log_status_change(
    request_id: str,
    old_status: str,
    new_status: str,
    changed_by: str,
    reason: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Create an audit log entry for status changes."""
    return {
        "request_id": request_id,
        "old_status": old_status,
        "new_status": new_status,
        "changed_by": changed_by,
        "changed_at": None,  # Will be set by database timestamp
        "reason": reason or "No reason provided",
        "metadata": metadata or {},
    }


def log_escalation(
    request_id: str,
    escalation_level: str,
    reason: str,
    escalated_by: str,
    to_agency: Optional[str] = None,
) -> Dict[str, Any]:
    """Create an audit log entry for escalation events."""
    return {
        "request_id": request_id,
        "event_type": "escalation",
        "escalation_level": escalation_level,
        "reason": reason,
        "escalated_by": escalated_by,
        "to_agency": to_agency,
        "timestamp": None,  # Will be set by database
    }


def log_assignment(
    request_id: str,
    assigned_to_agency: str,
    assigned_by: str,
    notes: Optional[str] = None,
) -> Dict[str, Any]:
    """Create an audit log entry for assignment events."""
    return {
        "request_id": request_id,
        "event_type": "assignment",
        "assigned_to_agency": assigned_to_agency,
        "assigned_by": assigned_by,
        "assigned_at": None,  # Will be set by database timestamp
        "notes": notes or "",
    }


def log_sla_event(
    request_id: str,
    event_type: str,
    sla_hours: int,
    hours_elapsed: float,
    agency: str,
) -> Dict[str, Any]:
    """Create an audit log entry for SLA-related events (at-risk, breach, etc.)."""
    return {
        "request_id": request_id,
        "event_type": f"sla_{event_type}",
        "sla_hours": sla_hours,
        "hours_elapsed": hours_elapsed,
        "agency": agency,
        "timestamp": None,  # Will be set by database timestamp
    }


def build_audit_trail(audit_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Summarize the complete audit trail for a request."""
    if not audit_logs:
        return {
            "total_events": 0,
            "status_changes": [],
            "escalations": [],
            "assignments": [],
            "sla_events": [],
        }

    trail = {
        "total_events": len(audit_logs),
        "status_changes": [log for log in audit_logs if log.get("event_type") is None or log.get("old_status")],
        "escalations": [log for log in audit_logs if log.get("event_type") == "escalation"],
        "assignments": [log for log in audit_logs if log.get("event_type") == "assignment"],
        "sla_events": [log for log in audit_logs if log.get("event_type", "").startswith("sla_")],
    }

    return trail
