"""
Road Trip Planner — Spark MLlib Travel Time Predictor
=====================================================
Demonstrates Spark ML libraries required for submission:

  Pipeline          — chain transformers + estimator
  StringIndexer     — encode traffic_level, weather_risk categoricals
  VectorAssembler   — combine features into a single vector
  RandomForestRegressor — ensemble regression model
  CrossValidator    — k-fold hyperparameter tuning
  RegressionEvaluator — RMSE and R² metrics
  Model persistence — save / load via MLlib

Training Data
-------------
Synthetic traffic samples generated from the same distributions
used by kafka_traffic_producer.py — so the model learns real
peak/off-peak dynamics without needing a live data source.

Outputs
-------
  models/travel_time_rf/         — saved Spark MLlib pipeline model
  models/travel_time_model.pkl   — sklearn mirror (for FastAPI serving)
  models/feature_stats.json      — feature means/stds for monitoring
"""

import json
import math
import os
import random

from pyspark.sql import SparkSession
from pyspark.sql.functions import col
from pyspark.sql.types import (
    DoubleType, StringType, StructField, StructType,
)
from pyspark.ml import Pipeline
from pyspark.ml.feature import StringIndexer, VectorAssembler
from pyspark.ml.regression import RandomForestRegressor
from pyspark.ml.evaluation import RegressionEvaluator
from pyspark.ml.tuning import CrossValidator, ParamGridBuilder

# ─────────────────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────────────────
MODEL_DIR        = os.path.join(os.path.dirname(__file__), "..", "models")
SPARK_MODEL_PATH = os.path.join(MODEL_DIR, "travel_time_rf")
SKLEARN_PKL_PATH = os.path.join(MODEL_DIR, "travel_time_model.pkl")
STATS_JSON_PATH  = os.path.join(MODEL_DIR, "feature_stats.json")
os.makedirs(MODEL_DIR, exist_ok=True)

RANDOM_SEED   = 42
N_SAMPLES     = 6000    # training samples to generate
TRAIN_RATIO   = 0.8
CV_FOLDS      = 3

# City coordinates (matches cassandra_service.py)
CITIES_COORDS = {
    "Chennai":    (13.0827, 80.2707),
    "Bangalore":  (12.9716, 77.5946),
    "Mysore":     (12.2958, 76.6394),
    "Coimbatore": (11.0168, 76.9558),
    "Puducherry": (11.9416, 79.8083),
    "Hyderabad":  (17.3850, 78.4867),
    "Kochi":      (9.9312,  76.2673),
}

# ─────────────────────────────────────────────────────────────────────────────
# SPARK SESSION
# ─────────────────────────────────────────────────────────────────────────────
spark = (
    SparkSession.builder
    .appName("RoadTripPlanner_MLlib_TravelTimePredictor")
    .master("local[*]")
    .config("spark.sql.shuffle.partitions", "8")
    .getOrCreate()
)
spark.sparkContext.setLogLevel("ERROR")

print("\n" + "═" * 64)
print("  Road Trip Planner — MLlib Travel Time Predictor")
print("═" * 64)

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 1 — Haversine helper
# ─────────────────────────────────────────────────────────────────────────────
def haversine(lat1, lon1, lat2, lon2) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

# Pre-compute all city-pair distances
cities = list(CITIES_COORDS.keys())
city_pairs = [
    (src, dst, round(haversine(*CITIES_COORDS[src], *CITIES_COORDS[dst])))
    for src in cities for dst in cities if src != dst
]

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 2 — Synthetic Training Data Generation
# ─────────────────────────────────────────────────────────────────────────────
print("\n[ SECTION 2 ]  Generating synthetic training data")
print(f"  City pairs : {len(city_pairs)}")
print(f"  Samples    : {N_SAMPLES}")

random.seed(RANDOM_SEED)

TRAFFIC_SPEED_RANGES = {
    "LOW":      (50.0, 80.0),
    "MODERATE": (25.0, 50.0),
    "HIGH":     (5.0,  25.0),
}
WEATHER_SLOWDOWN = {
    "LOW":    1.00,   # no slowdown
    "MEDIUM": 1.12,   # 12 % longer
    "HIGH":   1.30,   # 30 % longer (rain/wind)
}

