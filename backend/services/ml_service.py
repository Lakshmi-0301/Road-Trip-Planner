"""
ML Service — Road Trip Planner
==============================
Loads the sklearn mirror model trained by pipeline/spark_ml.py
and exposes a predict_travel_time() function for the FastAPI trip router.

The full Spark MLlib model is used for batch training and streaming pipelines.
This lightweight sklearn model serves the REST API without needing a live
Spark context.

Falls back gracefully to the physics formula if the model file is absent
(e.g. first run before pipeline/spark_ml.py has been executed).
"""

import json
import logging
import math
import os
from typing import Optional

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Paths
# ─────────────────────────────────────────────────────────────────────────────
_BASE_DIR        = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
_MODEL_PKL       = os.path.join(_BASE_DIR, "models", "travel_time_model.pkl")
_STATS_JSON      = os.path.join(_BASE_DIR, "models", "feature_stats.json")

# ─────────────────────────────────────────────────────────────────────────────
# Module-level model cache (loaded once on first call)
# ─────────────────────────────────────────────────────────────────────────────
_artifact: Optional[dict] = None
_model_stats: Optional[dict] = None
_model_available: bool = False

# Fallback physics speed when model is unavailable
_FALLBACK_SPEED = 62.0  # km/h

# Label mappings — must match LabelEncoders in spark_ml_travel_predictor.py
_TRAFFIC_LEVELS = ["HIGH", "LOW", "MODERATE"]   # sklearn LabelEncoder sorts alphabetically
_WEATHER_RISKS  = ["HIGH", "LOW", "MEDIUM"]

def _traffic_to_int(level: str) -> int:
    """Map traffic level string to integer index (alphabetical order)."""
    mapping = {"HIGH": 0, "LOW": 1, "MODERATE": 2}
    return mapping.get(level.upper(), 1)   # default LOW

def _weather_to_int(risk: str) -> int:
    """Map weather risk string to integer index (alphabetical order)."""
    mapping = {"HIGH": 0, "LOW": 1, "MEDIUM": 2}
    return mapping.get(risk.upper(), 1)    # default LOW


def _load_model() -> bool:
    """
    Load the sklearn artifact from disk.
    Returns True if successful, False if model file is missing.
    """
    global _artifact, _model_stats, _model_available

    if _artifact is not None:
        return _model_available   # already loaded

    if not os.path.exists(_MODEL_PKL):
        logger.warning(
            "ML model not found at %s — using physics fallback. "
            "Run pipeline/spark_ml.py to generate it.",
            _MODEL_PKL,
        )
        _model_available = False
        return False

    try:
        import joblib
        _artifact = joblib.load(_MODEL_PKL)
        logger.info("ML model loaded from %s", _MODEL_PKL)

        if os.path.exists(_STATS_JSON):
            with open(_STATS_JSON) as f:
                _model_stats = json.load(f)
            logger.info(
                "Model stats — RMSE: %.2f min  R²: %.4f",
                _model_stats.get("rmse_sklearn", 0),
                _model_stats.get("r2_sklearn", 0),
            )

        _model_available = True
        return True

    except Exception as exc:
        logger.error("Failed to load ML model: %s", exc)
        _model_available = False
        return False


def predict_travel_time(
    distance_km: float,
    avg_speed: float,
    traffic_level: str,
    weather_risk: str,
) -> float:
    """
    Predict travel time (minutes) for a route segment.

    Parameters
    ----------
    distance_km   : segment distance in kilometres
    avg_speed     : current average speed in km/h (from Kafka stream / Cassandra)
    traffic_level : 'LOW' | 'MODERATE' | 'HIGH'
    weather_risk  : 'LOW' | 'MEDIUM' | 'HIGH'

    Returns
    -------
    Predicted travel time in minutes (float, rounded to 1 dp).

    Falls back to physics formula if model is unavailable.
    """
    _load_model()

    if not _model_available:
        # Physics fallback — same as original cassandra_service.py
        safe_speed = max(avg_speed if avg_speed > 0 else _FALLBACK_SPEED, 5.0)
        return round((distance_km / safe_speed) * 60.0, 1)

    try:
        import numpy as np

        model      = _artifact["model"]
        le_traffic = _artifact["le_traffic"]
        le_weather = _artifact["le_weather"]

        tl_encoded = le_traffic.transform([traffic_level.upper()])[0]
        wr_encoded = le_weather.transform([weather_risk.upper()])[0]

        X = np.array([[distance_km, avg_speed, tl_encoded, wr_encoded]])
        prediction = float(model.predict(X)[0])

        # Sanity clamp — never predict negative or absurdly high values
        safe_speed  = max(avg_speed if avg_speed > 0 else _FALLBACK_SPEED, 3.0)
        lower_bound = (distance_km / 120.0) * 60.0   # highway maximum ~120 km/h
        upper_bound = (distance_km / safe_speed) * 60.0 * 2.5   # 2.5× physics time

        prediction = max(lower_bound, min(prediction, upper_bound))

        return round(prediction, 1)

    except Exception as exc:
        logger.warning("ML prediction failed (%s) — using physics fallback", exc)
        safe_speed = max(avg_speed if avg_speed > 0 else _FALLBACK_SPEED, 5.0)
        return round((distance_km / safe_speed) * 60.0, 1)


def get_model_info() -> dict:
    """
    Return model metadata for the /api/model_info endpoint.
    Useful for showing ML analytics in the frontend dashboard.
    """
    _load_model()
    if not _model_available:
        return {
            "available": False,
            "message":   "Model not trained yet — run pipeline/spark_ml.py",
        }

    base = _model_stats or {}
    return {
        "available":       True,
        "rmse_minutes":    base.get("rmse_sklearn",   None),
        "r2_score":        base.get("r2_sklearn",     None),
        "n_training_rows": base.get("n_train",        None),
        "best_num_trees":  base.get("best_num_trees", None),
        "best_max_depth":  base.get("best_max_depth", None),
        "traffic_classes": base.get("traffic_classes", _TRAFFIC_LEVELS),
        "weather_classes":  base.get("weather_classes",  _WEATHER_RISKS),
        "model_path":      _MODEL_PKL,
        "algorithm":       "RandomForestRegressor (sklearn mirror of Spark MLlib model)",
    }