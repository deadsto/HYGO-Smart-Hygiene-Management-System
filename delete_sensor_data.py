import firebase_admin
from firebase_admin import credentials, firestore

try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
except Exception as e:
    pass

db = firestore.client()

collection_ref = db.collection("sensor_data")
print("🔥 Finding all documents in 'sensor_data' collection to delete...")

docs = collection_ref.stream()

deleted_count = 0
batch = db.batch()

for doc in docs:
    batch.delete(doc.reference)
    deleted_count += 1
    if deleted_count % 400 == 0:
        batch.commit()
        batch = db.batch()

if deleted_count % 400 != 0:
    batch.commit()

print(f"✅ Successfully deleted {deleted_count} documents from 'sensor_data'.")
