"""
Cassandra Service — Road Trip Planner
======================================
Queries the `route_results` table for segment data.
Falls back to deterministic mock data when Cassandra is unavailable.

v2 change: mock segment travel_time_min now comes from the ML model
(backend/services/ml_service.py) instead of the hardcoded _BASE_SPEED
physics formula — so the ML pipeline feeds the REST API directly.
"""

import math
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# City coordinates (matches spark_traffic_consumer.py CITIES_COORDS)
# ─────────────────────────────────────────────────────────────────────────────
CITIES_COORDS: dict[str, tuple[float, float]] = {
    "Chennai":    (13.0827, 80.2707),
    "Bangalore":  (12.9716, 77.5946),
    "Mysore":     (12.2958, 76.6394),
    "Coimbatore": (11.0168, 76.9558),
    "Puducherry": (11.9416, 79.8083),
    "Hyderabad":  (17.3850, 78.4867),
    "Kochi":      (9.9312,  76.2673),
}

# ─────────────────────────────────────────────────────────────────────────────
# Haversine distance (km) between two lat/lon pairs
# ─────────────────────────────────────────────────────────────────────────────
def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

# ─────────────────────────────────────────────────────────────────────────────
# Cassandra connection (lazy, tolerates absence)
# ─────────────────────────────────────────────────────────────────────────────
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
        logger.warning("Cassandra unavailable (%s) — will use mock + ML data", exc)
        return None

# ─────────────────────────────────────────────────────────────────────────────
# Build ordered intermediate cities between source and destination
# ─────────────────────────────────────────────────────────────────────────────
def _ordered_route(source: str, destination: str, route_type: str = "balanced") -> list[str]:
    """
    Returns an ordered list [source, ...intermediates..., destination].
    
    route_type strategy:
      - "quick": Only source and destination (direct)
      - "scenic": Include ALL cities that are reasonably on the way
      - "balanced": Default behavior with moderate tolerance
      - "offroad": Similar to scenic
    """
    cities = list(CITIES_COORDS.keys())
    if source not in cities or destination not in cities:
        return [source, destination]

    src_lat, src_lon = CITIES_COORDS[source]
    dst_lat, dst_lon = CITIES_COORDS[destination]
    d_total = _haversine(src_lat, src_lon, dst_lat, dst_lon)

    # For quick routes, just return direct path
    if route_type == "quick":
        return [source, destination]

    # For scenic/offroad, be very permissive
    if route_type in ("scenic", "offroad"):
        detour_ratio = 1.50  # Very loose
        corridor_ratio = 0.30  # Very wide
    else:  # balanced
        detour_ratio = 1.10
        corridor_ratio = 0.12

    def _cross_track_km(lat: float, lon: float) -> float:
        """
        Approximate cross-track distance (km) of point from the
        great-circle path source→destination.
        """
        R = 6371.0
        lat1, lon1 = math.radians(src_lat), math.radians(src_lon)
        lat2, lon2 = math.radians(dst_lat), math.radians(dst_lon)
        lat3, lon3 = math.radians(lat),     math.radians(lon)

        d13 = _haversine(src_lat, src_lon, lat, lon) / R

        def _bearing(la1, lo1, la2, lo2):
            dlo = lo2 - lo1
            x = math.sin(dlo) * math.cos(la2)
            y = math.cos(la1) * math.sin(la2) - math.sin(la1) * math.cos(la2) * math.cos(dlo)
            return math.atan2(x, y)

        brg12 = _bearing(lat1, lon1, lat2, lon2)
        brg13 = _bearing(lat1, lon1, lat3, lon3)

        xt = math.asin(math.sin(d13) * math.sin(brg13 - brg12)) * R
        return abs(xt)

    def _on_path(city: str) -> bool:
        if city in (source, destination):
            return False
        lat, lon = CITIES_COORDS[city]
        d_src = _haversine(src_lat, src_lon, lat, lon)
        d_dst = _haversine(lat, lon, dst_lat, dst_lon)

        # Guard 1: detour ratio
        if (d_src + d_dst) >= d_total * detour_ratio:
            return False

        # Guard 2: corridor width
        max_xt = d_total * corridor_ratio
        if _cross_track_km(lat, lon) > max_xt:
            return False

        return True

    intermediates = sorted(
        [c for c in cities if _on_path(c)],
        key=lambda c: _haversine(src_lat, src_lon, *CITIES_COORDS[c]),
    )
    return [source] + intermediates + [destination]

# ─────────────────────────────────────────────────────────────────────────────
# Mock POI counts (used when Cassandra is unavailable)
# ─────────────────────────────────────────────────────────────────────────────
_MOCK_POI: dict[str, dict] = {
    "Chennai":    {"fuel": 18, "restaurants": 42, "hospitals": 12},
    "Bangalore":  {"fuel": 24, "restaurants": 55, "hospitals": 18},
    "Mysore":     {"fuel": 11, "restaurants": 28, "hospitals": 7},
    "Coimbatore": {"fuel": 14, "restaurants": 35, "hospitals": 10},
    "Puducherry": {"fuel": 8,  "restaurants": 22, "hospitals": 5},
    "Hyderabad":  {"fuel": 30, "restaurants": 68, "hospitals": 22},
    "Kochi":      {"fuel": 16, "restaurants": 38, "hospitals": 14},
}

# Default segment traffic/weather context used for mock data
_DEFAULT_TRAFFIC = "MODERATE"
_DEFAULT_WEATHER = "LOW"
_DEFAULT_SPEED   = 62.0

