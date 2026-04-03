"""
Trip Planning Router — Road Trip Planner

GET /plan_trip
Query params:
    source      (str)  — source city name
    destination (str)  — destination city name
    date        (str)  — travel date YYYY-MM-DD
    passengers  (int)  — number of passengers (1–50)

Returns a unified JSON object with:
    route     — source, destination, polyline, ordered cities
    segments  — per-segment breakdown (distance, time, stops)
    summary   — total travel time, stop time, total trip time, passengers
    weather   — per-city forecast for the travel date
"""

import logging
from datetime import date as DateType

from fastapi import APIRouter, HTTPException, Query

from backend.services.cassandra_service import (
    CITIES_COORDS,
    get_route_segments,
    get_ordered_route,
)
from backend.services.routing_service import get_polyline
from backend.services.weather_service import get_weather

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["trip"])

SUPPORTED_CITIES = list(CITIES_COORDS.keys())

# Stop time constants (minutes)
FUEL_STOP_MIN = 5
RESTAURANT_STOP_MIN = 20

# Cap how many "stops" we count for time calculation
MAX_FUEL_COUNTED = 3
MAX_RESTAURANT_COUNTED = 2


@router.get("/plan_trip")
async def plan_trip(
    source: str = Query(..., description="Source city"),
    destination: str = Query(..., description="Destination city"),
    date: str = Query(..., description="Travel date YYYY-MM-DD"),
    passengers: int = Query(..., ge=1, le=50, description="Number of passengers"),
):
    # ── 1. Validate cities ────────────────────────────────────────────────
    if source not in SUPPORTED_CITIES:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported source city '{source}'. Supported: {SUPPORTED_CITIES}",
        )
    if destination not in SUPPORTED_CITIES:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported destination city '{destination}'. Supported: {SUPPORTED_CITIES}",
        )
    if source == destination:
        raise HTTPException(
            status_code=422,
            detail="Source and destination must be different cities.",
        )

    # ── 2. Validate date ──────────────────────────────────────────────────
    try:
        DateType.fromisoformat(date)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid date format. Use YYYY-MM-DD.")

    # ── 3. Get ordered route and segment data ─────────────────────────────
    try:
        ordered_cities = get_ordered_route(source, destination)
        segments_raw = get_route_segments(source, destination)
    except Exception as exc:
        logger.error("Route segment fetch failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to retrieve route data.")

    if not segments_raw:
        raise HTTPException(
            status_code=404,
            detail=f"No route data found for {source} → {destination}.",
        )

    # ── 4. Build segment response objects ────────────────────────────────
    total_distance = 0
    total_travel_time = 0.0
    total_fuel_stops = 0
    total_restaurants = 0

    segments_out = []
    for seg in segments_raw:
        dist = seg["distance_km"]
        tt = seg["travel_time_min"]
        fuel = seg["fuel_stops"]
        rests = seg["restaurants"]
        hosps = seg["hospitals"]

        total_distance += dist
        total_travel_time += tt
        total_fuel_stops += fuel
        total_restaurants += rests

        # Convert raw POI counts to capped, meaningful recommendations
        recommended_fuel = min(fuel, 5)  # top-N recommendations
        recommended_restaurants = min(rests, 5)
        recommended_hospitals = min(hosps, 3)

        segments_out.append({
            "start": seg["segment_start"],
            "end": seg["segment_end"],
            "distance_km": dist,
            "travel_time_min": round(tt, 1),
            "avg_speed_kmh": round(seg["avg_speed"], 1),
            "traffic_level": seg["traffic_level"],
            "weather_risk": seg["weather_risk"],
            "stops": {
                "fuel": recommended_fuel,
                "restaurants": recommended_restaurants,
                "hospitals": recommended_hospitals,
            },
            "data_source": seg.get("data_source", "cassandra"),
        })

    # ── 5. Compute total trip time ─────────────────────────────────────────
    # Cap counted stops to avoid unrealistically large stop times
    counted_fuel = min(total_fuel_stops, MAX_FUEL_COUNTED * len(segments_raw))
    counted_rests = min(total_restaurants, MAX_RESTAURANT_COUNTED * len(segments_raw))
    stop_time = (counted_fuel * FUEL_STOP_MIN) + (counted_rests * RESTAURANT_STOP_MIN)
    total_trip_time = round(total_travel_time + stop_time, 1)

    # ── 6. Get route polyline ─────────────────────────────────────────────
    try:
        waypoints = [CITIES_COORDS[city] for city in ordered_cities if city in CITIES_COORDS]
        polyline = get_polyline(waypoints)
    except Exception as exc:
        logger.error("Polyline fetch failed: %s", exc)
        # Non-fatal — return empty polyline, map can still show markers
        polyline = []

    # ── 7. Get weather ────────────────────────────────────────────────────
    try:
        weather = get_weather(ordered_cities, CITIES_COORDS, date)
    except Exception as exc:
        logger.error("Weather fetch failed: %s", exc)
        weather = []

    # ── 8. Build city info list (coords for markers) ──────────────────────
    cities_info = [
        {
            "name": city,
            "lat": CITIES_COORDS[city][0],
            "lon": CITIES_COORDS[city][1],
            "role": "source" if city == source else ("destination" if city == destination else "intermediate"),
        }
        for city in ordered_cities
        if city in CITIES_COORDS
    ]

    # ── 9. Return unified response ────────────────────────────────────────
    return {
        "route": {
            "source": source,
            "destination": destination,
            "ordered_cities": ordered_cities,
            "cities": cities_info,
            "polyline": polyline,
            "total_distance_km": total_distance,
        },
        "segments": segments_out,
        "summary": {
            "travel_time_min": round(total_travel_time, 1),
            "stop_time_min": stop_time,
            "total_trip_time_min": total_trip_time,
            "passengers": passengers,
            "date": date,
        },
        "weather": weather,
    }
