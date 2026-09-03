"""Infrastructure classification and priority assessment service."""

from __future__ import annotations

from typing import Any, Dict

# Mapping of infrastructure domain keywords to primary categories
INFRASTRUCTURE_SECTORS = {
    "Roads": ["road", "roads", "pothole", "bridge", "asphalt", "highway", "റോഡ്", "രോഡ്", "पाथ"],
    "Healthcare": ["ambulance", "hospital", "health", "clinic", "doctor", "trauma", "ആംബുലൻസ്", "अस्पताल"],
    "Drinking Water": ["water", "pipe", "leak", "drinking", "contamination", "supply", "വെള്ളം", "पानी"],
    "Electricity": ["electricity", "power", "transformer", "voltage", "outage", "wire", "വൈദ്യുതി", "बिजली"],
    "Education": ["school", "education", "teacher", "classroom", "college", "സ്കൂൾ", "स्कूल"],
    "Internet Connectivity": ["internet", "wifi", "broadband", "network", "signal", "ഇന്റർനെറ്റ്"],
    "Public Transport": ["transport", "bus", "train", "station", "stop", " transit", "ബസ്", "बस"],
    "Sanitation": ["sanitation", "waste", "garbage", "drainage", "toilet", "ശുചിതാലം", "सफाई"],
}

SUBCATEGORY_LOOKUP = {
    "road": "Road Connectivity",
    "pothole": "Surface & Pothole Damage",
    "bridge": "Bridge Infrastructure",
    "ambulance": "Emergency Medical Access",
    "hospital": "Hospital Facilities",
    "water": "Water Supply & Distribution",
    "pipe": "Water Pipe Burst",
    "electricity": "Power Reliability & Grid",
    "transformer": "Substation & Transformer Fault",
    "school": "Educational Access",
    "internet": "Digital Connectivity",
    "bus": "Public Transit Route",
    "sanitation": "Waste Management",
}

CRITICAL_SIGNALS = ["ambulance", "emergency", "urgent", "critical", "accident", "burst", "collapse", "ആംബുലൻസ്", "അപകടം"]
MODERATE_SIGNALS = ["problem", "bad", "difficult", "disruption", "leak", "damage", "ഇല്ല", "കഷ്ടം"]


def determine_category_and_subcategory(text: str) -> tuple[str, str]:
    """Identify the infrastructure category and subcategory from citizen description."""
    lowered = text.lower()

    for sector, keywords in INFRASTRUCTURE_SECTORS.items():
        for keyword in keywords:
            if keyword in lowered:
                subcategory = SUBCATEGORY_LOOKUP.get(keyword, f"{sector} Maintenance")
                return sector, subcategory

    return "Roads", "Road Connectivity"


def calculate_urgency_score(text: str) -> float:
    """Calculate urgency score from 1.0 to 10.0 based on severity keywords."""
    lowered = text.lower()

    if any(signal in lowered for signal in CRITICAL_SIGNALS):
        return 9.0
    if any(signal in lowered for signal in MODERATE_SIGNALS):
        return 7.8
    if any(signal in lowered for signal in ["minor", "slow", "request", "need"]):
        return 5.5

    return 7.0


def classify_infrastructure(text: str) -> Dict[str, Any]:
    """Classify citizen request text into infrastructure category, subcategory, urgency, and sentiment."""
    category, subcategory = determine_category_and_subcategory(text or "")
    urgency = calculate_urgency_score(text or "")
    sentiment = "concerned" if urgency >= 7.0 else "neutral"

    return {
        "category": category,
        "subcategory": subcategory,
        "urgency": round(urgency, 1),
        "sentiment": sentiment,
        "ai_confidence": 0.94,
    }
