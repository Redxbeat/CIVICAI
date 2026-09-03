import sys

sys.path.insert(0, r"B:\Python programming\CIVIC\civicai\backend")

from app.services.request_classifier import build_request_record

payload = {
    "original_text": "ഞങ്ങളുടെ ഗ്രാമത്തിൽ നല്ല റോഡ് ഇല്ല. ആംബുലൻസ് വരാൻ വളരെ ബുദ്ധിമുട്ടാണ്.",
    "location": "Kochi",
    "latitude": 9.967,
    "longitude": 76.2458,
    "administrative_region": "Ernakulam",
}

result = build_request_record(payload)
assert result["language"] == "Malayalam", result
assert result["original_text"] == payload["original_text"], result
assert result["translated_text"] == payload["original_text"], result
assert result["category"] == "Roads", result
assert result["urgency"] >= 8.0, result
print(result)
