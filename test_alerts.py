import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def naive(dt):
    if dt is None: return None
    return dt.replace(tzinfo=None) if hasattr(dt, "tzinfo") else dt

ODOUR_THRESHOLD = 6
USAGE_THRESHOLD = 30

alerts = []
toilet_map = {d.to_dict().get("toilet_id"): d.to_dict() for d in db.collection("toilets").stream()}

all_sensors = list(db.collection("sensor_data").stream())
print("Total sensors:", len(all_sensors))

all_sensors.sort(key=lambda d: naive(d.to_dict().get("timestamp")) or datetime.min, reverse=True)

seen = set()
for doc in all_sensors:
    row = doc.to_dict()
    tid = row.get("toilet_id")
    print(f"Checking toilet {tid}")
    print("Row data:", row)
    if tid in seen:
        print("Skipping seen")
        continue
    seen.add(tid)
    loc = toilet_map.get(tid, {}).get("location", f"Toilet {tid}")
    
    status = str(row.get("status", "")).upper()
    print("Status:", status, "Odour:", row.get("odour_level", 0))
    if status == "DIRTY" or row.get("odour_level", 0) > ODOUR_THRESHOLD:
        alerts.append({"toilet_id": tid, "location": loc,
                        "type": "HIGH_ODOUR", "message": "Dirty toilet or high odour detected."})
    elif row.get("usage_count", 0) > USAGE_THRESHOLD:
        alerts.append({"toilet_id": tid, "location": loc,
                        "type": "HIGH_USAGE", "message": "High usage detected."})

print("Generated Alerts:", alerts)
