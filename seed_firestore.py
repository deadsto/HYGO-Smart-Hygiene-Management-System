"""
Run this ONCE to seed your fresh Firestore database with initial data.
Usage:
  1. Place serviceAccountKey.json in this folder
  2. pip install firebase-admin
  3. python seed_firestore.py
"""

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta
import random

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
    {"toilet_id": 1,  "location": "Block A - Ground Floor",  "status": "clean"},
    {"toilet_id": 2,  "location": "Block A - First Floor",   "status": "dirty"},
    {"toilet_id": 3,  "location": "Block B - Ground Floor",  "status": "clean"},
    {"toilet_id": 4,  "location": "Block B - First Floor",   "status": "maintenance"},
    {"toilet_id": 5,  "location": "Cafeteria Wing",          "status": "clean"},
    {"toilet_id": 6,  "location": "Library Block",           "status": "clean"},
    {"toilet_id": 7,  "location": "Admin Block",             "status": "dirty"},
    {"toilet_id": 8,  "location": "Sports Complex",          "status": "clean"},
    {"toilet_id": 9,  "location": "Hostel Block A",          "status": "clean"},
    {"toilet_id": 10, "location": "Main Entrance Lobby",     "status": "clean"},
]
for t in toilets:
    t["last_cleaned_time"] = datetime.now() - timedelta(hours=random.randint(1, 10))
    db.collection("toilets").document(str(t["toilet_id"])).set(t)
print(f"✅ {len(toilets)} toilets created")

# ── Staff ─────────────────────────────────────────────
staff_list = [
    {"staff_id": 1, "name": "Ravi Kumar",      "username": "ravi",    "password": "ravi123",    "score": 85, "status": "on",  "gender": "Male",   "dob": "1990-05-10", "aadhar": "1234-5678-9012", "mother_tongue": "Hindi",    "category": "General", "address": "123 Main St, Delhi"},
    {"staff_id": 2, "name": "Priya Sharma",    "username": "priya",   "password": "priya123",   "score": 92, "status": "on",  "gender": "Female", "dob": "1995-08-22", "aadhar": "2345-6789-0123", "mother_tongue": "Tamil",    "category": "OBC",     "address": "456 Park Ave, Chennai"},
    {"staff_id": 3, "name": "Suresh Das",      "username": "suresh",  "password": "suresh123",  "score": 70, "status": "off", "gender": "Male",   "dob": "1988-12-01", "aadhar": "3456-7890-1234", "mother_tongue": "Telugu",   "category": "SC",      "address": "789 Lake Rd, Hyderabad"},
    {"staff_id": 4, "name": "Anita Verma",     "username": "anita",   "password": "anita123",   "score": 78, "status": "on",  "gender": "Female", "dob": "1993-03-15", "aadhar": "4567-8901-2345", "mother_tongue": "Hindi",    "category": "General", "address": "321 Rose Lane, Mumbai"},
    {"staff_id": 5, "name": "Mohammed Farhan", "username": "farhan",  "password": "farhan123",  "score": 88, "status": "on",  "gender": "Male",   "dob": "1992-07-30", "aadhar": "5678-9012-3456", "mother_tongue": "Urdu",     "category": "OBC",     "address": "654 Green St, Bangalore"},
    {"staff_id": 6, "name": "Lakshmi Nair",    "username": "lakshmi", "password": "lakshmi123", "score": 95, "status": "on",  "gender": "Female", "dob": "1997-11-05", "aadhar": "6789-0123-4567", "mother_tongue": "Malayalam","category": "General", "address": "987 Blue Ave, Kochi"},
]
for s in staff_list:
    db.collection("staff").document(str(s["staff_id"])).set(s)
db.collection("counters").document("staff").set({"count": len(staff_list)})
print(f"✅ {len(staff_list)} staff members created")

