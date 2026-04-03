"""
Cassandra Service — Road Trip Planner

Queries the `route_results` table for segment data.
Falls back to deterministic mock data when Cassandra is unavailable,
so the API is always demonstrable regardless of pipeline state.
"""

import math
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# City coordinates (matches spark_traffic_consumer.py CITIES_COORDS)
# ---------------------------------------------------------------------------
CITIES_COORDS: dict[str, tuple[float, float]] = {
    "Chennai":    (13.0827, 80.2707),
    "Bangalore":  (12.9716, 77.5946),
    "Mysore":     (12.2958, 76.6394),
    "Coimbatore": (11.0168, 76.9558),
    "Puducherry": (11.9416, 79.8083),
    "Hyderabad":  (17.3850, 78.4867),
    "Kochi":      (9.9312,  76.2673),
}

# ---------------------------------------------------------------------------
# Haversine distance (km) between two lat/lon pairs
# ---------------------------------------------------------------------------
def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ---------------------------------------------------------------------------
# Cassandra connection (lazy, tolerates absence)
# ---------------------------------------------------------------------------
_session = None

def _get_session():
    global _session
    if _session is not None:
        return _session
    try:
        from cassandra.cluster import Cluster  # type: ignore
        from cassandra.policies import RoundRobinPolicy  # type: ignore
        cluster = Cluster(
            ["localhost"],
            port=9042,
            load_balancing_policy=RoundRobinPolicy(),
            connect_timeout=5,
        )
        _session = cluster.connect("roadtrip")
        logger.info("Cassandra connected: roadtrip keyspace")
        return _session
    except Exception as exc:
        logger.warning("Cassandra unavailable (%s) — will use mock data", exc)
        return None


# ---------------------------------------------------------------------------
# Build ordered intermediate cities between source and destination
# ---------------------------------------------------------------------------
_KNOWN_ORDER = ["Hyderabad", "Bangalore", "Mysore", "Coimbatore", "Kochi",
                "Chennai", "Puducherry"]

def _ordered_route(source: str, destination: str) -> list[str]:
    """
    Returns an ordered list [source, ...intermediates..., destination].
    Uses a geographic south-to-north/east-west ordering heuristic so that
    any pair of cities produces a sensible waypoint chain.
    """
    cities = list(CITIES_COORDS.keys())
    if source not in cities or destination not in cities:
        return [source, destination]

    # Sort all cities by distance from source, then pick those that lie
    # between source and destination (simple linear interpolation heuristic).
    src_lat, src_lon = CITIES_COORDS[source]
    dst_lat, dst_lon = CITIES_COORDS[destination]

    def _on_path(city: str) -> bool:
        if city in (source, destination):
            return False
        lat, lon = CITIES_COORDS[city]
        # Dot-product check: point is "between" source and destination
        d_src = _haversine(src_lat, src_lon, lat, lon)
        d_dst = _haversine(lat, lon, dst_lat, dst_lon)
        d_total = _haversine(src_lat, src_lon, dst_lat, dst_lon)
        return (d_src + d_dst) < d_total * 1.25  # 25% detour tolerance

    intermediates = sorted(
        [c for c in cities if _on_path(c)],
        key=lambda c: _haversine(src_lat, src_lon, *CITIES_COORDS[c]),
    )
    return [source] + intermediates + [destination]


# ---------------------------------------------------------------------------
# Mock segment builder (used when Cassandra is down)
# ---------------------------------------------------------------------------
_BASE_SPEED = 62.0  # km/h average

_MOCK_POI: dict[str, dict] = {
    "Chennai":    {"fuel": 18, "restaurants": 42, "hospitals": 12},
    "Bangalore":  {"fuel": 24, "restaurants": 55, "hospitals": 18},
    "Mysore":     {"fuel": 11, "restaurants": 28, "hospitals": 7},
    "Coimbatore": {"fuel": 14, "restaurants": 35, "hospitals": 10},
    "Puducherry": {"fuel": 8,  "restaurants": 22, "hospitals": 5},
    "Hyderabad":  {"fuel": 30, "restaurants": 68, "hospitals": 22},
    "Kochi":      {"fuel": 16, "restaurants": 38, "hospitals": 14},
}

