import firebase_admin
from firebase_admin import credentials, firestore

try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
except:
    pass

db = firestore.client()

print("\n--- LATEST 10 SENSOR READINGS (NEWEST TO OLDEST) ---")

docs = db.collection("sensor_data").order_by("timestamp", direction=firestore.Query.DESCENDING).limit(10).stream()

for doc in docs:
    data = doc.to_dict()
    time_str = data.get('timestamp')
    print(f"Time: {time_str} | Toilet: {data.get('toilet_id')} | Status: {data.get('status')} | Odour: {data.get('odour_level')} | Gas: {data.get('gas_value')}")
print("----------------------------------------------------\n")