# ── Sensor Data (last 7 days, multiple readings per toilet) ───────────
sensor_docs = []
for toilet_id in [1, 2, 3, 5, 7, 10]:
    for days_ago in range(7, 0, -1):
        for hour in [6, 10, 14, 18, 22]:
            ts = datetime.now() - timedelta(days=days_ago, hours=random.randint(0, 2))
            gas_value = random.randint(200, 900)
            usage = random.randint(5, 60)
            odour = round(gas_value / 100, 2)
            status = "dirty" if odour > 6 or usage > 40 else "clean"
            sensor_docs.append({
                "toilet_id":   toilet_id,
                "gas_value":   gas_value,
                "odour_level": odour,
                "usage_count": usage,
                "gas_status":  "HIGH" if gas_value > 600 else "NORMAL",
                "distance":    round(random.uniform(0.3, 2.5), 2),
                "status":      status,
                "alert":       status == "dirty",
                "timestamp":   ts,
            })

for sd in sensor_docs:
    db.collection("sensor_data").add(sd)
print(f"✅ {len(sensor_docs)} sensor readings created")

# ── Cleaning Logs ─────────────────────────────────────
verifications = ["Verified", "Pending", "Rejected"]
log_id = 1
for i in range(30):
    toilet_id   = random.choice([1, 2, 3, 4, 5, 6, 7, 8])
    staff_id    = random.choice([1, 2, 4, 5, 6])
    assigned_at = datetime.now() - timedelta(days=random.randint(1, 14), hours=random.randint(1, 10))
    cleaned_at  = assigned_at + timedelta(minutes=random.randint(10, 60))
    verification = random.choices(verifications, weights=[70, 20, 10])[0]
    db.collection("cleaning_log").document(str(log_id)).set({
        "log_id":              log_id,
        "toilet_id":           toilet_id,
        "staff_id":            staff_id,
        "assigned_time":       assigned_at,
        "cleaned_time":        cleaned_at,
        "attendance_status":   random.choice(["Assigned", "Completed"]),
        "verification_status": verification,
    })
    log_id += 1

# A few open/assigned tasks
for i in range(5):
    staff_id    = random.choice([1, 2, 4, 5])
    toilet_id   = random.choice([2, 4, 7])
    assigned_at = datetime.now() - timedelta(hours=random.randint(1, 4))
    db.collection("cleaning_log").document(str(log_id)).set({
        "log_id":              log_id,
        "toilet_id":           toilet_id,
        "staff_id":            staff_id,
        "assigned_time":       assigned_at,
        "cleaned_time":        None,
        "attendance_status":   "Assigned",
        "verification_status": "Pending",
    })
    log_id += 1

db.collection("counters").document("cleaning_log").set({"count": log_id - 1})
print(f"✅ {log_id - 1} cleaning log entries created")

# ── Complaints ────────────────────────────────────────
categories    = ["Odour", "Water Leakage", "Broken Fixture", "Cleanliness", "Soap/Supplies Missing"]
descriptions  = [
    "Strong bad smell near entrance",
    "Water leaking from pipe under sink",
    "Door latch is broken",
    "Floor is wet and not cleaned",
    "Soap dispenser is empty",
    "No toilet paper available",
    "Light not working inside",
    "Drain is blocked",
    "Mirror is cracked",
    "Exhaust fan making noise",
]
complaint_id = 1
for i in range(12):
    created = datetime.now() - timedelta(days=random.randint(0, 10), hours=random.randint(0, 12))
    db.collection("complaints").document(str(complaint_id)).set({
        "complaint_id": complaint_id,
        "category":     random.choice(categories),
        "description":  random.choice(descriptions),
        "staff_id":     random.choice([1, 2, 4, 5, 6]),
        "created_at":   created,
    })
    complaint_id += 1

db.collection("counters").document("complaints").set({"count": complaint_id - 1})
print(f"✅ {complaint_id - 1} complaints created")

print("\n🎉 Database seeded successfully!")
print("\nLogin credentials:")
print("  Admin  → username: admin    password: admin123")
print("  Staff1 → username: ravi     password: ravi123")
print("  Staff2 → username: priya    password: priya123")
print("  Staff3 → username: anita    password: anita123")
print("  Staff4 → username: farhan   password: farhan123")
print("  Staff5 → username: lakshmi  password: lakshmi123")
