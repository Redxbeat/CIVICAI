"""Google Gemini AI Service Integration for CIVICAI Platform.

Uses Google Gemini (gemini-3.6-flash) for live multilingual translation,
infrastructure request classification, entity extraction, and agency action plan generation.
"""

import json
import os
from typing import Any, Dict, Optional

import google.generativeai as genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_ENABLED = os.getenv("CIVICAI_ENABLE_GEMINI", "").lower() in {"1", "true", "yes", "on"}
if GEMINI_ENABLED and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Use Gemini 3.6 Flash model
MODEL_NAME = "models/gemini-3.6-flash"


def _gemini_available() -> bool:
    return bool(GEMINI_ENABLED and GEMINI_API_KEY)


def get_gemini_model() -> genai.GenerativeModel:
    return genai.GenerativeModel(MODEL_NAME)


def _local_classification(text: str) -> Dict[str, Any]:
    try:
        from .classification_service import classify_infrastructure
    except ImportError:
        from classification_service import classify_infrastructure

    return classify_infrastructure(text or "")


def _local_entities(text: str) -> Dict[str, Any]:
    try:
        from .extraction_service import extract_entities
    except ImportError:
        from extraction_service import extract_entities

    entities = extract_entities(text or "")
    return {
        "locations": [loc["name"] for loc in entities.get("locations", [])],
        "infrastructure_terms": entities.get("infrastructure_terms", []),
        "urgency_keywords": entities.get("urgency_keywords", []),
        "affected_population_estimate": 2500,
    }


def _local_action_plan(category: str) -> Dict[str, Any]:
    try:
        from .triage_service import route_to_agency
    except ImportError:
        from triage_service import route_to_agency

    routing = route_to_agency(category, 7.5, "India")
    return {
        "primary_agency": routing["routed_agency"],
        "backup_agencies": routing["backup_agencies"],
        "action_steps": ["Log the request", "Inspect the affected site", "Assign repair crew"],
        "recommended_sla_hours": routing["sla_hours"],
    }


def gemini_detect_and_translate(text: str) -> Dict[str, Any]:
    """Detect language and translate citizen feedback to English using Gemini AI."""
    if not text or not text.strip():
        return {"language": "English", "translated_text": text}
    if not _gemini_available():
        return {"language": "English", "translated_text": text}

    try:
        model = get_gemini_model()
        prompt = f"""
Analyze the following citizen request text:
"{text}"

Perform:
1. Language detection (e.g. Malayalam, Hindi, English, Tamil, Kannada, etc.)
2. Translate the text to clean, natural English.

Return ONLY a valid JSON object with keys:
"language": "Detected language name",
"translated_text": "Translated English text"
"""
        response = model.generate_content(prompt, request_options={"timeout": 3.0})
        cleaned_json = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(cleaned_json)
        return {
            "language": data.get("language", "English"),
            "translated_text": data.get("translated_text", text),
        }
    except Exception as e:
        print(f"[Gemini AI] Translation fallback applied: {e}")
        return {"language": "English", "translated_text": text}


def gemini_classify_and_score(text: str) -> Dict[str, Any]:
    """Classify infrastructure request into primary sector, subcategory, urgency, and sentiment."""
    if not _gemini_available():
        return _local_classification(text)

    try:
        model = get_gemini_model()
        prompt = f"""
Categorize the following public infrastructure request:
"{text}"

Choose category from: ["Roads", "Healthcare", "Drinking Water", "Electricity", "Education", "Public Transport", "Sanitation", "Housing"]

Return ONLY a valid JSON object with keys:
"category": "Primary sector name",
"subcategory": "Specific issue subcategory",
"urgency": 8.5 (float score from 1.0 to 10.0),
"sentiment": "concerned/urgent/neutral",
"ai_confidence": 0.96
"""
        response = model.generate_content(prompt, request_options={"timeout": 3.0})
        cleaned_json = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(cleaned_json)
        return {
            "category": data.get("category", "Roads"),
            "subcategory": data.get("subcategory", "Infrastructure Damage"),
            "urgency": float(data.get("urgency", 7.5)),
            "sentiment": data.get("sentiment", "concerned"),
            "ai_confidence": float(data.get("ai_confidence", 0.95)),
        }
    except Exception as e:
        print(f"[Gemini AI] Classification fallback applied: {e}")
        return _local_classification(text)


def gemini_extract_entities(text: str) -> Dict[str, Any]:
    """Extract location landmarks, infrastructure equipment names, and urgency keywords."""
    if not _gemini_available():
        return _local_entities(text)

    try:
        model = get_gemini_model()
        prompt = f"""
Extract structured entities from this citizen request:
"{text}"

Return ONLY a valid JSON object with keys:
"locations": ["List of landmark/city/village names mentioned"],
"infrastructure_terms": ["List of infrastructure elements like pipe, road, hospital"],
"urgency_keywords": ["Urgent signals like accident, leak, emergency"],
"affected_population_estimate": 2500
"""
        response = model.generate_content(prompt, request_options={"timeout": 3.0})
        cleaned_json = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned_json)
    except Exception as e:
        print(f"[Gemini AI] Entity extraction fallback applied: {e}")
        return _local_entities(text)


def gemini_generate_action_plan(category: str, text: str, location: str) -> Dict[str, Any]:
    """Generate government officer response action plan, agency routing, and SLA timeframe."""
    if not _gemini_available():
        return _local_action_plan(category)

    try:
        model = get_gemini_model()
        prompt = f"""
Create a official municipal response plan for:
Category: {category}
Location: {location}
Citizen Issue: "{text}"

Return ONLY a valid JSON object with keys:
"primary_agency": "Main government department (e.g. Public Works Department (PWD), Water Authority, Health Department)",
"backup_agencies": ["Secondary agency 1", "Secondary agency 2"],
"action_steps": ["Step 1: Inspect site", "Step 2: Dispatch maintenance crew", "Step 3: Resolve fault"],
"recommended_sla_hours": 48
"""
        response = model.generate_content(prompt, request_options={"timeout": 3.0})
        cleaned_json = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned_json)
    except Exception as e:
        print(f"[Gemini AI] Action plan fallback applied: {e}")
        return _local_action_plan(category)
