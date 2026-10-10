import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import app as routewise


@pytest.fixture
def client():
    routewise.app.config["TESTING"] = True
    with routewise.app.test_client() as test_client:
        yield test_client


def test_health_endpoint(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.get_json() == {
        "service": "RouteWise API",
        "status": "ok",
    }


def test_route_rejects_missing_json(client):
    response = client.post("/api/route", data="not json")

    assert response.status_code == 400
    assert "error" in response.get_json()


def test_route_rejects_non_object_json(client):
    response = client.post("/api/route", json=["Tunis", "Sousse"])

    assert response.status_code == 400


def test_route_rejects_missing_places(client):
    response = client.post(
        "/api/route",
        json={"origin": "Tunis", "destination": "   "},
    )

    assert response.status_code == 400


def test_route_rejects_non_text_places(client):
    response = client.post(
        "/api/route",
        json={"origin": 123, "destination": "Sousse"},
    )

    assert response.status_code == 400


def test_route_rejects_place_over_max_length(client):
    response = client.post(
        "/api/route",
        json={
            "origin": "A" * (routewise.MAX_PLACE_LENGTH + 1),
            "destination": "Sousse",
        },
    )

    assert response.status_code == 400


def test_validate_osrm_route_accepts_valid_route():
    result = {
        "code": "Ok",
        "routes": [{
            "distance": 1500.0,
            "duration": 300.0,
            "geometry": {
                "type": "LineString",
                "coordinates": [[10.18, 36.80], [10.20, 36.82]],
            },
        }],
    }

    route = routewise.validate_osrm_route(result)

    assert route["distance"] == 1500.0
    assert route["duration"] == 300.0


def test_validate_osrm_route_rejects_invalid_coordinates():
    result = {
        "code": "Ok",
        "routes": [{
            "distance": 1500.0,
            "duration": 300.0,
            "geometry": {
                "type": "LineString",
                "coordinates": [[500, 36.80]],
            },
        }],
    }

    with pytest.raises(ValueError):
        routewise.validate_osrm_route(result)
