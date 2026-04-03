# =============================================================================
# Road Trip Planner — Spark Structured Streaming Consumer v3.2
# =============================================================================
# Pipeline Architecture:
#   Kafka Stream
#     → Parse & Clean (ETL)
#     → Window-based Aggregation (30s window, speeds stability)
#     → Join live Weather 
#     → Join aggregated POI Counts 
#     → Feature Engineering (safe_speed, traffic_level, weather_risk)
#     → foreachBatch handler (append mode):
#           ├── Build Route Segments (source → destination pairs per window)
#           ├── Compute physics-based Travel Time (safe_speed clamped)
#           ├── Write to Console
#           └── Write to Cassandra
# =============================================================================

import os
import shutil
import requests
import builtins
from collections import defaultdict

python_round = builtins.round

from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col, from_json, avg, lower, when, round as spark_round,
    count, lit, current_timestamp, to_timestamp, window, first
)
from pyspark.sql.types import (
    StructType, StructField, StringType, IntegerType, DoubleType, TimestampType
)

# =============================================================================
# SECTION 0: Configuration
# =============================================================================

KAFKA_TOPIC             = "traffic_topic"
KAFKA_BOOTSTRAP_SERVERS = "localhost:29092"
CASSANDRA_HOST          = "localhost"
CASSANDRA_PORT          = "9042"
CASSANDRA_KEYSPACE      = "roadtrip"
CASSANDRA_TABLE         = "route_results"
CHECKPOINT_DIR          = "./checkpoints/segments"

# Route: List cities in order (source → destination)
# Compatible with any cities defined in the dictionary. 
TARGET_ROUTE = ["Bangalore", "Mysore", "Chennai"]

ROUTE_DISTANCES = {
    ("Bangalore", "Mysore"):  145,
    ("Mysore",    "Chennai"): 480,
}

CITIES_COORDS = {
    "Chennai":    (13.0827, 80.2707),
    "Bangalore":  (12.9716, 77.5946),
    "Mysore":     (12.2958, 76.6394),
    "Coimbatore": (11.0168, 76.9558),
    "Puducherry": (11.9416, 79.8083),
    "Hyderabad":  (17.3850, 78.4867),
    "Kochi":      (9.9312,  76.2673)
}

POI_CSV_PATH = "/Users/lakshmir/Desktop/Big Data/Road-trip-planner/datasets/poi_all_cities.csv"

# =============================================================================
# SECTION 1: Spark Session
# =============================================================================

if os.path.exists(CHECKPOINT_DIR):
    shutil.rmtree(CHECKPOINT_DIR)
    print(f"  Cleared stale checkpoint: {CHECKPOINT_DIR}")

spark = (
    SparkSession.builder
    .appName("RoadTripPlanner_v3_2")
    .config(
        "spark.jars.packages",
        "org.apache.spark:spark-sql-kafka-0-10_2.13:4.1.1,"
        "com.datastax.spark:spark-cassandra-connector_2.13:3.5.0"
    )
    .config("spark.cassandra.connection.host", CASSANDRA_HOST)
    .config("spark.cassandra.connection.port", CASSANDRA_PORT)
    .getOrCreate()
)
spark.sparkContext.setLogLevel("ERROR")

# =============================================================================
# SECTION 2: Schema
# =============================================================================

TRAFFIC_SCHEMA = StructType([
    StructField("city",          StringType(),  nullable=True),
    StructField("speed",         DoubleType(),  nullable=True),
    StructField("vehicle_count", IntegerType(), nullable=True),
    StructField("timestamp",     StringType(),  nullable=True),
])

# =============================================================================
# SECTION 3: Static Data — Load Once at Startup
# =============================================================================

# Add aggregated POI dataset
print("\n  Loading and grouping POI dataset...")
poi_raw_df = (
    spark.read
    .option("header", "true")
    .option("inferSchema", "true")
    .csv(POI_CSV_PATH)
    .withColumn("city_norm", lower(col("city")))
)

# Aggregate POI dataset FIRST (Fix 3)
poi_counts_df = (
    poi_raw_df
    .groupBy("city_norm")
    .agg(
        count(when(col("category") == "fuel", lit(1))).alias("fuel_stops"),
        count(when(col("category").isin("hotel", "restaurant", "cafe"), lit(1))).alias("restaurants"),
        count(when(col("category") == "hospital", lit(1))).alias("hospitals"),
    )
)
poi_counts_df.cache()

