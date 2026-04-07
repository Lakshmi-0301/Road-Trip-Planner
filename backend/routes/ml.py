"""
Model Info Router — Road Trip Planner
======================================
GET /api/model_info
  Returns ML model metrics (RMSE, R², training stats) for display
  in the analytics section of the TripResult / Dashboard pages.

GET /api/predict_travel_time
  Quick test endpoint — predict travel time for a single segment.
"""

import logging
from fastapi import APIRouter, Query

from services.ml_service import predict_travel_time, get_model_info

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["ml"])


@router.get("/model_info")
def model_info():
    """
    Return metadata about the trained ML model.
    Used by the frontend to render the Analytics panel on the Dashboard.

    Response example:
    {
        "available": true,
        "rmse_minutes": 4.23,
        "r2_score": 0.9812,
        "n_training_rows": 4800,
        "best_num_trees": 100,
        "best_max_depth": 10,
        "algorithm": "RandomForestRegressor (sklearn mirror of Spark MLlib model)"
    }
    """
    return get_model_info()


@router.get("/predict_travel_time")
def predict(
    distance_km:   float = Query(..., gt=0, description="Segment distance in km"),
    avg_speed:     float = Query(..., gt=0, description="Average speed in km/h"),
    traffic_level: str   = Query("MODERATE", description="LOW | MODERATE | HIGH"),
    weather_risk:  str   = Query("LOW",      description="LOW | MEDIUM | HIGH"),
):
    """
    Predict travel time for a single segment using the ML model.
    Useful for testing the model from the browser or Swagger UI.
    """
    prediction = predict_travel_time(
        distance_km=distance_km,
        avg_speed=avg_speed,
        traffic_level=traffic_level,
        weather_risk=weather_risk,
    )

    # Physics baseline for comparison
    physics_time = round((distance_km / max(avg_speed, 5.0)) * 60.0, 1)

    return {
        "distance_km":      distance_km,
        "avg_speed":        avg_speed,
        "traffic_level":    traffic_level,
        "weather_risk":     weather_risk,
        "ml_prediction_min":      prediction,
        "physics_baseline_min":   physics_time,
        "delta_min":              round(prediction - physics_time, 1),
    }