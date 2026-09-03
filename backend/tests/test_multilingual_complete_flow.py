"""Comprehensive test for multilingual intake with extraction, triage, and routing."""

import sys
sys.path.insert(0, r"B:\Python programming\CIVIC\civicai\backend")

from app.services.request_classifier import build_request_record


def test_multilingual_intake_complete_flow():
    """Test the full multilingual, extraction, triage, and routing pipeline."""
    payload = {
        "original_text": "ഞങ്ങളുടെ ഗ്രാമത്തിൽ നല്ല റോഡ് ഇല്ല. ആംബുലൻസ് വരാൻ വളരെ ബുദ്ധിമുട്ടാണ്.",
        "location": "Kochi",
        "latitude": 9.967,
        "longitude": 76.2458,
        "administrative_region": "Ernakulam",
        "population_affected": 4200,
    }

    result = build_request_record(payload)

    assert result["language"] == "Malayalam"
    assert result["original_text"] == payload["original_text"]
    assert result["translated_text"] == payload["original_text"]
    assert result["category"] == "Roads"
    assert result["urgency"] >= 8.0
    assert result["sentiment"] in ["concerned", "urgent"]
    
    assert "normalized_content" in result
    assert len(result["normalized_content"]) > 0
    
    assert "extracted_entities" in result
    entities = result["extracted_entities"]
    assert "locations" in entities
    assert "infrastructure_terms" in entities
    assert "urgency_keywords" in entities
    assert entities["technical_confidence"] >= 0.8
    
    assert result["triage_score"] > 0.0
    assert result["severity_band"] in ["critical", "high", "medium", "low"]
    
    assert result["routed_agency"] is not None
    assert "Public Works" in result["routed_agency"]
    assert isinstance(result["backup_agencies"], list)
    assert result["escalation_level"] in ["critical", "high", "normal"]
    assert result["sla_hours"] > 0
    assert result["escalation_priority"] > 0
    
    assert result["content_quality"] in ["good", "brief"]
    print("✅ Full multilingual intake with extraction, triage, and routing passed")


if __name__ == "__main__":
    test_multilingual_intake_complete_flow()
    print("All tests passed!")
