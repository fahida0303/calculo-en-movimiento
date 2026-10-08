"""
Pruebas para los endpoints API de FastAPI.
"""
from fastapi.testclient import TestClient
from backend.api.main import app

client = TestClient(app)

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_api_validate_valid():
    res = client.post("/api/validate", json={"expression": "x^2 + 3*x - 2"})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["is_valid"] is True
    assert data["function_type"] == "Cuadrática"

def test_api_validate_invalid():
    res = client.post("/api/validate", json={"expression": "sin(x + "})
    assert res.status_code == 400
    data = res.json()
    assert data["is_valid"] is False
    assert "paréntesis" in data["error_message"].lower()

def test_api_calculate_requirement_1():
    res = client.post("/api/calculate", json={
        "function": "x^2",
        "mode": "MANUAL",
        "requirement": 1,
        "parameters": {"a": 2.0}
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["requirement"] == 1
    assert data["results"]["f_a"] == 4.0
    assert data["results"]["slope"] == 4.0
    assert "graph_data" in data
    assert "curve_points" in data["graph_data"]

def test_api_calculate_requirement_2():
    res = client.post("/api/calculate", json={
        "function": "x^2",
        "mode": "MANUAL",
        "requirement": 2,
        "parameters": {"a": 1.0, "b": 3.0}
    })
    assert res.status_code == 200
    data = res.json()
    assert data["results"]["rate_of_change"] == 4.0

def test_api_camera_status_initial():
    res = client.get("/api/camera/status")
    assert res.status_code == 200
    data = res.json()
    assert data["camera_active"] is False
    assert data["camera_state"] == "CAMERA_OFF"

def test_api_calculate_requirements_3_4_5():
    # Requisito 3
    res3 = client.post("/api/calculate", json={
        "function": "x^2",
        "mode": "MANUAL",
        "requirement": 3
    })
    assert res3.status_code == 200
    assert res3.json()["success"] is True
    assert "first_derivative" in res3.json()["results"]

    # Requisito 4
    res4 = client.post("/api/calculate", json={
        "function": "x^2",
        "mode": "MANUAL",
        "requirement": 4
    })
    assert res4.status_code == 200
    assert res4.json()["success"] is True
    assert "critical_points" in res4.json()["results"]

    # Requisito 5
    res5 = client.post("/api/calculate", json={
        "function": "x^2",
        "mode": "MANUAL",
        "requirement": 5
    })
    assert res5.status_code == 200
    assert res5.json()["success"] is True
    assert "planteamiento" in res5.json()["results"]

def test_api_calculate_invalid_expression():
    res = client.post("/api/calculate", json={
        "function": "x +* 3",
        "mode": "MANUAL",
        "requirement": 1
    })
    assert res.status_code == 400
    assert res.json()["success"] is False

def test_api_camera_stop():
    res = client.post("/api/camera/stop")
    assert res.status_code == 200
    assert res.json()["success"] is True