def generate_sample(src, dst, dist_km: float) -> dict:
    traffic  = random.choice(["LOW", "MODERATE", "HIGH"])
    weather  = random.choice(["LOW", "MEDIUM", "HIGH"])

    lo, hi   = TRAFFIC_SPEED_RANGES[traffic]
    base_spd = random.uniform(lo, hi)

    # 5 % chance of random incident (matches producer logic)
    if random.random() < 0.05:
        base_spd = random.uniform(0.5, 10.0)
        traffic  = "HIGH"

    effective_speed = max(base_spd / WEATHER_SLOWDOWN[weather], 3.0)

    # Ground-truth travel time with ±5 % noise
    travel_time = (dist_km / effective_speed) * 60.0
    travel_time *= random.uniform(0.95, 1.05)

    return {
        "source":           src,
        "destination":      dst,
        "distance_km":      float(dist_km),
        "avg_speed":        round(base_spd, 2),
        "traffic_level":    traffic,
        "weather_risk":     weather,
        "travel_time_min":  round(travel_time, 2),
    }

samples_per_pair = max(1, N_SAMPLES // len(city_pairs))
raw_samples = [
    generate_sample(src, dst, dist)
    for src, dst, dist in city_pairs
    for _ in range(samples_per_pair)
]
random.shuffle(raw_samples)

print(f"  Generated  : {len(raw_samples):,} samples across {len(city_pairs)} city pairs")

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 3 — Create Spark DataFrame from samples
# ─────────────────────────────────────────────────────────────────────────────
print("\n[ SECTION 3 ]  Create Spark DataFrame + Spark SQL inspection")

schema = StructType([
    StructField("source",          StringType(), True),
    StructField("destination",     StringType(), True),
    StructField("distance_km",     DoubleType(), True),
    StructField("avg_speed",       DoubleType(), True),
    StructField("traffic_level",   StringType(), True),
    StructField("weather_risk",    StringType(), True),
    StructField("travel_time_min", DoubleType(), True),
])

df = spark.createDataFrame(raw_samples, schema=schema)
df.createOrReplaceTempView("training_data")

# Spark SQL — show class distribution
print("\n  Traffic level distribution (Spark SQL):")
spark.sql("""
    SELECT traffic_level,
           COUNT(*)                                   AS count,
           ROUND(AVG(avg_speed), 1)                  AS avg_speed_kmh,
           ROUND(AVG(travel_time_min), 1)             AS avg_travel_min
    FROM   training_data
    GROUP  BY traffic_level
    ORDER  BY avg_speed_kmh DESC
""").show()

print("  Weather risk distribution (Spark SQL):")
spark.sql("""
    SELECT weather_risk,
           COUNT(*)                                   AS count,
           ROUND(AVG(travel_time_min), 1)             AS avg_travel_min
    FROM   training_data
    GROUP  BY weather_risk
    ORDER  BY avg_travel_min
""").show()

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 4 — MLlib Pipeline: StringIndexer + VectorAssembler + RF
# ─────────────────────────────────────────────────────────────────────────────
print("[ SECTION 4 ]  Build MLlib Pipeline")

# 4a. Encode categorical string columns to numeric indices
traffic_indexer = StringIndexer(
    inputCol="traffic_level",
    outputCol="traffic_idx",
    stringOrderType="frequencyDesc",   # HIGH traffic → most samples → index 0
)
weather_indexer = StringIndexer(
    inputCol="weather_risk",
    outputCol="weather_idx",
    stringOrderType="frequencyDesc",
)

# 4b. Assemble feature vector
assembler = VectorAssembler(
    inputCols=["distance_km", "avg_speed", "traffic_idx", "weather_idx"],
    outputCol="features",
)

# 4c. Random Forest Regressor
rf = RandomForestRegressor(
    featuresCol="features",
    labelCol="travel_time_min",
    predictionCol="prediction",
    seed=RANDOM_SEED,
)

pipeline = Pipeline(stages=[traffic_indexer, weather_indexer, assembler, rf])

print("  Pipeline stages:")
print("    1. StringIndexer  — traffic_level → traffic_idx")
print("    2. StringIndexer  — weather_risk  → weather_idx")
print("    3. VectorAssembler — [distance_km, avg_speed, traffic_idx, weather_idx] → features")
print("    4. RandomForestRegressor — features → travel_time_min")

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 5 — Train / Test Split
# ─────────────────────────────────────────────────────────────────────────────
print(f"\n[ SECTION 5 ]  Train/test split  ({int(TRAIN_RATIO*100)}/{int((1-TRAIN_RATIO)*100)})")

train_df, test_df = df.randomSplit([TRAIN_RATIO, 1 - TRAIN_RATIO], seed=RANDOM_SEED)
print(f"  Train rows : {train_df.count():,}")
print(f"  Test rows  : {test_df.count():,}")

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 6 — CrossValidator for hyperparameter tuning
# ─────────────────────────────────────────────────────────────────────────────
print(f"\n[ SECTION 6 ]  CrossValidator ({CV_FOLDS}-fold) — hyperparameter search")

param_grid = (
    ParamGridBuilder()
    .addGrid(rf.numTrees,    [50, 100])
    .addGrid(rf.maxDepth,    [5, 10])
    .addGrid(rf.minInstancesPerNode, [1, 5])
    .build()
)

evaluator = RegressionEvaluator(
    labelCol="travel_time_min",
    predictionCol="prediction",
    metricName="rmse",
)

cv = CrossValidator(
    estimator=pipeline,
    estimatorParamMaps=param_grid,
    evaluator=evaluator,
    numFolds=CV_FOLDS,
    seed=RANDOM_SEED,
    parallelism=2,
)

print(f"  Param grid size : {len(param_grid)} combinations × {CV_FOLDS} folds")
print("  Training... (this may take a moment)")

cv_model    = cv.fit(train_df)
best_model  = cv_model.bestModel

# Best params
rf_stage     = best_model.stages[-1]
best_trees   = rf_stage.getNumTrees
best_depth   = rf_stage.getOrDefault("maxDepth")
print(f"  Best numTrees : {best_trees}")
print(f"  Best maxDepth : {best_depth}")

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 7 — Evaluate on held-out test set
# ─────────────────────────────────────────────────────────────────────────────
print("\n[ SECTION 7 ]  Evaluate on test set")

predictions = best_model.transform(test_df)

rmse_eval = RegressionEvaluator(
    labelCol="travel_time_min", predictionCol="prediction", metricName="rmse"
)
r2_eval = RegressionEvaluator(
    labelCol="travel_time_min", predictionCol="prediction", metricName="r2"
)
mae_eval = RegressionEvaluator(
    labelCol="travel_time_min", predictionCol="prediction", metricName="mae"
)

rmse = rmse_eval.evaluate(predictions)
r2   = r2_eval.evaluate(predictions)
mae  = mae_eval.evaluate(predictions)

print(f"\n  ┌──────────────────────────────┐")
print(f"  │  RMSE : {rmse:>8.2f} minutes     │")
print(f"  │  MAE  : {mae:>8.2f} minutes     │")
print(f"  │  R²   : {r2:>8.4f}             │")
print(f"  └──────────────────────────────┘")

# Sample predictions vs actuals
print("\n  Sample predictions (test set):")
(
    predictions
    .select(
        "source", "destination", "distance_km",
        "traffic_level", "weather_risk",
        col("travel_time_min").alias("actual_min"),
        col("prediction").alias("predicted_min"),
    )
    .orderBy("distance_km")
    .limit(10)
    .show(truncate=False)
)

# Feature importances
fi = rf_stage.featureImportances
feat_names = ["distance_km", "avg_speed", "traffic_idx", "weather_idx"]
print("  Feature importances:")
for name, imp in sorted(zip(feat_names, fi.toArray()), key=lambda x: -x[1]):
    bar = "█" * int(imp * 30)
    print(f"    {name:<15} {imp:.4f}  {bar}")

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 8 — Save Spark MLlib model
# ─────────────────────────────────────────────────────────────────────────────
print(f"\n[ SECTION 8 ]  Save Spark MLlib model → {SPARK_MODEL_PATH}")

best_model.write().overwrite().save(SPARK_MODEL_PATH)
print("  Spark model saved.")

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 9 — Export sklearn mirror model for FastAPI serving
# ─────────────────────────────────────────────────────────────────────────────
print(f"\n[ SECTION 9 ]  Train sklearn mirror → {SKLEARN_PKL_PATH}")
print("  (Spark model is used for batch/streaming; sklearn serves the REST API)")

try:
    import joblib
    import numpy as np
    from sklearn.ensemble import RandomForestRegressor as SkRF
    from sklearn.preprocessing import LabelEncoder
    from sklearn.metrics import mean_squared_error, r2_score

    # Collect training data to driver for sklearn
    rows_pd = train_df.toPandas()

    le_traffic = LabelEncoder().fit(["LOW", "MODERATE", "HIGH"])
    le_weather = LabelEncoder().fit(["LOW", "MEDIUM", "HIGH"])

    def encode(pdf):
        X = np.column_stack([
            pdf["distance_km"].values,
            pdf["avg_speed"].values,
            le_traffic.transform(pdf["traffic_level"]),
            le_weather.transform(pdf["weather_risk"]),
        ])
        return X

    X_train = encode(rows_pd)
    y_train = rows_pd["travel_time_min"].values

    sk_rf = SkRF(n_estimators=best_trees, max_depth=best_depth, random_state=RANDOM_SEED)
    sk_rf.fit(X_train, y_train)

    # Quick eval on test split
    test_pd  = test_df.toPandas()
    X_test   = encode(test_pd)
    y_test   = test_pd["travel_time_min"].values
    y_pred   = sk_rf.predict(X_test)
    sk_rmse  = math.sqrt(mean_squared_error(y_test, y_pred))
    sk_r2    = r2_score(y_test, y_pred)
    print(f"  sklearn mirror  RMSE={sk_rmse:.2f} min   R²={sk_r2:.4f}")

    # Save sklearn model + encoders
    artifact = {
        "model":      sk_rf,
        "le_traffic": le_traffic,
        "le_weather": le_weather,
    }
    joblib.dump(artifact, SKLEARN_PKL_PATH)
    print(f"  sklearn model saved → {SKLEARN_PKL_PATH}")

    # Save feature stats for monitoring / drift detection
    stats = {
        "rmse_spark":   round(rmse, 3),
        "r2_spark":     round(r2, 4),
        "rmse_sklearn": round(sk_rmse, 3),
        "r2_sklearn":   round(sk_r2, 4),
        "n_train":      len(X_train),
        "best_num_trees": int(best_trees),
        "best_max_depth": int(best_depth),
        "traffic_classes": list(le_traffic.classes_),
        "weather_classes":  list(le_weather.classes_),
    }
    with open(STATS_JSON_PATH, "w") as f:
        json.dump(stats, f, indent=2)
    print(f"  Feature stats  → {STATS_JSON_PATH}")

except ImportError:
    print("  sklearn / joblib not installed — skipping sklearn export.")
    print("  Run: pip install scikit-learn joblib")

# ─────────────────────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "═" * 64)
print("  ML PIPELINE SUMMARY")
print("═" * 64)
print("  Spark ML components used:")
print("    StringIndexer       — encode traffic_level, weather_risk")
print("    VectorAssembler     — build feature vector")
print("    RandomForestRegressor — ensemble regression (MLlib)")
print("    Pipeline            — chain all stages")
print("    CrossValidator      — 3-fold CV with ParamGridBuilder")
print("    RegressionEvaluator — RMSE, MAE, R² metrics")
print(f"\n  Final model RMSE : {rmse:.2f} min   R² : {r2:.4f}")
print("═" * 64 + "\n")

spark.stop()