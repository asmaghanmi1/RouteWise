
import math
import time
import threading

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS


app = Flask(__name__)

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://localhost:5174",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:5174",
            ]
        }
    },
)

GEOCODING_URL = "https://nominatim.openstreetmap.org/search"
ROUTING_URL = "https://router.project-osrm.org/route/v1/driving"

HEADERS = {
    "User-Agent": "RouteWise/0.1 (personal learning project)"
}

GEOCODING_TIMEOUT = 15
ROUTING_TIMEOUT = 20
NOMINATIM_DELAY = 1.1
MAX_PLACE_LENGTH = 200

# In-memory cache and rate limiter for Nominatim.
_geocode_cache = {}
_geocode_lock = threading.Lock()
_last_geocode_request = 0.0


class PlaceNotFoundError(ValueError):
    """Raised when a place cannot be found."""


class InvalidGeocodingResponseError(ValueError):
    """Raised when geocoding returns invalid data."""


def is_number(value):
    """Check that a value is finite and is not a boolean."""
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(value)
    )


def geocode(place):
    """Convert a place name into validated [longitude, latitude]."""
    global _last_geocode_request

    cache_key = place.strip().casefold()

    with _geocode_lock:
        # Avoid repeating requests for places already resolved.
        if cache_key in _geocode_cache:
            return _geocode_cache[cache_key].copy()

        # Space out Nominatim requests within this process.
        elapsed = time.monotonic() - _last_geocode_request
        wait_time = NOMINATIM_DELAY - elapsed

        if wait_time > 0:
            time.sleep(wait_time)

        _last_geocode_request = time.monotonic()

        response = requests.get(
            GEOCODING_URL,
            params={
                "q": place,
                "format": "jsonv2",
                "limit": 1,
            },
            headers=HEADERS,
            timeout=GEOCODING_TIMEOUT,
        )
        response.raise_for_status()

        results = response.json()

        if not isinstance(results, list):
            raise InvalidGeocodingResponseError(
                "Invalid response from geocoding service."
            )

        if not results:
            raise PlaceNotFoundError(f"Place not found: {place}")

        result = results[0]

        if not isinstance(result, dict):
            raise InvalidGeocodingResponseError(
                "Invalid coordinates returned by geocoding service."
            )

        try:
            longitude = float(result["lon"])
            latitude = float(result["lat"])
        except (KeyError, TypeError, ValueError) as error:
            raise InvalidGeocodingResponseError(
                "Invalid coordinates returned by geocoding service."
            ) from error

        if not math.isfinite(longitude) or not math.isfinite(latitude):
            raise InvalidGeocodingResponseError(
                "Invalid coordinates returned by geocoding service."
            )

        if not -180 <= longitude <= 180 or not -90 <= latitude <= 90:
            raise InvalidGeocodingResponseError(
                "Coordinates are outside valid geographic limits."
            )

        # OSRM expects longitude first, then latitude.
        coordinates = [longitude, latitude]
        _geocode_cache[cache_key] = coordinates

        return coordinates.copy()


def extract_route_steps(route):
    """Extract navigation steps from a validated OSRM route."""
    legs = route.get("legs")

    if not isinstance(legs, list):
        raise ValueError("Invalid route legs.")

    steps = []

    for leg in legs:
        if not isinstance(leg, dict):
            raise ValueError("Invalid route leg.")

        leg_steps = leg.get("steps")

        if not isinstance(leg_steps, list):
            raise ValueError("Invalid route steps.")

        for step in leg_steps:
            if not isinstance(step, dict):
                raise ValueError("Invalid route step.")

            distance = step.get("distance", 0)
            duration = step.get("duration", 0)
            maneuver = step.get("maneuver", {})

            if not is_number(distance) or not is_number(duration):
                raise ValueError("Invalid navigation measurements.")

            if distance < 0 or duration < 0:
                raise ValueError("Negative navigation measurements.")

            if not isinstance(maneuver, dict):
                raise ValueError("Invalid navigation maneuver.")

            steps.append({
                "instruction": step.get("name") or "Continue",
                "distance_m": round(distance),
                "duration_s": round(duration),
                "type": maneuver.get("type", ""),
            })

    return steps


