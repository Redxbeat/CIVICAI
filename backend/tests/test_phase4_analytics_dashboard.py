"""Test suite for Phase 4 analytics and triage dashboard backend."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

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


def test_compute_request_metrics():
    """Test aggregation of request metrics."""
    requests = [
        {
            "request_id": "CIV-001",
            "category": "Roads",
            "status": "submitted",
            "language": "Malayalam",
            "severity_band": "critical",
            "urgency": 9.2,
            "triage_score": 8.76,
        },
        {
            "request_id": "CIV-002",
            "category": "Healthcare",
            "status": "assigned",
            "language": "Hindi",
            "severity_band": "high",
            "urgency": 8.9,
            "triage_score": 8.41,
        },
        {
            "request_id": "CIV-003",
            "category": "Drinking Water",
            "status": "submitted",
            "language": "Malayalam",
            "severity_band": "high",
            "urgency": 7.8,
            "triage_score": 6.24,
        },
    ]

    metrics = compute_request_metrics(requests)

    assert metrics["total_requests"] == 3
    assert metrics["by_category"]["Roads"] == 1
    assert metrics["by_category"]["Healthcare"] == 1
    assert metrics["by_category"]["Drinking Water"] == 1
    assert metrics["by_status"]["submitted"] == 2
    assert metrics["by_status"]["assigned"] == 1
    assert metrics["by_language"]["Malayalam"] == 2
    assert metrics["by_language"]["Hindi"] == 1
    assert metrics["critical_count"] == 1
    assert metrics["high_count"] == 2
    assert metrics["urgency_stats"]["min"] == 7.8
    assert metrics["urgency_stats"]["max"] == 9.2
    assert metrics["average_triage_score"] > 7.0

    print("✅ compute_request_metrics passed")


def test_compute_agency_workload():
    """Test agency workload distribution."""
    requests = [
        {
            "request_id": "CIV-001",
            "routed_agency": "Public Works Department (PWD)",
            "status": "submitted",
            "severity_band": "critical",
            "sla_hours": 72,
        },
        {
            "request_id": "CIV-002",
            "routed_agency": "District Health Officer (DHO)",
            "status": "assigned",
            "severity_band": "critical",
            "sla_hours": 2,
        },
        {
            "request_id": "CIV-003",
            "routed_agency": "Public Works Department (PWD)",
            "status": "in_progress",
            "severity_band": "high",
            "sla_hours": 72,
        },
    ]

    workload = compute_agency_workload(requests)

    assert "Public Works Department (PWD)" in workload
    assert "District Health Officer (DHO)" in workload
    assert workload["Public Works Department (PWD)"]["total_queue"] == 2
    assert workload["Public Works Department (PWD)"]["critical"] == 1
    assert workload["Public Works Department (PWD)"]["high"] == 1
    assert workload["District Health Officer (DHO)"]["total_queue"] == 1
    assert workload["District Health Officer (DHO)"]["critical"] == 1

    print("✅ compute_agency_workload passed")


def test_compute_geographic_hotspots():
    """Test geographic hotspot identification."""
    requests = [
        {
            "request_id": "CIV-001",
            "administrative_region": "Ernakulam",
            "category": "Roads",
            "urgency": 9.2,
            "population_affected": 4200,
        },
        {
            "request_id": "CIV-002",
            "administrative_region": "Ernakulam",
            "category": "Healthcare",
            "urgency": 8.9,
            "population_affected": 5800,
        },
        {
            "request_id": "CIV-003",
            "administrative_region": "Thrissur",
            "category": "Drinking Water",
            "urgency": 7.8,
            "population_affected": 3100,
        },
    ]

    hotspots = compute_geographic_hotspots(requests)

    assert "Ernakulam" in hotspots
    assert "Thrissur" in hotspots
    assert hotspots["Ernakulam"]["total_requests"] == 2
    assert hotspots["Thrissur"]["total_requests"] == 1
    assert hotspots["Ernakulam"]["total_population_affected"] == 10000
    assert hotspots["Ernakulam"]["avg_urgency"] > 9.0

    print("✅ compute_geographic_hotspots passed")


def test_compute_language_distribution():
    """Test language distribution analysis."""
    requests = [
        {
            "request_id": "CIV-001",
            "language": "Malayalam",
            "category": "Roads",
            "ai_confidence": 0.94,
        },
        {
            "request_id": "CIV-002",
            "language": "Malayalam",
            "category": "Drinking Water",
            "ai_confidence": 0.90,
        },
        {
            "request_id": "CIV-003",
            "language": "Hindi",
            "category": "Healthcare",
            "ai_confidence": 0.92,
        },
    ]

    distribution = compute_language_distribution(requests)

    assert "Malayalam" in distribution
    assert "Hindi" in distribution
    assert distribution["Malayalam"]["total"] == 2
    assert distribution["Hindi"]["total"] == 1
    assert "Roads" in distribution["Malayalam"]["by_category"]
    assert "Drinking Water" in distribution["Malayalam"]["by_category"]
    assert distribution["Malayalam"]["avg_ai_confidence"] > 0.89

    print("✅ compute_language_distribution passed")


def test_build_triage_queue():
    """Test triage queue prioritization."""
    requests = [
        {
            "request_id": "CIV-001",
            "status": "submitted",
            "category": "Roads",
            "severity_band": "critical",
            "urgency": 9.2,
            "triage_score": 8.76,
            "escalation_priority": 1,
            "sla_hours": 72,
            "routed_agency": "PWD",
            "location": "Kochi",
            "citizen_id": "citizen-001",
            "original_text": "Road issue",
            "population_affected": 4200,
        },
        {
            "request_id": "CIV-002",
            "status": "submitted",
            "category": "Healthcare",
            "severity_band": "critical",
            "urgency": 8.9,
            "triage_score": 8.41,
            "escalation_priority": 1,
            "sla_hours": 2,
            "routed_agency": "DHO",
            "location": "Palakkad",
            "citizen_id": "citizen-002",
            "original_text": "Healthcare issue",
            "population_affected": 5800,
        },
        {
            "request_id": "CIV-003",
            "status": "closed",  # Should be filtered out
            "category": "Water",
            "severity_band": "medium",
            "urgency": 5.0,
            "triage_score": 4.0,
            "escalation_priority": 3,
            "sla_hours": 48,
            "routed_agency": "Water Auth",
            "location": "Thrissur",
            "citizen_id": "citizen-003",
            "original_text": "Water issue",
            "population_affected": 3100,
        },
    ]

    queue = build_triage_queue(requests)

    assert len(queue) == 2  # Only active requests
    assert queue[0]["severity_band"] in ["critical", "high"]
    assert queue[1]["severity_band"] in ["critical", "high"]

    print("✅ build_triage_queue passed")


def test_filter_requests_by_criteria():
    """Test request filtering."""
    requests = [
        {
            "request_id": "CIV-001",
            "category": "Roads",
            "status": "submitted",
            "language": "Malayalam",
            "severity_band": "critical",
            "location": "Kochi",
            "urgency": 9.2,
            "population_affected": 4200,
            "routed_agency": "PWD",
        },
        {
            "request_id": "CIV-002",
            "category": "Healthcare",
            "status": "assigned",
            "language": "Hindi",
            "severity_band": "critical",
            "location": "Palakkad",
            "urgency": 8.9,
            "population_affected": 5800,
            "routed_agency": "DHO",
        },
    ]

    filtered = filter_requests_by_criteria(requests, {"category": "Roads"})
    assert len(filtered) == 1
    assert filtered[0]["request_id"] == "CIV-001"

    filtered = filter_requests_by_criteria(requests, {"language": "Hindi"})
    assert len(filtered) == 1
    assert filtered[0]["request_id"] == "CIV-002"

    filtered = filter_requests_by_criteria(requests, {"min_urgency": 9.0})
    assert len(filtered) == 1
    assert filtered[0]["urgency"] >= 9.0

    print("✅ filter_requests_by_criteria passed")


def test_compute_sla_breach_risk():
    """Test SLA breach risk calculation."""
    request = {
        "request_id": "CIV-001",
        "sla_hours": 72,
        "routed_agency": "PWD",
    }

    # At 50% of SLA time
    risk = compute_sla_breach_risk(request, 36.0)
    assert risk["at_risk"] is False
    assert risk["breach_risk_percentage"] == 50.0

    # At 80% of SLA time - at risk
    risk = compute_sla_breach_risk(request, 58.0)
    assert risk["at_risk"] is True
    assert risk["recommended_action"] == "escalate_soon"

    # At 97% of SLA time - imminent breach
    risk = compute_sla_breach_risk(request, 70.0)
    assert risk["at_risk"] is True
    assert risk["imminent_breach"] is True
    assert risk["recommended_action"] == "escalate_immediately"

    print("✅ compute_sla_breach_risk passed")


def test_validate_status_transition():
    """Test status transition validation."""
    # Valid: submitted → triaged
    result = validate_status_transition("submitted", "triaged")
    assert result["is_valid"] is True

    # Valid: triaged → assigned
    result = validate_status_transition("triaged", "assigned")
    assert result["is_valid"] is True

    # Valid: assigned → in_progress
    result = validate_status_transition("assigned", "in_progress")
    assert result["is_valid"] is True

    # Valid: in_progress → resolved
    result = validate_status_transition("in_progress", "resolved")
    assert result["is_valid"] is True

    # Valid: resolved → closed
    result = validate_status_transition("resolved", "closed")
    assert result["is_valid"] is True

    # Invalid: submitted → in_progress (must go through triaged/assigned)
    result = validate_status_transition("submitted", "in_progress")
    assert result["is_valid"] is False

    # Invalid: closed → anything
    result = validate_status_transition("closed", "reopened")
    assert result["is_valid"] is False

    print("✅ validate_status_transition passed")


if __name__ == "__main__":
    test_compute_request_metrics()
    test_compute_agency_workload()
    test_compute_geographic_hotspots()
    test_compute_language_distribution()
    test_build_triage_queue()
    test_filter_requests_by_criteria()
    test_compute_sla_breach_risk()
    test_validate_status_transition()
    print("\n✅ All Phase 4 dashboard tests passed!")
