"""
Run this ONCE to seed your fresh Firestore database with initial data.
Usage:
  1. Place serviceAccountKey.json in this folder
  2. pip install firebase-admin
  3. python seed_firestore.py
"""

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

print("🔥 Seeding Firestore database...")

# ── Admin User ──────────────────────────────────────
db.collection("users").document("admin1").set({
    "username": "admin",
    "password": "admin123",
    "role": "admin"
})
print("✅ Admin user created  → username: admin  password: admin123")

# ── Counters (auto-increment) ────────────────────────
for col in ["staff", "cleaning_log", "complaints"]:
    db.collection("counters").document(col).set({"count": 0})
print("✅ Counters initialised")

# ── Toilets ──────────────────────────────────────────
toilets = [
    {"toilet_id": 1, "location": "Block A - Ground Floor", "status": "clean"},
    {"toilet_id": 2, "location": "Block A - First Floor",  "status": "clean"},
    {"toilet_id": 3, "location": "Block B - Ground Floor", "status": "clean"},
    {"toilet_id": 4, "location": "Block B - First Floor",  "status": "clean"},
    {"toilet_id": 5, "location": "Cafeteria Wing",          "status": "clean"},
]
for t in toilets:
    t["last_cleaned_time"] = datetime.now()
    db.collection("toilets").document(str(t["toilet_id"])).set(t)
print(f"✅ {len(toilets)} toilets created")

# ── Sample Staff ─────────────────────────────────────
staff_list = [
    {"staff_id": 1, "name": "Ravi Kumar",   "username": "ravi",   "password": "ravi123",   "score": 85, "status": "on",  "gender": "Male",   "dob": "1990-05-10", "aadhar": "1234-5678-9012", "mother_tongue": "Hindi",  "category": "General", "address": "123 Main St"},
    {"staff_id": 2, "name": "Priya Sharma", "username": "priya",  "password": "priya123",  "score": 90, "status": "on",  "gender": "Female", "dob": "1995-08-22", "aadhar": "2345-6789-0123", "mother_tongue": "Tamil",  "category": "OBC",     "address": "456 Park Ave"},
    {"staff_id": 3, "name": "Suresh Das",   "username": "suresh", "password": "suresh123", "score": 70, "status": "off", "gender": "Male",   "dob": "1988-12-01", "aadhar": "3456-7890-1234", "mother_tongue": "Telugu", "category": "SC",      "address": "789 Lake Rd"},
]
for s in staff_list:
    db.collection("staff").document(str(s["staff_id"])).set(s)

# Update counter to match
db.collection("counters").document("staff").set({"count": len(staff_list)})
print(f"✅ {len(staff_list)} staff members created")

print("\n🎉 Database seeded successfully!")
print("\nLogin credentials:")
print("  Admin  → username: admin   password: admin123")
print("  Staff1 → username: ravi    password: ravi123")
print("  Staff2 → username: priya   password: priya123")
