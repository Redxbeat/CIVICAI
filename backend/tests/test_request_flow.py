from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_create_request_classifies_input():
    response = client.post(
        "/requests",
        json={
            "original_text": "ഞങ്ങളുടെ ഗ്രാമത്തിൽ നല്ല റോഡ് ഇല്ല. ആംബുലൻസ് വരാൻ വളരെ ബുദ്ധിമുട്ടാണ്.",
            "location": "Kochi",
            "latitude": 9.967,
            "longitude": 76.2458,
            "administrative_region": "Ernakulam",
            "population_affected": 4200,
        },
    )
    assert response.status_code == 201, response.text
    payload = response.json()
    assert payload["category"] == "Roads"
    assert payload["subcategory"] == "Road Connectivity"
    assert payload["urgency"] >= 8.0
    assert payload["status"] == "submitted"


def test_list_requests():
    response = client.get("/requests")
    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
