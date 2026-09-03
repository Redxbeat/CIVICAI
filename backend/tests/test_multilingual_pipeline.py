from app.services.request_classifier import build_request_record


def test_multilingual_request_retains_original_text_and_detects_language():
    payload = {
        "original_text": "ഞങ്ങളുടെ ഗ്രാമത്തിൽ നല്ല റോഡ് ഇല്ല. ആംബുലൻസ് വരാൻ വളരെ ബുദ്ധിമുട്ടാണ്.",
        "location": "Kochi",
        "latitude": 9.967,
        "longitude": 76.2458,
        "administrative_region": "Ernakulam",
    }

    result = build_request_record(payload)
    assert result["language"] == "Malayalam"
    assert result["original_text"] == payload["original_text"]
    assert result["translated_text"] == payload["original_text"]
    assert result["category"] == "Roads"
    assert result["urgency"] >= 8.0
