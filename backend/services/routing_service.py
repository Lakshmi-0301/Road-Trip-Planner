"""
Routing Service — Road Trip Planner

Uses the OSRM public demo server (no API key required) to fetch a
driving route polyline between ordered waypoints.

Falls back to a straight great-circle approximation if OSRM is
unreachable, so the map always renders something meaningful.
"""

import math
import logging
import requests

logger = logging.getLogger(__name__)

OSRM_BASE = "http://router.project-osrm.org/route/v1/driving"
TIMEOUT = 10  # seconds


# ---------------------------------------------------------------------------
# Haversine helpers (reused from cassandra_service to avoid circular import)
# ---------------------------------------------------------------------------
def _haversine_points(p1: tuple, p2: tuple) -> float:
    R = 6371.0
    lat1, lon1 = math.radians(p1[0]), math.radians(p1[1])
    lat2, lon2 = math.radians(p2[0]), math.radians(p2[1])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ---------------------------------------------------------------------------
# Straight-line polyline fallback (interpolates N points between waypoints)
# ---------------------------------------------------------------------------
def _straight_polyline(waypoints: list[tuple[float, float]], steps: int = 10) -> list[list[float]]:
    """Generate interpolated points along straight lines between waypoints."""
    coords: list[list[float]] = []
    for i in range(len(waypoints) - 1):
        lat1, lon1 = waypoints[i]
        lat2, lon2 = waypoints[i + 1]
        for s in range(steps):
            t = s / steps
            coords.append([lat1 + t * (lat2 - lat1), lon1 + t * (lon2 - lon1)])
    # Add the final point
    coords.append(list(waypoints[-1]))
    return coords


# ---------------------------------------------------------------------------
# Decode OSRM geometry (GeoJSON format — list of [lon, lat] pairs)
# ---------------------------------------------------------------------------
def _decode_geojson_coords(geometry: dict) -> list[list[float]]:
    """Convert GeoJSON [lon, lat] pairs to [[lat, lon], ...] for Leaflet."""
    return [[pt[1], pt[0]] for pt in geometry.get("coordinates", [])]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def get_polyline(waypoints: list[tuple[float, float]]) -> list[list[float]]:
    """
    Given an ordered list of (lat, lon) tuples, return a decoded polyline
    as [[lat, lon], ...] suitable for Leaflet.

    Tries OSRM first; falls back to straight-line interpolation on failure.
    """
    if len(waypoints) < 2:
        return [list(wp) for wp in waypoints]

    # OSRM expects lon,lat (longitude first)
    coords_str = ";".join(f"{lon},{lat}" for lat, lon in waypoints)
    url = f"{OSRM_BASE}/{coords_str}?overview=full&geometries=geojson"

    try:
        resp = requests.get(url, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()

        if data.get("code") != "Ok":
            raise ValueError(f"OSRM error code: {data.get('code')}")

        routes = data.get("routes", [])
        if not routes:
            raise ValueError("OSRM returned no routes")

        geometry = routes[0].get("geometry", {})
        polyline = _decode_geojson_coords(geometry)
        logger.info("OSRM polyline fetched: %d points", len(polyline))
        return polyline

    except Exception as exc:
        logger.warning("OSRM unavailable (%s) — using straight-line fallback", exc)
        return _straight_polyline(waypoints)