def _mock_segments(route: list[str]) -> list[dict]:
    segments = []
    for i in range(len(route) - 1):
        src, dst = route[i], route[i + 1]
        src_lat, src_lon = CITIES_COORDS[src]
        dst_lat, dst_lon = CITIES_COORDS[dst]
        dist = round(_haversine(src_lat, src_lon, dst_lat, dst_lon))
        travel_time = round((dist / _BASE_SPEED) * 60, 1)
        src_poi = _MOCK_POI.get(src, {"fuel": 5, "restaurants": 10, "hospitals": 3})
        dst_poi = _MOCK_POI.get(dst, {"fuel": 5, "restaurants": 10, "hospitals": 3})
        segments.append({
            "segment_start":   src,
            "segment_end":     dst,
            "distance_km":     dist,
            "avg_speed":       _BASE_SPEED,
            "travel_time_min": travel_time,
            "fuel_stops":      src_poi["fuel"] + dst_poi["fuel"],
            "restaurants":     src_poi["restaurants"] + dst_poi["restaurants"],
            "hospitals":       src_poi["hospitals"] + dst_poi["hospitals"],
            "traffic_level":   "MODERATE",
            "weather_risk":    "LOW",
            "data_source":     "mock",
        })
    return segments


# ---------------------------------------------------------------------------
# Cassandra query
# ---------------------------------------------------------------------------
_QUERY = """
    SELECT segment_start, segment_end, distance_km, avg_speed,
           travel_time_min, fuel_stops, restaurants, hospitals,
           traffic_level, weather_risk, timestamp
    FROM route_results
    WHERE segment_start = %s AND segment_end = %s
    LIMIT 1
"""

def _cassandra_segment(session, src: str, dst: str) -> Optional[dict]:
    """Fetch the latest segment row for a src→dst pair."""
    try:
        rows = list(session.execute(_QUERY, (src, dst)))
        if not rows:
            return None
        r = rows[0]
        return {
            "segment_start":   r.segment_start,
            "segment_end":     r.segment_end,
            "distance_km":     int(r.distance_km or 0),
            "avg_speed":       float(r.avg_speed or _BASE_SPEED),
            "travel_time_min": float(r.travel_time_min or 0),
            "fuel_stops":      int(r.fuel_stops or 0),
            "restaurants":     int(r.restaurants or 0),
            "hospitals":       int(r.hospitals or 0),
            "traffic_level":   str(r.traffic_level or "MODERATE"),
            "weather_risk":    str(r.weather_risk or "LOW"),
            "data_source":     "cassandra",
        }
    except Exception as exc:
        logger.warning("Cassandra query failed for %s→%s: %s", src, dst, exc)
        return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def get_route_segments(source: str, destination: str) -> list[dict]:
    """
    Return ordered list of segment dicts from source to destination.
    Uses Cassandra if available; falls back to mock data per segment.
    """
    route = _ordered_route(source, destination)
    session = _get_session()

    segments: list[dict] = []
    for i in range(len(route) - 1):
        src, dst = route[i], route[i + 1]
        seg = None
        if session:
            seg = _cassandra_segment(session, src, dst)
            # Also try reverse (in case Cassandra has dst→src)
            if seg is None:
                seg = _cassandra_segment(session, dst, src)
                if seg:
                    seg["segment_start"], seg["segment_end"] = src, dst
        if seg is None:
            seg = _mock_segments([src, dst])[0]
        segments.append(seg)

    return segments


def get_ordered_route(source: str, destination: str) -> list[str]:
    """Return the full ordered city list for a route."""
    return _ordered_route(source, destination)