def _mock_segments(route: list[str]) -> list[dict]:
    """
    Build mock segments for a route.
    Travel time now comes from the ML model (ml_service.predict_travel_time)
    instead of the old physics formula.
    """
    # Import here to avoid circular imports at module load
    from services.ml_service import predict_travel_time

    segments = []
    for i in range(len(route) - 1):
        src, dst = route[i], route[i + 1]
        src_lat, src_lon = CITIES_COORDS[src]
        dst_lat, dst_lon = CITIES_COORDS[dst]
        dist = round(_haversine(src_lat, src_lon, dst_lat, dst_lon))

        # ── ML-predicted travel time (replaces fixed _BASE_SPEED formula) ──
        travel_time = predict_travel_time(
            distance_km=float(dist),
            avg_speed=_DEFAULT_SPEED,
            traffic_level=_DEFAULT_TRAFFIC,
            weather_risk=_DEFAULT_WEATHER,
        )

        src_poi = _MOCK_POI.get(src, {"fuel": 5, "restaurants": 10, "hospitals": 3})
        dst_poi = _MOCK_POI.get(dst, {"fuel": 5, "restaurants": 10, "hospitals": 3})

        segments.append({
            "segment_start":   src,
            "segment_end":     dst,
            "distance_km":     dist,
            "avg_speed":       _DEFAULT_SPEED,
            "travel_time_min": travel_time,          # ← ML prediction
            "fuel_stops":      src_poi["fuel"]        + dst_poi["fuel"],
            "restaurants":     src_poi["restaurants"] + dst_poi["restaurants"],
            "hospitals":       src_poi["hospitals"]   + dst_poi["hospitals"],
            "traffic_level":   _DEFAULT_TRAFFIC,
            "weather_risk":    _DEFAULT_WEATHER,
            "data_source":     "mock+ml",             # signals ML was used
        })
    return segments

# ─────────────────────────────────────────────────────────────────────────────
# Cassandra query
# ─────────────────────────────────────────────────────────────────────────────
_QUERY = """
    SELECT segment_start, segment_end, distance_km, avg_speed,
           travel_time_min, fuel_stops, restaurants, hospitals,
           traffic_level, weather_risk, timestamp
    FROM route_results
    WHERE segment_start = %s AND segment_end = %s
    LIMIT 1
"""

def _cassandra_segment(session, src: str, dst: str) -> Optional[dict]:
    """
    Fetch the latest segment row from Cassandra.
    If Cassandra has a travel_time_min from Spark Streaming, use it directly.
    Otherwise fall back to ML prediction.
    """
    from services.ml_service import predict_travel_time

    try:
        rows = list(session.execute(_QUERY, (src, dst)))
        if not rows:
            return None
        r = rows[0]

        dist      = int(r.distance_km   or 0)
        speed     = float(r.avg_speed   or _DEFAULT_SPEED)
        traffic   = str(r.traffic_level or _DEFAULT_TRAFFIC)
        weather   = str(r.weather_risk  or _DEFAULT_WEATHER)

        # Prefer Cassandra travel_time if it looks valid (non-zero)
        cass_tt = float(r.travel_time_min or 0)
        if cass_tt > 0:
            travel_time = cass_tt
            source_flag = "cassandra"
        else:
            # Cassandra row exists but travel_time is missing — use ML
            travel_time = predict_travel_time(
                distance_km=float(dist),
                avg_speed=speed,
                traffic_level=traffic,
                weather_risk=weather,
            )
            source_flag = "cassandra+ml"

        return {
            "segment_start":   r.segment_start,
            "segment_end":     r.segment_end,
            "distance_km":     dist,
            "avg_speed":       speed,
            "travel_time_min": travel_time,
            "fuel_stops":      int(r.fuel_stops   or 0),
            "restaurants":     int(r.restaurants  or 0),
            "hospitals":       int(r.hospitals    or 0),
            "traffic_level":   traffic,
            "weather_risk":    weather,
            "data_source":     source_flag,
        }
    except Exception as exc:
        logger.warning("Cassandra query failed for %s→%s: %s", src, dst, exc)
        return None

# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────
def get_route_segments(source: str, destination: str, route_type: str = "balanced") -> list[dict]:
    """
    Return ordered list of segment dicts from source to destination.
    Data source priority:
      1. Cassandra (Spark Streaming results)    → data_source: "cassandra"
      2. Cassandra row + ML travel time         → data_source: "cassandra+ml"
      3. Mock POI data + ML travel time         → data_source: "mock+ml"
    
    route_type affects the intermediate cities selected and travel time adjustments.
    """
    route   = _ordered_route(source, destination, route_type)
    logger.info(f"Route type: {route_type}, ordered route: {route}")
    session = _get_session()

    segments: list[dict] = []
    for i in range(len(route) - 1):
        src, dst = route[i], route[i + 1]
        seg = None

        if session:
            seg = _cassandra_segment(session, src, dst)
            if seg is None:
                # Try reverse direction
                seg = _cassandra_segment(session, dst, src)
                if seg:
                    seg["segment_start"], seg["segment_end"] = src, dst

        if seg is None:
            seg = _mock_segments([src, dst])[0]

        # Adjust travel time based on route type
        if route_type == "quick":
            seg["travel_time_min"] *= 0.85  # 15% faster
            seg["avg_speed"] *= 1.15
        elif route_type == "scenic":
            seg["travel_time_min"] *= 1.20  # 20% slower (enjoy views)
            seg["avg_speed"] *= 0.85
        elif route_type == "offroad":
            seg["travel_time_min"] *= 1.35  # 35% slower (rough terrain)
            seg["avg_speed"] *= 0.75

        segments.append(seg)

    return segments


def get_ordered_route(source: str, destination: str, route_type: str = "balanced") -> list[str]:
    """Return the full ordered city list for a route, adjusted by route type."""
    return _ordered_route(source, destination, route_type)