# Live Weather snapshot
def get_live_weather():
    weather_data = []
    print("  🌤️  Fetching live weather from Open-Meteo...")
    for city, (lat, lon) in CITIES_COORDS.items():
        try:
            url = (
                f"https://api.open-meteo.com/v1/forecast"
                f"?latitude={lat}&longitude={lon}"
                f"&current_weather=true&hourly=relative_humidity_2m"
            )
            resp = requests.get(url, timeout=10).json()
            temp     = float(resp.get("current_weather", {}).get("temperature", 25.0))
            humidity = int(resp.get("hourly", {}).get("relative_humidity_2m", [60])[0])
            weather_data.append((city, temp, humidity))
            print(f"     {city}: {temp}°C | Humidity: {humidity}%")
        except Exception as e:
            weather_data.append((city, 25.0, 60))
    return weather_data

weather_records = get_live_weather()
weather_df = (
    spark.createDataFrame(weather_records, ["city_name", "temperature", "humidity"])
    .withColumn("city_norm", lower(col("city_name")))
    .drop("city_name")
)
weather_df.cache()

# =============================================================================
# SECTION 4: Kafka Stream → ETL
# =============================================================================

raw_stream = (
    spark.readStream
    .format("kafka")
    .option("kafka.bootstrap.servers", KAFKA_BOOTSTRAP_SERVERS)
    .option("subscribe", KAFKA_TOPIC)
    .option("startingOffsets", "latest")
    .load()
)

cleaned_stream = (
    raw_stream
    .selectExpr("CAST(value AS STRING) AS raw")
    .withColumn("data", from_json(col("raw"), TRAFFIC_SCHEMA))
    .select("data.*")
    .filter(col("city").isNotNull() & col("speed").isNotNull() & col("timestamp").isNotNull())
    .filter(col("speed") >= 0)
    .withColumn("city_norm", lower(col("city")))
    .withColumn("event_time", to_timestamp("timestamp"))
)

# =============================================================================
# SECTION 5: Window Aggregation (Fix 1)
# =============================================================================

windowed_traffic = (
    cleaned_stream
    .withWatermark("event_time", "30 seconds")
    .groupBy(
        window(col("event_time"), "30 seconds"),
        col("city_norm")
    )
    .agg(
        avg("speed").alias("avg_speed"),
        avg("vehicle_count").alias("avg_vehicle_count")
    )
)

# =============================================================================
# SECTION 6: Stream × Static Joins (Fix 4: Proper Join Order)
# =============================================================================

# Join 1: Weather (1-to-1 by city)
enriched = windowed_traffic.join(weather_df, on="city_norm", how="left")

# Join 2: POI Counts (1-to-1 by city)
enriched = enriched.join(poi_counts_df, on="city_norm", how="left")

# =============================================================================
# SECTION 7: Feature Engineering & Safe Speed (Fix 2)
# =============================================================================

enriched = enriched.withColumn(
    "safe_speed",
    when(col("avg_speed") < 10, lit(10.0)).otherwise(col("avg_speed"))
)

enriched = enriched.withColumn(
    "traffic_level",
    when(col("safe_speed") < 25,  "HIGH")
    .when((col("safe_speed") >= 25) & (col("safe_speed") <= 50), "MODERATE")
    .otherwise("LOW")
)

enriched = enriched.withColumn(
    "weather_risk",
    when(col("humidity") > 75, "HIGH")
    .when(col("humidity") >= 50, "MEDIUM")
    .otherwise("LOW")
)

# Filter stream to only the cities we need to consider 
route_stream = enriched.filter(col("city_norm").isin([c.lower() for c in TARGET_ROUTE]))

# =============================================================================
# SECTION 8: foreachBatch Handler (Segment-Level Output)
# =============================================================================

