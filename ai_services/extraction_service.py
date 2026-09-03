"""Entity and content extraction service for citizen requests."""

from __future__ import annotations

from typing import Any, Dict

# Known geographic locations and metadata
KNOWN_LOCATIONS = {
    "kochi": {"state": "Kerala", "district": "Ernakulam", "coordinates": [9.9312, 76.2673]},
    "ernakulam": {"state": "Kerala", "district": "Ernakulam", "coordinates": [9.9816, 76.2999]},
    "thiruvananthapuram": {"state": "Kerala", "district": "Thiruvananthapuram", "coordinates": [8.5241, 76.9366]},
    "thrissur": {"state": "Kerala", "district": "Thrissur", "coordinates": [10.5276, 76.2144]},
    "palakkad": {"state": "Kerala", "district": "Palakkad", "coordinates": [10.7867, 76.6548]},
    "calicut": {"state": "Kerala", "district": "Kozhikode", "coordinates": [11.2588, 75.7804]},
    "bangalore": {"state": "Karnataka", "district": "Bangalore", "coordinates": [12.9716, 77.5946]},
    "mumbai": {"state": "Maharashtra", "district": "Mumbai", "coordinates": [19.0760, 72.8777]},
    "delhi": {"state": "Delhi", "district": "Delhi", "coordinates": [28.7041, 77.1025]},
}

INFRASTRUCTURE_TERMS = [
    "road", "water", "electricity", "school", "hospital", "bridge",
    "pipe", "transformer", "bus", "toilet", "റോഡ്", "വെള്ളം", "വൈദ്യുതി", "സ്കൂൾ", "ആംബുലൻസ്"
]

URGENCY_SIGNALS = [
    "emergency", "urgent", "critical", "accident", "injured", "flood", "burst", "breakage", "outage"
]


def extract_entities(text: str) -> Dict[str, Any]:
    """Extract locations, infrastructure terms, and urgency signals from text."""
    lowered = (text or "").lower()
    
    locations = [
        {"name": loc.capitalize(), **info}
        for loc, info in KNOWN_LOCATIONS.items()
        if loc in lowered
    ]

    matched_infrastructure = [
        term for term in INFRASTRUCTURE_TERMS
        if term.lower() in lowered or term in (text or "")
    ]

    matched_urgency = [
        signal for signal in URGENCY_SIGNALS
        if signal in lowered
    ]

    return {
        "locations": locations,
        "infrastructure_terms": list(dict.fromkeys(matched_infrastructure)),
        "urgency_keywords": list(dict.fromkeys(matched_urgency)),
        "affected_groups": [],
        "technical_confidence": 0.88,
    }


def normalize_and_extract(text: str, language: str) -> Dict[str, Any]:
    """Normalize input text and extract structured entity metadata."""
    clean_text = " ".join((text or "").strip().split())
    entities = extract_entities(clean_text)
    quality = "good" if len(clean_text) >= 20 else "brief"

    return {
        "normalized_content": clean_text,
        "extracted_entities": entities,
        "content_quality": quality,
        "extraction_timestamp": "2026-08-31T00:00:00Z",
    }
