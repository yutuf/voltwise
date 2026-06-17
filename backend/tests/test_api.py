"""Smoke tests for Voltwise API — run: python -m pytest tests/ -q"""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_catalog():
    r = client.get("/api/catalog")
    assert r.status_code == 200
    assert len(r.json()["devices"]) == 8


def test_analyze_water_shift():
    r = client.post(
        "/api/analyze",
        json={
            "devices": [{"device_id": "water", "hours": 2}],
            "applied_reco_ids": ["sh-water"],
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["simulation"]["saved_tl"] == 114.0


def test_frontend_served():
    r = client.get("/")
    assert r.status_code == 200
    assert "Voltwise" in r.text
