# Project Abstract: Intelligent Road Trip Planner with Real-Time Big Data Analytics

## Overview
The **Intelligent Road Trip Planner** is a full-stack, data-driven application designed to optimize travel experiences by combining traditional routing with real-time big data analytics. The system enables users to plan personalized road trips by evaluating multiple route types (scenic, quick, balanced, off-road) while dynamically integrating live traffic conditions, weather forecasts, and Point of Interest (POI) data. At its core, the project leverages a robust big data pipeline to ingest, process, and store high-velocity, semi-structured streaming data, empowering advanced machine learning models to predict accurate travel times.

## Data Architecture & Storage
* **Data Sources (Semi-Structured & Streaming Data):** The pipeline handles continuous, semi-structured streaming data representing live traffic telemetry (JSON payloads with vehicle counts, speeds, and timestamps) and real-time weather metrics via external APIs. Static route polylines and POI data are extracted from OpenStreetMap.
* **Database (NoSQL - Cassandra):** To handle the high write throughput of streaming aggregations and support fast reads for the application backend, **Apache Cassandra** is utilized as the primary NoSQL data store. The `route_results` table persists computed segment statistics, traffic levels, and weather risks per windowed batch. A supplementary SQLite database is used strictly for structured user authentication data.

## Real-Time Data Processing Engine
The heavy lifting of the backend data engineering is powered by **Apache Kafka** and **Apache Spark**:
* **Message Broker (Apache Kafka):** Kafka serves as the backbone for the real-time event-streaming architecture. A custom local Kafka producer simulates and publishes high-frequency, semi-structured traffic telemetry into structured topics, ensuring high availability and fault tolerance.
* **Real-Time Streaming Data Processing (Apache Spark Structured Streaming):** A Spark consumer ingests the live Kafka stream, parsing the JSON payloads into strongly typed schemas. Micro-batching and 30-second window-based aggregations are applied to stabilize speed calculations, preventing erratic travel time fluctuations before pushing the data into Cassandra in `append` mode.

## Spark Transformations, Actions & SQL
The Spark streaming consumer extensively utilizes **RDD/DataFrame Transformations and Actions** to enrich the data stream:
* **Transformations:** Windowing (`window`), grouping (`groupBy`), filtering (`filter`), missing value handling, and joins are used to merge the live traffic stream with live weather data and aggregated POI counts. Custom feature engineering is performed using stateful operations like `withColumn` to compute safety metrics (`safe_speed`, `traffic_level`, `weather_risk`). 
* **Actions:** Terminal operations such as `foreachBatch`, `collect`, and `writeStream` trigger the DAG execution, locally compiling route segments and committing the finalized insights payload to Cassandra.
* **Spark SQL:** The system employs Spark SQL capabilities extensively for exploratory data analysis (EDA), generating summary statistics, and viewing class distributions (e.g., traffic level and weather risk impacts) over temporary views (`training_data`) to ensure balanced model training.

## Machine Learning Integration (Spark MLlib)
To predict travel times dynamically, the pipeline incorporates **Apache Spark MLlib**, training on a rich dataset containing distance, average speed, traffic congestion, and weather risk features.
* **Pipeline & Feature Engineering:** The ML workflow heavily utilizes `StringIndexer` to encode categorical variables and `VectorAssembler` to pack features into vector columns.
* **Model Selection:** A `RandomForestRegressor` ensemble model is deployed to capture complex, non-linear dependencies between weather slowdowns and traffic blockages.
* **Tuning & Evaluation:** The model is continuously refined using `CrossValidator` and `ParamGridBuilder` for k-fold hyperparameter tuning, evaluated based on RMSE, MAE, and R-squared metrics via `RegressionEvaluator`. For flexible serving via the FastAPI backend, an sklearn mirror model is efficiently exported.

## Conclusion
This platform successfully bridges consumer-facing web architectures (React/Vite frontend and FastAPI backend) with enterprise-grade big data paradigms. By leveraging Kafka for data ingress, Spark for complex event processing, MLlib for predictive analytics, and Cassandra for massive-scale persistence, the application presents a scalable, highly resilient model for next-generation, context-aware navigational software.
