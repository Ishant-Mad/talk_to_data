import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_cors_headers():
    response = client.options("/chat", headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "POST"})
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers

def test_chat_endpoint_missing_payload():
    response = client.post("/chat", json={})
    # Should throw 422 Unprocessable Entity due to missing Pydantic field or empty question handled
    assert response.status_code in [400, 422, 500]

def test_chat_endpoint_invalid_schema():
    response = client.post("/chat", json={"question": ""})
    # Handled by fallback/empty question 
    assert response.status_code in [400, 422, 500]

def test_schema_endpoint():
    response = client.get("/schema")
    assert response.status_code == 200
    data = response.json()
    assert "tables" in data
    assert isinstance(data["tables"], list)

def test_dashboard_plan_endpoint():
    # If standard behavior works
    response = client.get("/dashboard/plan")
    assert response.status_code == 200
    data = response.json()
    assert "charts" in data