def validate_osrm_route(result):
    """Validate the structure of an OSRM response."""
    if not isinstance(result, dict):
        raise ValueError("Invalid routing service response.")

    code = result.get("code")
    routes = result.get("routes")

    if not isinstance(code, str) or not isinstance(routes, list):
        raise ValueError("Invalid routing service response.")

    if code != "Ok" or not routes:
        return None

    route = routes[0]

    if not isinstance(route, dict):
        raise ValueError("Invalid route data.")

    distance = route.get("distance")
    duration = route.get("duration")
    geometry = route.get("geometry")

    if not is_number(distance) or not is_number(duration):
        raise ValueError("Invalid route distance or duration.")

    if distance < 0 or duration < 0:
        raise ValueError("Negative route measurements.")

    if not isinstance(geometry, dict):
        raise ValueError("Invalid route geometry.")

    if geometry.get("type") != "LineString":
        raise ValueError("Invalid route geometry type.")

    coordinates = geometry.get("coordinates")

    if not isinstance(coordinates, list) or not coordinates:
        raise ValueError("Route geometry contains no coordinates.")

    for coordinate in coordinates:
        if not isinstance(coordinate, list) or len(coordinate) < 2:
            raise ValueError("Invalid route coordinate.")

        longitude, latitude = coordinate[:2]

        if (
            not is_number(longitude)
            or not is_number(latitude)
            or not -180 <= longitude <= 180
            or not -90 <= latitude <= 90
        ):
            raise ValueError("Invalid route coordinate.")

    return route


@app.get("/api/health")
def health():
    """Check whether the API is running."""
    return jsonify({
        "service": "RouteWise API",
        "status": "ok",
    })


@app.post("/api/route")
def calculate_route():
    """Calculate a driving route between two places."""
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "A valid JSON object is required."
        }), 400

    origin = data.get("origin", "")
    destination = data.get("destination", "")

    if not isinstance(origin, str) or not isinstance(destination, str):
        return jsonify({
            "error": "Origin and destination must be text."
        }), 400

    origin = origin.strip()
    destination = destination.strip()

    if not origin or not destination:
        return jsonify({
            "error": "Origin and destination are required."
        }), 400

    if (
        len(origin) > MAX_PLACE_LENGTH
        or len(destination) > MAX_PLACE_LENGTH
    ):
        return jsonify({
            "error": (
                f"Each place must be {MAX_PLACE_LENGTH} characters or fewer."
            )
        }), 400

    try:
        start = geocode(origin)
        end = geocode(destination)

        coordinates = (
            f"{start[0]},{start[1]};{end[0]},{end[1]}"
        )

        response = requests.get(
            f"{ROUTING_URL}/{coordinates}",
            params={
                "overview": "full",
                "geometries": "geojson",
                "steps": "true",
            },
            timeout=ROUTING_TIMEOUT,
        )
        response.raise_for_status()

        result = response.json()
        route = validate_osrm_route(result)

        if route is None:
            return jsonify({
                "error": "No driving route found for these places."
            }), 404

        steps = extract_route_steps(route)

        return jsonify({
            "origin": origin,
            "destination": destination,
            "distance_km": round(route["distance"] / 1000, 2),
            "duration_min": round(route["duration"] / 60),
            "geometry": route["geometry"],
            "steps": steps,
        })

    except PlaceNotFoundError as error:
        return jsonify({"error": str(error)}), 404

    except InvalidGeocodingResponseError:
        app.logger.exception("Invalid geocoding service response")
        return jsonify({
            "error": "The geocoding service returned invalid data."
        }), 502

    except requests.exceptions.HTTPError as error:
        status = (
            error.response.status_code
            if error.response is not None
            else None
        )

        if status == 429:
            app.logger.warning(
                "A map service rate limit was reached (HTTP 429)."
            )
            return jsonify({
                "error": (
                    "Le service de recherche de lieux est temporairement "
                    "saturé. Réessayez plus tard."
                )
            }), 503

        app.logger.exception("Map service returned an HTTP error")
        return jsonify({
            "error": "Map service unavailable. Please try again later."
        }), 502

    except requests.exceptions.JSONDecodeError:
        app.logger.exception("Map service returned invalid JSON")
        return jsonify({
            "error": "Map service returned an invalid response."
        }), 502

    except requests.RequestException:
        app.logger.exception("Map service request failed")
        return jsonify({
            "error": "Map service unavailable. Please try again later."
        }), 502

    except ValueError:
        app.logger.exception("Invalid route data received")
        return jsonify({
            "error": "Map service returned invalid route data."
        }), 502


if __name__ == "__main__":
    app.run(debug=True, port=5000)