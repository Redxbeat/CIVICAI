"""Request Classification & Intake Service powered by Google Gemini 3.6 Flash with Dynamic All-India Geocoding."""

from __future__ import annotations

import json
import re
import urllib.parse
import urllib.request
from typing import Any, Dict

from app.ai.pipeline import process_citizen_input

# Extensive All-India Geographic Coordinates Database
ALL_INDIA_CITY_COORDINATES = {
    # Kerala Districts & Towns
    "kollam": {"lat": 8.8932, "lng": 76.6141, "region": "Kollam District, Kerala"},
    "thrissur": {"lat": 10.5276, "lng": 76.2144, "region": "Thrissur District, Kerala"},
    "kochi": {"lat": 9.9312, "lng": 76.2673, "region": "Ernakulam District, Kerala"},
    "ernakulam": {"lat": 9.9816, "lng": 76.2999, "region": "Ernakulam District, Kerala"},
    "thiruvananthapuram": {"lat": 8.5241, "lng": 76.9366, "region": "Thiruvananthapuram, Kerala"},
    "trivandrum": {"lat": 8.5241, "lng": 76.9366, "region": "Thiruvananthapuram, Kerala"},
    "palakkad": {"lat": 10.7867, "lng": 76.6548, "region": "Palakkad District, Kerala"},
    "calicut": {"lat": 11.2588, "lng": 75.7804, "region": "Kozhikode District, Kerala"},
    "kozhikode": {"lat": 11.2588, "lng": 75.7804, "region": "Kozhikode District, Kerala"},
    "kottayam": {"lat": 9.5916, "lng": 76.5222, "region": "Kottayam District, Kerala"},
    "kannur": {"lat": 11.8745, "lng": 75.3704, "region": "Kannur District, Kerala"},
    "malappuram": {"lat": 11.0732, "lng": 76.0740, "region": "Malappuram District, Kerala"},
    "alappuzha": {"lat": 9.4981, "lng": 76.3388, "region": "Alappuzha District, Kerala"},
    "wayanad": {"lat": 11.6854, "lng": 76.1320, "region": "Wayanad District, Kerala"},
    "munnar": {"lat": 10.0889, "lng": 77.0595, "region": "Idukki District, Kerala"},
    "varkala": {"lat": 8.7379, "lng": 76.7163, "region": "Thiruvananthapuram, Kerala"},
    "guruvayur": {"lat": 10.5946, "lng": 76.0407, "region": "Thrissur District, Kerala"},
    "kasaragod": {"lat": 12.5102, "lng": 74.9852, "region": "Kasaragod District, Kerala"},
    "pathanamthitta": {"lat": 9.2648, "lng": 76.7870, "region": "Pathanamthitta, Kerala"},
    "idukki": {"lat": 9.8500, "lng": 76.9667, "region": "Idukki District, Kerala"},

    # All-India Metro & Major Regional Hubs
    "bangalore": {"lat": 12.9716, "lng": 77.5946, "region": "Bengaluru Urban, Karnataka"},
    "bengaluru": {"lat": 12.9716, "lng": 77.5946, "region": "Bengaluru Urban, Karnataka"},
    "mumbai": {"lat": 19.0760, "lng": 72.8777, "region": "Mumbai Metropolitan, Maharashtra"},
    "delhi": {"lat": 28.7041, "lng": 77.1025, "region": "National Capital Region, Delhi"},
    "new delhi": {"lat": 28.6139, "lng": 77.2090, "region": "National Capital Region, Delhi"},
    "chennai": {"lat": 13.0827, "lng": 80.2707, "region": "Chennai District, Tamil Nadu"},
    "kolkata": {"lat": 22.5726, "lng": 88.3639, "region": "Kolkata, West Bengal"},
    "hyderabad": {"lat": 17.3850, "lng": 78.4867, "region": "Hyderabad, Telangana"},
    "ahmedabad": {"lat": 23.0225, "lng": 72.5714, "region": "Ahmedabad, Gujarat"},
    "pune": {"lat": 18.5204, "lng": 73.8567, "region": "Pune Metropolitan, Maharashtra"},
    "jaipur": {"lat": 26.9124, "lng": 75.7873, "region": "Jaipur District, Rajasthan"},
    "lucknow": {"lat": 26.8467, "lng": 80.9462, "region": "Lucknow, Uttar Pradesh"},
    "kanpur": {"lat": 26.4499, "lng": 80.3319, "region": "Kanpur, Uttar Pradesh"},
    "nagpur": {"lat": 21.1458, "lng": 79.0882, "region": "Nagpur, Maharashtra"},
    "indore": {"lat": 22.7196, "lng": 75.8577, "region": "Indore, Madhya Pradesh"},
    "bhopal": {"lat": 23.2599, "lng": 77.4126, "region": "Bhopal, Madhya Pradesh"},
    "patna": {"lat": 25.5941, "lng": 85.1376, "region": "Patna, Bihar"},
    "surat": {"lat": 21.1702, "lng": 72.8311, "region": "Surat, Gujarat"},
    "visakhapatnam": {"lat": 17.6868, "lng": 83.2185, "region": "Visakhapatnam, Andhra Pradesh"},
    "vizag": {"lat": 17.6868, "lng": 83.2185, "region": "Visakhapatnam, Andhra Pradesh"},
    "coimbatore": {"lat": 11.0168, "lng": 76.9558, "region": "Coimbatore, Tamil Nadu"},
    "madurai": {"lat": 9.9252, "lng": 78.1198, "region": "Madurai, Tamil Nadu"},
    "guwahati": {"lat": 26.1445, "lng": 91.7362, "region": "Kamrup Metropolitan, Assam"},
    "chandigarh": {"lat": 30.7333, "lng": 76.7794, "region": "Chandigarh UT"},
    "shimla": {"lat": 31.1048, "lng": 77.1734, "region": "Shimla, Himachal Pradesh"},
    "dehradun": {"lat": 30.3165, "lng": 78.0322, "region": "Dehradun, Uttarakhand"},
    "goa": {"lat": 15.2993, "lng": 74.1240, "region": "Goa State"},
    "panaji": {"lat": 15.4909, "lng": 73.8278, "region": "North Goa, Goa"},
}