def process_batch(batch_df, batch_id):
    """
    Called per micro-batch output of the window aggregator.
    Since outputMode is 'append', these rows are finalized windows that 
    will not change anymore.
    """
    
    if batch_df.isEmpty():
        return

    records = batch_df.collect()
    
    # Structure data by window block and city
    windows = defaultdict(dict)
    for r in records:
        w_start = r["window"].start
        w_end = r["window"].end
        c_norm = r["city_norm"]
        windows[(w_start, w_end)][c_norm] = r
        
    segment_rows = []
    
    # Build segments locally (Fix 5: Safe Segment Output)
    for (w_start, w_end), city_data in windows.items():
        for i in range(len(TARGET_ROUTE) - 1):
            src_city = TARGET_ROUTE[i]
            dst_city = TARGET_ROUTE[i + 1]
            
            src_norm = src_city.lower()
            dst_norm = dst_city.lower()

            if src_norm not in city_data or dst_norm not in city_data:
                continue

            src = city_data[src_norm]
            dst = city_data[dst_norm]
            dist_km = ROUTE_DISTANCES.get((src_city, dst_city), 0)

            safe_speed = float(src["safe_speed"])
            # Fix 6: Use safe_speed for travel time
            travel_time = python_round((dist_km / safe_speed) * 60, 1)

            segment_rows.append({
                "window_start":    w_start,
                "window_end":      w_end,
                "segment_start":   src_city,
                "segment_end":     dst_city,
                "distance_km":     dist_km,
                "avg_speed":       python_round(safe_speed, 2),
                "traffic_level":   src["traffic_level"],
                "weather_risk":    src["weather_risk"],
                "travel_time_min": travel_time,
                "fuel_stops":      int(src["fuel_stops"] or 0) + int(dst["fuel_stops"] or 0),
                "restaurants":     int(src["restaurants"] or 0) + int(dst["restaurants"] or 0),
                "hospitals":       int(src["hospitals"] or 0) + int(dst["hospitals"] or 0),
            })

    if not segment_rows:
        return

    SEGMENT_SCHEMA = StructType([
        StructField("window_start",    TimestampType(), False),
        StructField("window_end",      TimestampType(), False),
        StructField("segment_start",   StringType(),  False),
        StructField("segment_end",     StringType(),  False),
        StructField("distance_km",     IntegerType(), False),
        StructField("avg_speed",       DoubleType(),  False),
        StructField("traffic_level",   StringType(),  False),
        StructField("weather_risk",    StringType(),  False),
        StructField("travel_time_min", DoubleType(),  False),
        StructField("fuel_stops",      IntegerType(), False),
        StructField("restaurants",     IntegerType(), False),
        StructField("hospitals",       IntegerType(), False),
    ])

    seg_df = spark.createDataFrame(segment_rows, schema=SEGMENT_SCHEMA)
    
    # Required for Cassandra write timestamp parameter compatibility 
    seg_df = seg_df.withColumn("timestamp", col("window_end"))

    print(f"\n  ═══════════════════ Batch {batch_id} ═══════════════════")
    # Fix 7: Clean Output display
    seg_df.select(
        "window_start", "window_end", "segment_start", "segment_end", 
        "distance_km", "avg_speed", "traffic_level", "travel_time_min", 
        "fuel_stops", "restaurants"
    ).show(truncate=False)

    try:
        (
            seg_df.drop("window_start", "window_end")
            .write
            .format("org.apache.spark.sql.cassandra")
            .options(table=CASSANDRA_TABLE, keyspace=CASSANDRA_KEYSPACE)
            .mode("append")
            .save()
        )
    except Exception as e:
        print(f"  [Cassandra] Write failed for Batch {batch_id}: {e}")

# =============================================================================
# SECTION 9: Start Streaming Query
# =============================================================================

print(f"\n  🚀 Streaming started | Kafka: {KAFKA_BOOTSTRAP_SERVERS}")
print(f"     Route      : {' → '.join(TARGET_ROUTE)}")
print(f"     Segments   : {' | '.join([f'{TARGET_ROUTE[i]}→{TARGET_ROUTE[i+1]}' for i in range(len(TARGET_ROUTE)-1)])}")
print(f"     Output Mode: Append (Emits only on complete safe windows)\n")

# Use 'append' output format as requested natively on the query runner.
query = (
    route_stream
    .writeStream
    .foreachBatch(process_batch)
    .option("checkpointLocation", CHECKPOINT_DIR)
    .outputMode("append")
    .start()
)

query.awaitTermination()
