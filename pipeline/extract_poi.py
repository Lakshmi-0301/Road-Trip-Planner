import requests
import pandas as pd
import os
import time
import random

# -------------------------------
# CONFIG
# -------------------------------

cities = [
    "Chennai",
    "Bangalore",
    "Mysore",
    "Coimbatore",
    "Puducherry",
    "Hyderabad",
    "Kochi"
]

categories = {
    "fuel": '["amenity"="fuel"]',
    "hospital": '["amenity"="hospital"]',
    "hotel": '["tourism"="hotel"]',
    "viewpoint": '["tourism"="viewpoint"]',
    "attraction": '["tourism"="attraction"]'
}

# Multiple Overpass servers (important)
OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter"
]

all_data = []

# -------------------------------
# FETCH FUNCTION (ROBUST)
# -------------------------------

def fetch_data(city, category_name, tag):
    query = f"""
    [out:json][timeout:25];
    area["name"="{city}"]->.searchArea;
    (
      node{tag}(area.searchArea);
    );
    out;
    """

    for attempt in range(3):  # retry up to 3 times
        try:
            url = random.choice(OVERPASS_URLS)

            response = requests.get(url, params={'data': query}, timeout=60)

            if response.status_code != 200:
                raise Exception("Bad response")

            data = response.json()

            results = []
            for el in data.get("elements", []):
                tags = el.get("tags", {})

                results.append({
                    "city": city.upper(),
                    "place_name": tags.get("name", "Unknown"),
                    "category": category_name,
                    "lat": el.get("lat"),
                    "lon": el.get("lon")
                })

            return results

        except Exception:
            print(f"⚠️ Retry {attempt+1}: {city} - {category_name}")
            time.sleep(3)

    print(f"❌ Failed permanently: {city} - {category_name}")
    return []

# -------------------------------
# MAIN LOOP
# -------------------------------

for city in cities:
    print(f"\n📍 Processing city: {city}")

    for category_name, tag in categories.items():
        print(f"   → {category_name}")

        data = fetch_data(city, category_name, tag)
        all_data.extend(data)

        time.sleep(3)  # prevent rate limit

# -------------------------------
# CREATE DATAFRAME
# -------------------------------

df = pd.DataFrame(all_data)

# CLEAN
df = df.dropna(subset=["lat", "lon"])
df = df[df["place_name"] != "Unknown"]
df = df.drop_duplicates()

# -------------------------------
# SAVE FILE
# -------------------------------

output_path = os.path.join(os.path.dirname(__file__), "..", "datasets", "poi_all_cities.csv")
df.to_csv(output_path, index=False)

print(f"\n✅ DONE: {output_path} created")