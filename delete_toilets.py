import firebase_admin
from firebase_admin import credentials, firestore

try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
except ValueError:
    pass

db = firestore.client()

toilets_ref = db.collection("toilets")
docs = toilets_ref.stream()

deleted_count = 0
for doc in docs:
    data = doc.to_dict()
    # Check if toilet_id is not 10
    if str(data.get("toilet_id")) != "10":
        print(f"Deleting toilet {data.get('toilet_id')} (document ID: {doc.id})")
        doc.reference.delete()
        deleted_count += 1
    else:
        print(f"Keeping toilet {data.get('toilet_id')} (document ID: {doc.id})")

print(f"Deleted {deleted_count} toilets. Finished.")
