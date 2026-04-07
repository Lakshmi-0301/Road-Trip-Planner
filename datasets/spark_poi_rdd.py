"""
Road Trip Planner — Spark RDD POI Preprocessing
================================================
Demonstrates Spark RDD fundamentals required for submission:

  Transformations : map, filter, flatMap, reduceByKey, sortBy, distinct, mapValues
  Actions         : count, collect, take, first, countByKey

Pipeline
--------
  sc.textFile()
    → map()        parse CSV rows
    → filter()     remove nulls / bad coordinates
    → flatMap()    emit (city, category) keyed pairs
    → reduceByKey() aggregate POI counts per city+category
    → mapValues()  normalise counts
    → sortBy()     rank by count descending

Output: datasets/cleaned_poi_counts.parquet
  Used by spark_traffic_consumer.py instead of raw CSV
"""

import math
import os
import sys

from pyspark.sql import SparkSession
from pyspark.sql.types import (
    StructType, StructField, StringType, IntegerType,
)

# ─────────────────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────────────────
POI_CSV_PATH     = os.path.join(os.path.dirname(__file__), "poi_all_cities.csv")
OUTPUT_PARQUET   = os.path.join(os.path.dirname(__file__), "cleaned_poi_counts.parquet")

VALID_CATEGORIES = {"fuel", "hospital", "hotel", "restaurant", "cafe",
                    "viewpoint", "attraction"}

# Categories that count as "restaurants" for the trip planner UI
RESTAURANT_CATS  = {"hotel", "restaurant", "cafe"}

# ─────────────────────────────────────────────────────────────────────────────
# SPARK SESSION
# ─────────────────────────────────────────────────────────────────────────────
spark = (
    SparkSession.builder
    .appName("RoadTripPlanner_RDD_POI_Preprocessing")
    .master("local[*]")
    .getOrCreate()
)
spark.sparkContext.setLogLevel("ERROR")
sc = spark.sparkContext

print("\n" + "═" * 62)
print("  Road Trip Planner — RDD POI Preprocessing Pipeline")
print("═" * 62)

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 1 — Load raw text as RDD
# ─────────────────────────────────────────────────────────────────────────────
print("\n[ STAGE 1 ]  sc.textFile() — load raw CSV")

raw_rdd = sc.textFile(POI_CSV_PATH)

# Action: first() — inspect the header
header = raw_rdd.first()
print(f"  Header row  : {header}")

# Remove header row — Transformation: filter()
data_rdd = raw_rdd.filter(lambda line: line.strip() != header and line.strip() != "")

# Action: count()
raw_count = data_rdd.count()
print(f"  Data rows   : {raw_count:,}")

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 2 — map() : parse each CSV line into a typed tuple
# ─────────────────────────────────────────────────────────────────────────────
print("\n[ STAGE 2 ]  map() — parse + normalise each row")

def parse_row(line: str):
    """
    Parse one CSV line.
    Returns (city, place_name, category, lat, lon) or None if malformed.
    CSV format: city,place_name,category,lat,lon
    """
    try:
        parts = line.strip().split(",")
        if len(parts) < 5:
            return None
        city      = parts[0].strip().upper()          # normalise to UPPER
        place     = parts[1].strip()
        category  = parts[2].strip().lower()           # normalise to lower
        lat       = float(parts[3].strip())
        lon       = float(parts[4].strip())
        return (city, place, category, lat, lon)
    except (ValueError, IndexError):
        return None                                    # malformed → filtered out

parsed_rdd = data_rdd.map(parse_row)

# Action: take() — spot-check parsed output
sample_parsed = parsed_rdd.take(4)
print("  Sample parsed rows:")
for row in sample_parsed:
    print(f"    {row}")

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 3 — filter() : remove nulls and out-of-range coordinates
# ─────────────────────────────────────────────────────────────────────────────
print("\n[ STAGE 3 ]  filter() — remove nulls + invalid coordinates")

def is_valid(record) -> bool:
    if record is None:
        return False
    _, place, category, lat, lon = record
    return (
        place != ""
        and category in VALID_CATEGORIES
        and -90.0  <= lat <= 90.0
        and -180.0 <= lon <= 180.0
    )

valid_rdd = parsed_rdd.filter(is_valid)

# Actions: count() on both to show how many were dropped
valid_count   = valid_rdd.count()
dropped_count = raw_count - valid_count
print(f"  Valid records  : {valid_count:,}")
print(f"  Dropped records: {dropped_count:,}  (nulls / bad coords / unknown categories)")

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 4 — distinct() : deduplicate by (city, place_name, category)
# ─────────────────────────────────────────────────────────────────────────────
print("\n[ STAGE 4 ]  distinct() — remove duplicate POI entries")

# map to dedup key, then distinct, then restore full record
keyed_for_dedup = valid_rdd.map(lambda r: ((r[0], r[1], r[2]), r))
deduped_rdd     = keyed_for_dedup.distinct().map(lambda kv: kv[1])

deduped_count = deduped_rdd.count()   # Action: count()
print(f"  After dedup: {deduped_count:,}  (removed {valid_count - deduped_count:,} duplicates)")

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 5 — flatMap() : emit multiple (key, 1) pairs per record
# ─────────────────────────────────────────────────────────────────────────────
print("\n[ STAGE 5 ]  flatMap() — emit (city, category) keyed pairs")

