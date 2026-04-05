import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

cred = credentials.Certificate("serviceAccountKey.json")
try:
    firebase_admin.initialize_app(cred)
except ValueError:
    pass

db = firestore.client()

# Add to toilets collection
db.collection("toilets").document("5").set({
    "toilet_id": 5,
    "location": "Toilet 5",
    "status": "clean",
    "last_cleaned_time": datetime.now()
}, merge=True)

# Add to sensor_data collection
db.collection("sensor_data").add({
    "toilet_id": 5,
    "odour_level": 1.5,
    "usage_count": 5,
    "gas_value": 150,
    "gas_status": "Low",
    "distance": 80,
    "status": "clean",
    "alert": "None",
    "timestamp": datetime.now()
})
print("Successfully added clean sensor data for toilet 5! (and ensured it's registered in the toilets list)")
