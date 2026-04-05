import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

try:
    toilet_docs = list(db.collection("toilets").stream())
    print(f"Total toilets: {len(toilet_docs)}")
    for doc in toilet_docs:
        t = doc.to_dict()
        print(f"Toilet: {t['toilet_id']}")
        sensor_snap = db.collection("sensor_data")\
                         .where("toilet_id", "==", t.get("toilet_id"))\
                         .order_by("timestamp", direction=firestore.Query.DESCENDING)\
                         .limit(1).stream()
        for s in sensor_snap:
            print("Found sensor data")
except Exception as e:
    import traceback
    traceback.print_exc()
