"""Agency Routing & Triage Scoring Engine."""

from __future__ import annotations

from typing import Any, Dict, List


AGENCY_ROUTING_MAP = {
    "Roads": {
        "primary_agency": "Public Works Department (PWD)",
        "backup_agencies": ["Municipal Engineering", "District Administration"],
        "sla_hours": 72,
        "escalation_priority": 3,
    },
    "Healthcare": {
        "primary_agency": "District Health Officer (DHO)",
        "backup_agencies": ["State Health Department", "Primary Health Centre"],
        "sla_hours": 2,
        "escalation_priority": 1,
    },
    "Drinking Water": {
        "primary_agency": "Water Authority",
        "backup_agencies": ["Water Resources Department", "District Administration"],
        "sla_hours": 48,
        "escalation_priority": 2,
    },
    "Electricity": {
        "primary_agency": "Electricity Board",
        "backup_agencies": ["State Power Ministry", "District Administration"],
        "sla_hours": 24,
        "escalation_priority": 2,
    },
    "Education": {
        "primary_agency": "Department of Education",
        "backup_agencies": ["District Education Officer", "State Education Board"],
        "sla_hours": 168,
        "escalation_priority": 4,
    },
    "Internet Connectivity": {
        "primary_agency": "Telecom Regulatory Authority",
        "backup_agencies": ["District Administration", "State IT Ministry"],
        "sla_hours": 120,
        "escalation_priority": 4,
    },
    "Public Transport": {
        "primary_agency": "Transport Department",
        "backup_agencies": ["State Road Transport Corporation", "District Administration"],
        "sla_hours": 96,
        "escalation_priority": 3,
    },
    "Sanitation": {
        "primary_agency": "Municipal/Panchayat Sanitation",
        "backup_agencies": ["State Sanitation Board", "District Health Officer"],
        "sla_hours": 72,
        "escalation_priority": 2,
    },
}


def route_to_agency(category: str, urgency: float, location: str) -> Dict[str, Any]:
    """Determine primary & backup government agencies, response SLA, and escalation level."""
    urgency = urgency if urgency is not None else 5.0
    agency_info = AGENCY_ROUTING_MAP.get(category, {
        "primary_agency": "District Administration",
        "backup_agencies": ["State Government"],
        "sla_hours": 120,
        "escalation_priority": 3,
    })

    escalation = "critical" if urgency >= 9.0 else "high" if urgency >= 7.5 else "normal"
    sla_hours = agency_info["sla_hours"]
    if escalation == "critical":
        sla_hours = max(1, sla_hours // 4)

    return {
        "category": category,
        "routed_agency": agency_info["primary_agency"],
        "backup_agencies": agency_info["backup_agencies"],
        "escalation_level": escalation,
        "sla_hours": sla_hours,
        "escalation_priority": agency_info["escalation_priority"],
        "triage_timestamp": "2026-08-31T00:00:00Z",
        "target_location": location,
    }


def compute_triage_score(
    category: str,
    urgency: float,
    population_affected: int,
    duplicate_probability: float,
) -> Dict[str, Any]:
    """Compute overall priority triage score and severity band."""
    urgency = urgency if urgency is not None else 5.0
    population_affected = population_affected if population_affected is not None else 2500
    duplicate_probability = duplicate_probability if duplicate_probability is not None else 0.12

    base_urgency = urgency * 0.4
    impact_score = min(10.0, (population_affected / 1000.0) * 0.3)
    duplicate_penalty = duplicate_probability * 0.3
    final_score = base_urgency + impact_score - duplicate_penalty

    severity_band = (
        "critical" if final_score >= 8.0
        else "high" if final_score >= 6.0
        else "medium" if final_score >= 3.0
        else "low"
    )

    return {
        "triage_score": round(final_score, 2),
        "severity_band": severity_band,
        "urgency_component": round(base_urgency, 2),
        "impact_component": round(impact_score, 2),
        "duplicate_penalty": round(duplicate_penalty, 2),
    }
