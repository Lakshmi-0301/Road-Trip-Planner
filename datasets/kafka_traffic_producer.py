import json
import time
import random
import logging
from datetime import datetime, time as datetime_time
from confluent_kafka import Producer

# Configure logging for production-style output
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - [%(levelname)s] - %(message)s'
)
logger = logging.getLogger(__name__)

# Predefined list of Indian cities
CITIES = [
    "Chennai",
    "Bangalore",
    "Mysore",
    "Coimbatore",
    "Puducherry",
    "Hyderabad",
    "Kochi"
]

# --- Kafka Configuration for Local Docker ---
KAFKA_TOPIC = "traffic_topic"

# Local Kafka configuration (running on Docker port 29092)
KAFKA_CONFIG = {
    'bootstrap.servers': 'localhost:29092',
    'client.id': 'traffic-data-producer'
}


def delivery_report(err, msg):
    """
    Delivery callback for Kafka producer.
    Triggered once for each message to indicate delivery success or failure.
    """
    if err is not None:
        logger.error(f"Message delivery failed: {err}")
    else:
        # Logging individual deliveries can be spammy in high-throughput scenarios, 
        # but useful here as requested.
        logger.info(f"Delivered to topic '{msg.topic()}' [Partition {msg.partition()}] at offset {msg.offset()}")

def is_peak_hour(current_time: datetime) -> bool:
    """
    Determine if the current time falls within defined peak traffic hours:
    Morning: 08:00 - 10:00
    Evening: 17:00 - 20:00
    """
    current_hour = current_time.time()
    morning_peak_start = datetime_time(8, 0)
    morning_peak_end = datetime_time(10, 0)
    evening_peak_start = datetime_time(17, 0)
    evening_peak_end = datetime_time(20, 0)
    
    return (morning_peak_start <= current_hour <= morning_peak_end) or \
           (evening_peak_start <= current_hour <= evening_peak_end)

def generate_traffic_data() -> dict:
    """
    Generate synthetic traffic data mimicking real-world conditions.
    Traffic speed and vehicle count vary significantly based on the time of day.
    """
    now = datetime.now()
    city = random.choice(CITIES)
    is_peak = is_peak_hour(now)
    
    # Simulate time-based traffic variation
    if is_peak:
        # Peak hours: Heavy traffic, slow movement
        speed_kmh = round(random.uniform(5.0, 25.0), 2)
        vehicles = random.randint(150, 300)
    else:
        # Non-peak hours: Lighter traffic, faster movement
        speed_kmh = round(random.uniform(40.0, 80.0), 2)
        vehicles = random.randint(50, 150)
        
    # Introduce random anomalies (e.g., accidents or sudden jams) 
    # independent of peak hours (5% probability)
    if random.random() < 0.05:
        speed_kmh = round(random.uniform(0.0, 10.0), 2)
        vehicles = random.randint(250, 300)
        
    return {
        "city": city,
        "speed": speed_kmh,
        "vehicle_count": vehicles,
        "timestamp": now.isoformat()
    }

def main():
    """
    Main loop to continuously generate and send data to Confluent Cloud.
    """
    logger.info("Initializing Kafka Traffic Producer...")
    
    # Initialize the Producer object
    try:
        producer = Producer(KAFKA_CONFIG)
    except Exception as e:
        logger.error(f"Failed to intialize Kafka Producer: {e}")
        return

    logger.info(f"Successfully connected. Beginning stream to topic: '{KAFKA_TOPIC}'...")

    try:
        # Continuous streaming loop
        while True:
            # 1. Generate
            traffic_data = generate_traffic_data()
            
            # 2. Serialize to JSON
            json_payload = json.dumps(traffic_data)
            
            # 3. Console output (for debugging/visual tracking)
            print(f"---> Sending Data: {json_payload}")
            
            # 4. Produce to Kafka
            # Using the city name as the routing 'key' ensures all data for a 
            # specific city goes to the same Kafka partition (useful down the pipeline).
            producer.produce(
                topic=KAFKA_TOPIC,
                key=traffic_data["city"], 
                value=json_payload,
                callback=delivery_report
            )
            
            # 5. Serve delivery callback queue
            # This triggers delivery_report() for messages that have successfully 
            # completed transmission (or failed).
            producer.poll(0)
            
            # 6. Throttle production (1 to 2 seconds)
            time.sleep(random.uniform(1.0, 2.0))
            
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt captured. Stopping data generation...")
    except Exception as e:
        logger.error(f"An unexpected error disrupted the producer: {e}")
    finally:
        # Wait for any outstanding messages to be delivered and delivery report
        # callbacks to be triggered before exiting.
        logger.info("Flushing remaining messages in producer queue (up to 10 seconds)...")
        producer.flush(10)
        logger.info("Producer disconnected gracefully.")

if __name__ == "__main__":
    main()