def resolve_coordinates(location_str: str) -> tuple[float, float, str]:
    """Resolve ANY Indian place name string to exact GPS latitude, longitude, and administrative region."""
    if not location_str or not location_str.strip():
        return 20.5937, 78.9629, "India"

    loc_lower = location_str.strip().lower()

    # 1. Exact or word-boundary match in All-India Dictionary
    for name, data in ALL_INDIA_CITY_COORDINATES.items():
        if name == loc_lower or re.search(r'\b' + re.escape(name) + r'\b', loc_lower):
            return data["lat"], data["lng"], data["region"]

    # 2. Dynamic OpenStreetMap Nominatim Geocoding API Fallback for any village/town in India
    try:
        encoded_query = urllib.parse.quote(f"{location_str}, India")
        url = f"https://nominatim.openstreetmap.org/search?format=json&q={encoded_query}&countrycodes=in&limit=1"
        req = urllib.request.Request(url, headers={"User-Agent": "CIVICAI-Geocoder/1.0"})

        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data and len(data) > 0:
                lat = float(data[0]["lat"])
                lng = float(data[0]["lon"])
                display_name = data[0].get("display_name", location_str).split(",")[0]
                return lat, lng, f"{display_name}, India"
    except Exception as e:
        print(f"[Geocoding API Fallback Note]: {e}")

    # Default India geographic center fallback
    return 20.5937, 78.9629, location_str.capitalize()


def classify_request_text(text: str) -> Dict[str, Any]:
    """Process input request text through Google Gemini AI pipeline."""
    result = process_citizen_input({"original_text": text})
    return {
        "category": result["category"],
        "subcategory": result["subcategory"],
        "urgency": result["urgency"],
        "language": result["language"],
        "sentiment": result["sentiment"],
        "ai_confidence": result["ai_confidence"],
        "translated_text": result["translated_text"],
    }


def extract_location_from_text(text: str) -> str | None:
    """Extract mentioned location from complaint text if explicit location field is omitted."""
    if not text:
        return None
    text_lower = text.lower()
    for name in ALL_INDIA_CITY_COORDINATES.keys():
        if re.search(r'\b' + re.escape(name) + r'\b', text_lower):
            return name.capitalize()
    return None


def build_request_record(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Build full citizen request record using Google Gemini AI pipeline and All-India Geocoding."""
    gemini_result = process_citizen_input(payload)
    
    # Priority order: Payload Location -> Gemini Extracted Location -> Text Keyword Extraction -> "India"
    input_location = payload.get("location")
    gemini_locations = gemini_result.get("extracted_entities", {}).get("locations", [])
    extracted_loc = gemini_locations[0] if gemini_locations else None
    text_loc = extract_location_from_text(payload.get("original_text", ""))

    location_name = input_location or extracted_loc or text_loc or "India"

    # Resolve GPS coordinates for location
    default_lat, default_lng, resolved_region = resolve_coordinates(location_name)
    lat = payload.get("latitude") or default_lat
    lng = payload.get("longitude") or default_lng
    admin_region = payload.get("administrative_region") or resolved_region

    return {
        "request_id": payload.get("request_id", "CIV-000000"),
        "citizen_id": payload.get("citizen_id", "anon-citizen-000"),
        "language": gemini_result["language"],
        "original_text": payload.get("original_text", ""),
        "translated_text": gemini_result["translated_text"],
        "category": gemini_result["category"],
        "subcategory": gemini_result["subcategory"],
        "location": location_name,
        "latitude": lat,
        "longitude": lng,
        "administrative_region": admin_region,
        "urgency": gemini_result["urgency"],
        "severity": gemini_result["severity_band"],
        "population_affected": gemini_result["population_affected"],
        "infrastructure_type": gemini_result["category"],
        "sentiment": gemini_result["sentiment"],
        "verification_status": payload.get("verification_status", "pending"),
        "duplicate_probability": payload.get("duplicate_probability", 0.12),
        "ai_confidence": gemini_result["ai_confidence"],
        "evidence": f"Google Gemini 3.6 Flash Engine Analysis: {gemini_result['category']} issue detected at {location_name} with urgency {gemini_result['urgency']}/10.",
        "status": payload.get("status", "submitted"),
        "normalized_content": gemini_result["normalized_content"],
        "extracted_entities": gemini_result["extracted_entities"],
        "content_quality": "good" if len(gemini_result["translated_text"]) > 20 else "brief",
        "triage_score": gemini_result["triage_score"],
        "severity_band": gemini_result["severity_band"],
        "routed_agency": gemini_result["routed_agency"],
        "backup_agencies": gemini_result["backup_agencies"],
        "action_steps": gemini_result.get("action_steps", []),
        "escalation_level": gemini_result["escalation_level"],
        "sla_hours": gemini_result["sla_hours"],
        "escalation_priority": gemini_result["escalation_priority"],
    }
