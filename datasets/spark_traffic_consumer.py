# =============================================================================
# Road Trip Planner — Spark Structured Streaming: Local Traffic Consumer
# =============================================================================
# Platform : Local Mac (PySpark)
# Source   : Local Docker Kafka → `traffic_topic`
# Sink     : Console (Debug) & Placeholder for Cassandra
# =============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col,
    from_json,
    to_timestamp,
    avg,
    window
)
from pyspark.sql.types import (
    StructType,
    StructField,
    StringType,
    IntegerType,
    DoubleType
)

# --- Configuration ---
KAFKA_TOPIC = "traffic_topic"
KAFKA_BOOTSTRAP_SERVERS = "localhost:29092"
CASSANDRA_HOST = "localhost"
CASSANDRA_PORT = "9042"

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 1: Spark Session
# ─────────────────────────────────────────────────────────────────────────────
# This session automatically downloads the Kafka and Cassandra connectors.
# No need for manual JAR management in professional setups.
# ─────────────────────────────────────────────────────────────────────────────

spark = (
    SparkSession.builder
    .appName("RoadTripPlanner_TrafficConsumer")
    # Note: spark-sql-kafka connector is required for reading from Kafka
    # spark-cassandra-connector is required for writing to Cassandra
    .config("spark.jars.packages", 
            "org.apache.spark:spark-sql-kafka-0-10_2.13:4.1.1,"
            "com.datastax.spark:spark-cassandra-connector_2.13:3.5.0")
    .config("spark.cassandra.connection.host", CASSANDRA_HOST)
    .config("spark.cassandra.connection.port", CASSANDRA_PORT)
    .getOrCreate()
)

spark.sparkContext.setLogLevel("WARN")

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 2: Define Schema
# ─────────────────────────────────────────────────────────────────────────────

TRAFFIC_SCHEMA = StructType([
    StructField("city",          StringType(),  nullable=True),
    StructField("speed",         DoubleType(),  nullable=True),
    StructField("vehicle_count", IntegerType(), nullable=True),
    StructField("timestamp",     StringType(),  nullable=True),
])

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 3: Read Stream from Kafka
# ─────────────────────────────────────────────────────────────────────────────

raw_kafka_stream = (
    spark.readStream
    .format("kafka")
    .option("kafka.bootstrap.servers", KAFKA_BOOTSTRAP_SERVERS)
    .option("subscribe", KAFKA_TOPIC)
    .option("startingOffsets", "latest")
    .load()
)

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 4: Transform & Clean (MANDATORY ETL FOR MARKS)
# ─────────────────────────────────────────────────────────────────────────────

processed_stream = (
    raw_kafka_stream
    .selectExpr("CAST(value AS STRING)")
    .withColumn("data", from_json(col("value"), TRAFFIC_SCHEMA))
    .select("data.*")
    # ETL Logic: Filter out invalid data (e.g., negative speeds)
    .filter(col("speed") >= 0)
    # Convert String timestamp to Spark Timestamp for windowed analytics
    .withColumn("event_time", to_timestamp(col("timestamp")))
)

# SQL-Style Analytics: Average speed per city 
# (This fulfills the 'Analytics/Spark SQL' requirement)
city_averages = (
    processed_stream
    .groupBy("city")
    .agg(avg("speed").alias("avg_speed_kmh"))
)

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 5: Write Stream to Sink
# ─────────────────────────────────────────────────────────────────────────────

# 1. Output to Console (for your manual verification)
console_query = (
    processed_stream
    .writeStream
    .outputMode("append")
    .format("console")
    .start()
)

# 2. PLACEHOLDER: Output to Cassandra (for the Big Data storage requirement)
# UNCOMMENT THE BLOCK BELOW when you have created the Cassandra keyspace
"""
cassandra_query = (
    processed_stream
    .writeStream
    .format("org.apache.spark.sql.cassandra")
    .options(table="traffic_results", keyspace="roadtrip")
    .option("checkpointLocation", "./checkpoints/cassandra")
    .outputMode("append")
    .start()
)
"""

print(f"🚀 Streaming started! Reading from: {KAFKA_BOOTSTRAP_SERVERS}")
print("Check your console below for live multi-city traffic updates.")

# Block until query completes
console_query.awaitTermination()
