weather_df = spark.read.csv(
    "/FileStore/tables/weather_data.csv",
    header=True,
    inferSchema=True
)