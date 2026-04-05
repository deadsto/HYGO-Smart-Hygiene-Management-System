import firebase_admin
from firebase_admin import credentials, firestore

try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
except:
    pass

db = firestore.client()
sensor_ref = db.collection("sensor_data")
docs = list(sensor_ref.stream())

for doc in docs:
    data = doc.to_dict()
    if data.get("status") != "DIRTY":
        # Delete clean and moderate ones
        print(f"Deleting newer document with status {data.get('status')} to let DIRTY show up")
        doc.reference.delete()
    else:
        print("Got the dirty doc! Keeping it.")

