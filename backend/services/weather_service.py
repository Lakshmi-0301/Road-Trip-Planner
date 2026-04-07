"""
Weather Service — Road Trip Planner

Fetches daily weather forecasts from Open-Meteo (no API key required)
for each city in the route, filtered to the requested travel date.
"""

import logging
from datetime import date as DateType, timedelta

import requests

logger = logging.getLogger(__name__)

OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast"
TIMEOUT = 10  # seconds

# Fallback defaults when Open-Meteo is unreachable
_DEFAULTS = {"temperature": 28.0, "precipitation_probability": 20, "windspeed": 12.0}


def _fetch_city_weather(city: str, lat: float, lon: float, travel_date: str) -> dict:
    """
    Fetch daily weather for a single city on travel_date.
    Returns a dict with city, temperature, precipitation_probability, windspeed.
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": "temperature_2m_max,precipitation_probability_max,windspeed_10m_max",
        "timezone": "Asia/Kolkata",
        # Request a 2-week window around the travel date to handle near-future requests
        "forecast_days": 14,
    }

    try:
        resp = requests.get(OPEN_METEO_BASE, params=params, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()

        daily = data.get("daily", {})
        dates = daily.get("time", [])
        temps = daily.get("temperature_2m_max", [])
        precips = daily.get("precipitation_probability_max", [])
        winds = daily.get("windspeed_10m_max", [])

        if travel_date in dates:
            idx = dates.index(travel_date)
            return {
                "city": city,
                "temperature": round(float(temps[idx] if temps[idx] is not None else _DEFAULTS["temperature"]), 1),
                "precipitation_probability": int(precips[idx] if precips[idx] is not None else _DEFAULTS["precipitation_probability"]),
                "windspeed": round(float(winds[idx] if winds[idx] is not None else _DEFAULTS["windspeed"]), 1),
            }
        else:
            # Date is beyond forecast window — return defaults with a note
            logger.warning("Travel date %s not in Open-Meteo window for %s", travel_date, city)
            return {
                "city": city,
                "temperature": _DEFAULTS["temperature"],
                "precipitation_probability": _DEFAULTS["precipitation_probability"],
                "windspeed": _DEFAULTS["windspeed"],
                "note": "forecast unavailable for this date",
            }

    except Exception as exc:
        logger.warning("Open-Meteo failed for %s: %s", city, exc)
        return {
            "city": city,
            "temperature": _DEFAULTS["temperature"],
            "precipitation_probability": _DEFAULTS["precipitation_probability"],
            "windspeed": _DEFAULTS["windspeed"],
        }


import asyncio
import httpx  # pip install httpx

async def _fetch_city_weather_async(client, city, lat, lon, travel_date):
    params = {
        "latitude": lat, "longitude": lon,
        "daily": "temperature_2m_max,precipitation_probability_max,windspeed_10m_max",
        "timezone": "Asia/Kolkata", "forecast_days": 14,
    }
    try:
        resp = await client.get(OPEN_METEO_BASE, params=params, timeout=TIMEOUT)
        data = resp.json()
        daily = data.get("daily", {})
        dates = daily.get("time", [])
        if travel_date in dates:
            idx = dates.index(travel_date)
            return {
                "city": city,
                "temperature": round(float(daily["temperature_2m_max"][idx] or 28), 1),
                "precipitation_probability": int(daily["precipitation_probability_max"][idx] or 20),
                "windspeed": round(float(daily["windspeed_10m_max"][idx] or 12), 1),
            }
    except Exception as exc:
        logger.warning("Weather failed for %s: %s", city, exc)
    return {"city": city, **_DEFAULTS}

def get_weather(cities, city_coords, travel_date):
    async def _run():
        async with httpx.AsyncClient() as client:
            tasks = [
                _fetch_city_weather_async(client, city, *city_coords[city], travel_date)
                for city in dict.fromkeys(cities)  # dedupe, preserve order
                if city in city_coords
            ]
            return await asyncio.gather(*tasks)
    return asyncio.run(_run())