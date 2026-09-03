"""AI Pipeline Orchestrator for Citizen Feedback Processing powered by Google Gemini 3.6 Flash."""

from __future__ import annotations

from typing import Any, Dict

try:
    from .classification_service import classify_infrastructure
    from .extraction_service import extract_entities, normalize_and_extract
    from .gemini_service import (
        gemini_classify_and_score,
        gemini_detect_and_translate,
        gemini_extract_entities,
        gemini_generate_action_plan,
    )
    from .language_service import detect_language, translate_to_english, language_pipeline
    from .triage_service import compute_triage_score, route_to_agency
except ImportError:
    from classification_service import classify_infrastructure
    from extraction_service import extract_entities, normalize_and_extract
    from gemini_service import (
        gemini_classify_and_score,
        gemini_detect_and_translate,
        gemini_extract_entities,
        gemini_generate_action_plan,
    )
    from language_service import detect_language, translate_to_english, language_pipeline
    from triage_service import compute_triage_score, route_to_agency



def process_citizen_input(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Execute complete end-to-end AI pipeline on citizen request input using Google Gemini."""
    original_text = payload.get("original_text", "")

    # Step 1: Gemini AI Multilingual Detection & Translation
    gemini_translation = gemini_detect_and_translate(original_text)
    rule_lang = detect_language(original_text)

    language = gemini_translation.get("language")
    if not language or language == "English":
        language = rule_lang if rule_lang != "English" else "English"

    translated_text = gemini_translation.get("translated_text") or original_text
    if language != "English" and (not translated_text or translated_text == original_text):
        translated_text = translate_to_english(original_text)

    # Step 2: Gemini AI Entity Extraction
    gemini_entities = gemini_extract_entities(original_text)
    local_entities = extract_entities(original_text)

    locations = gemini_entities.get("locations", []) or [loc["name"] for loc in local_entities.get("locations", [])]
    extracted_loc = locations[0] if locations else None

    # Dynamic Location Resolution (Payload Location -> Extracted Location -> "India")
    location = payload.get("location") or extracted_loc or "India"

    # Step 3: Gemini AI Classification & Urgency Assessment
    gemini_classification = gemini_classify_and_score(translated_text)
    local_classification = classify_infrastructure(translated_text or original_text)

    category = payload.get("category") or gemini_classification.get("category") or local_classification.get("category", "Roads")
    subcategory = gemini_classification.get("subcategory") or local_classification.get("subcategory", "Road Connectivity")

    raw_urgency = payload.get("urgency")
    if raw_urgency is not None:
        urgency = float(raw_urgency)
    else:
        gem_urg = float(gemini_classification.get("urgency", 7.5))
        loc_urg = float(local_classification.get("urgency", 7.0))
        urgency = max(gem_urg, loc_urg)

    # Step 4: Gemini AI Government Action Plan & Routing
    action_plan = gemini_generate_action_plan(category, translated_text, location)

    # Step 5: Triage Score & Escalation Computation
    population_affected = payload.get("population_affected") if payload.get("population_affected") is not None else 2500
    duplicate_prob = payload.get("duplicate_probability") if payload.get("duplicate_probability") is not None else 0.12

    triage = compute_triage_score(category, urgency, population_affected, duplicate_prob)
    routing = route_to_agency(category, urgency, location)

    merged_extracted = {
        "locations": locations,
        "infrastructure_terms": list(dict.fromkeys(gemini_entities.get("infrastructure_terms", []) + local_entities.get("infrastructure_terms", []))),
        "urgency_keywords": list(dict.fromkeys(gemini_entities.get("urgency_keywords", []) + local_entities.get("urgency_keywords", []))),
        "technical_confidence": gemini_entities.get("technical_confidence") or local_entities.get("technical_confidence", 0.88),
    }

    return {
        "engine": "Google Gemini 3.6 Flash",
        "language": language,
        "original_text": original_text,
        "translated_text": original_text,
        "category": category,
        "subcategory": subcategory,
        "location": location,
        "urgency": urgency,
        "population_affected": population_affected,
        "sentiment": gemini_classification.get("sentiment") or local_classification.get("sentiment", "concerned"),
        "ai_confidence": gemini_classification.get("ai_confidence", 0.96),
        "normalized_content": " ".join(original_text.strip().split()),
        "extracted_entities": merged_extracted,
        "triage_score": triage["triage_score"],
        "severity_band": triage["severity_band"],
        "routed_agency": action_plan.get("primary_agency") or routing["routed_agency"],
        "backup_agencies": action_plan.get("backup_agencies") or routing["backup_agencies"],
        "action_steps": action_plan.get("action_steps", []),
        "escalation_level": routing["escalation_level"],
        "sla_hours": action_plan.get("recommended_sla_hours") or routing["sla_hours"],
        "escalation_priority": routing["escalation_priority"],
    }