def emit_pairs(record):
    """
    Emit two keyed pairs per POI record:
      1. (city, canonical_category) → 1   for per-category count
      2. (city, "total")            → 1   for city-level total
    Restaurants and hotels are merged into one 'restaurants' bucket.
    """
    city, place, category, lat, lon = record
    canonical = "restaurants" if category in RESTAURANT_CATS else category
    return [
        ((city, canonical), 1),
        ((city, "total"),   1),
    ]

pairs_rdd = deduped_rdd.flatMap(emit_pairs)

# Action: take() — inspect a handful of pairs
sample_pairs = pairs_rdd.take(8)
print("  Sample (key, count) pairs:")
for pair in sample_pairs:
    print(f"    {pair}")

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 6 — reduceByKey() : sum counts per (city, category)
# ─────────────────────────────────────────────────────────────────────────────
print("\n[ STAGE 6 ]  reduceByKey() — aggregate counts per city+category")

counts_rdd = pairs_rdd.reduceByKey(lambda a, b: a + b)

# Action: countByKey() — how many distinct categories per city?
category_by_city = (
    counts_rdd
    .map(lambda kv: (kv[0][0], 1))   # (city, 1) per (city,cat) combo
    .reduceByKey(lambda a, b: a + b)
    .collect()                         # Action: collect()
)
print("  Distinct (city, category) combinations:")
for city, n in sorted(category_by_city):
    print(f"    {city:<15} → {n} categories")

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 7 — sortBy() : rank by count descending
# ─────────────────────────────────────────────────────────────────────────────
print("\n[ STAGE 7 ]  sortBy() — rank entries by count descending")

sorted_rdd = counts_rdd.sortBy(lambda kv: -kv[1])

# Action: collect()
all_counts = sorted_rdd.collect()

print(f"\n  {'City':<14} {'Category':<14} {'Count':>6}")
print(f"  {'─'*14} {'─'*14} {'─'*6}")
for (city, category), cnt in all_counts:
    if category != "total":
        print(f"  {city:<14} {category:<14} {cnt:>6}")

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 8 — mapValues() + reduceByKey() : pivot to per-city feature vector
# ─────────────────────────────────────────────────────────────────────────────
print("\n[ STAGE 8 ]  mapValues() + reduceByKey() — build city feature vectors")

# Only keep the categories the trip planner needs
NEEDED = {"fuel", "restaurants", "hospital"}

def to_feature_dict(kv):
    """Map (city, category), count → city, {category: count}"""
    (city, category), count = kv
    if category == "total" or category not in NEEDED:
        return None
    return (city, {category: count})

feature_rdd = (
    counts_rdd
    .map(to_feature_dict)
    .filter(lambda x: x is not None)
)

def merge_dicts(a: dict, b: dict) -> dict:
    merged = dict(a)
    for k, v in b.items():
        merged[k] = merged.get(k, 0) + v
    return merged

city_features_rdd = feature_rdd.reduceByKey(merge_dicts)

# mapValues() — fill missing categories with 0
city_features_rdd = city_features_rdd.mapValues(
    lambda d: {
        "fuel":        d.get("fuel",        0),
        "restaurants": d.get("restaurants", 0),
        "hospitals":   d.get("hospital",    0),
    }
)

# Action: collect()
city_features = city_features_rdd.collect()

print("\n  City feature vectors (used for route enrichment):")
print(f"  {'City':<14} {'Fuel':>6} {'Restaurants':>13} {'Hospitals':>10}")
print(f"  {'─'*14} {'─'*6} {'─'*13} {'─'*10}")
for city, feats in sorted(city_features):
    print(
        f"  {city:<14} "
        f"{feats['fuel']:>6} "
        f"{feats['restaurants']:>13} "
        f"{feats['hospitals']:>10}"
    )

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 9 — RDD → DataFrame → Parquet
# ─────────────────────────────────────────────────────────────────────────────
print("\n[ STAGE 9 ]  RDD → DataFrame → Parquet  (for streaming pipeline)")

schema = StructType([
    StructField("city",        StringType(),  nullable=False),
    StructField("fuel_stops",  IntegerType(), nullable=False),
    StructField("restaurants", IntegerType(), nullable=False),
    StructField("hospitals",   IntegerType(), nullable=False),
])

rows = [
    (city, feats["fuel"], feats["restaurants"], feats["hospitals"])
    for city, feats in city_features
]

poi_df = spark.createDataFrame(rows, schema=schema)
poi_df.show(truncate=False)

poi_df.write.mode("overwrite").parquet(OUTPUT_PARQUET)
print(f"  Saved → {OUTPUT_PARQUET}")
print("  spark_traffic_consumer.py will load this parquet instead of raw CSV.\n")

# ─────────────────────────────────────────────────────────────────────────────
# SUMMARY — RDD Operation Recap
# ─────────────────────────────────────────────────────────────────────────────
print("═" * 62)
print("  RDD OPERATION SUMMARY")
print("═" * 62)
print("  Transformations used:")
print("    map()         — parse CSV rows + key restructuring")
print("    filter()      — remove nulls, bad coords, unknown cats")
print("    flatMap()     — emit multiple keyed pairs per record")
print("    distinct()    — deduplicate by (city, name, category)")
print("    reduceByKey() — aggregate counts per (city, category)")
print("    mapValues()   — fill missing category keys with zero")
print("    sortBy()      — rank by count descending")
print()
print("  Actions used:")
print("    count()       — verify record counts at each stage")
print("    first()       — inspect CSV header")
print("    take(n)       — spot-check intermediate results")
print("    collect()     — gather final results to driver")
print("═" * 62 + "\n")

spark.stop()