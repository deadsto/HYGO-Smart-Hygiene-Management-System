from flask import Flask, request, jsonify
from flask_cors import cross_origin, CORS
from datetime import datetime, timedelta
import joblib
import numpy as np
import os
import json

import firebase_admin
from firebase_admin import credentials, firestore

# --------------------
# Model Loading
# --------------------
try:
    model = joblib.load("hygo_model.pkl")
except Exception as e:
    print(f"Model load error: {e}")
    model = None

ODOUR_THRESHOLD = 6
USAGE_THRESHOLD = 30
CLEANING_TIME_LIMIT_HOURS = 6

# 🚀 MEMORY CACHE (Reduces Firebase Quota usage by sharing data)
cache = {
    "toilets": {"data": None, "time": datetime.min},
    "alerts": {"data": None, "time": datetime.min},
    "ttl": 10 # 10 seconds cache time
}

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, DELETE"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

# --------------------
# Firebase / Firestore Init
# --------------------
if not firebase_admin._apps:
    if os.path.exists("serviceAccountKey.json"):
        # Use the local file directly (fastest for deployment)
        cred = credentials.Certificate("serviceAccountKey.json")
    else:
        service_account_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
        if service_account_json:
            cred = credentials.Certificate(json.loads(service_account_json))
        else:
            raise Exception("No Firebase credentials found!")
    firebase_admin.initialize_app(cred)

db = firestore.client()

# --------------------
# Helper Functions
# --------------------
def get_next_id(collection_name):
    """Atomic auto-increment counter stored in Firestore."""
    counter_ref = db.collection("counters").document(collection_name)

    @firestore.transactional
    def _increment(transaction, ref):
        snap = ref.get(transaction=transaction)
        new_id = (snap.get("count") + 1) if snap.exists else 1
        transaction.set(ref, {"count": new_id})
        return new_id

    return _increment(db.transaction(), counter_ref)


def serialize(d):
    """Recursively convert Firestore-returned values to JSON-safe types."""
    if d is None:
        return None
    out = {}
    for k, v in d.items():
        if hasattr(v, "isoformat"):
            out[k] = v.isoformat()
        elif hasattr(v, "strftime"):
            out[k] = v.strftime("%Y-%m-%dT%H:%M:%S")
        else:
            out[k] = v
    return out


def dt_str(dt, fmt=None):
    if dt is None:
        return None
    if fmt:
        return dt.strftime(fmt) if hasattr(dt, "strftime") else str(dt)
    return dt.isoformat() if hasattr(dt, "isoformat") else str(dt)


def naive(dt):
    """Strip timezone for timedelta arithmetic."""
    if dt is None:
        return None
    return dt.replace(tzinfo=None) if hasattr(dt, "tzinfo") else dt


# --------------------
# Test
# --------------------
@app.route("/api/test")
def test():
    return jsonify({"message": "Flask + Firestore connected!"})


# --------------------
# Login
# --------------------
@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    # Admin check
    for doc in db.collection("users")\
                  .where("username", "==", username)\
                  .where("password", "==", password).stream():
        u = doc.to_dict()
        return jsonify({
            "success": True, 
            "user": {
                "username": u.get("username"),
                "role": u.get("role", "admin"),
                "name": u.get("name", "Administrator")
            }
        })

    # Staff check
    for doc in db.collection("staff")\
                  .where("username", "==", username)\
                  .where("password", "==", password).stream():
        s = doc.to_dict()
        return jsonify({
            "success": True, 
            "user": {
                "username": s.get("username"),
                "role": "staff",
                "staff_id": s.get("staff_id"),
                "name": s.get("name")
            }
        })

    return jsonify({"success": False, "message": "Invalid username or password"}), 401


# --------------------
# Staff Management
# --------------------
@app.route("/api/staff/active", methods=["GET"])
def get_active_staff():
    try:
        docs = db.collection("staff").order_by("name").stream()
        return jsonify([{"staff_id": d.to_dict().get("staff_id"),
                          "name": d.to_dict().get("name")} for d in docs]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/staff", methods=["GET", "POST", "OPTIONS"])
@cross_origin()
def staff_management():
    if request.method == "OPTIONS":
        return jsonify({"message": "OK"}), 200

    if request.method == "GET":
        try:
            docs = db.collection("staff")\
                      .order_by("staff_id", direction=firestore.Query.DESCENDING).stream()
            return jsonify([serialize(d.to_dict()) for d in docs]), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    if request.method == "POST":
        try:
            data = request.json
            if not data.get("name"):
                return jsonify({"error": "Name is required"}), 400
            staff_id = get_next_id("staff")
            db.collection("staff").document(str(staff_id)).set({
                "staff_id":      staff_id,
                "name":          data.get("name"),
                "score":         0,
                "status":        "on",
                "gender":        data.get("gender"),
                "dob":           data.get("dob"),
                "aadhar":        data.get("aadhar"),
                "mother_tongue": data.get("mother_tongue"),
                "category":      data.get("category"),
                "address":       data.get("address"),
                "username":      data.get("username", ""),
                "password":      data.get("password", ""),
            })
            return jsonify({"message": "Staff added successfully"}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500


# --------------------
# Toilets
# --------------------
@app.route("/api/toilets", methods=["GET", "POST"])
def toilets():
    if request.method == "GET":
        # 💎 CACHE CHECK (Prevents Firebase Quota waste)
        now = datetime.now()
        if cache["toilets"]["data"] and (now - cache["toilets"]["time"]).seconds < cache["ttl"]:
            return jsonify(cache["toilets"]["data"])

        try:
            toilet_docs = list(db.collection("toilets").stream())
            
            # Fetch all sensor data once to avoid needing a composite index
            all_sensors = list(db.collection("sensor_data").stream())
            latest_sensors = {}
            for doc in all_sensors:
                s = doc.to_dict()
                tid = s.get("toilet_id")
                # Maintain the latest timestamp for each toilet
                if tid not in latest_sensors:
                    latest_sensors[tid] = s
                else:
                    if s.get("timestamp") and latest_sensors[tid].get("timestamp"):
                        if naive(s.get("timestamp")) > naive(latest_sensors[tid].get("timestamp")):
                            latest_sensors[tid] = s

            result = []
            for doc in toilet_docs:
                t = doc.to_dict()
                tid = t.get("toilet_id")
                sensor = latest_sensors.get(tid, {})
                t.update({
                    "odour_level": sensor.get("odour_level"),
                    "gas_value":   sensor.get("gas_value"),
                    "distance":    sensor.get("distance"),
                })
                # Check status case-insensitively
                sensor_status = sensor.get("status")
                if sensor_status:
                    t["status"] = str(sensor_status).lower()
                result.append(serialize(t))
            
            # UPDATE CACHE
            cache["toilets"]["data"] = result
            cache["toilets"]["time"] = now
            return jsonify(result), 200
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500

    if request.method == "POST":
        try:
            data = request.json
            toilet_id = data.get("toilet_id")
            location  = data.get("location")
            if not toilet_id or not location:
                return jsonify({"error": "Toilet ID & Location required"}), 400
            db.collection("toilets").document(str(toilet_id)).set({
                "toilet_id":        int(toilet_id),
                "location":         location,
                "status":           data.get("status", "clean"),
                "last_cleaned_time": datetime.now(),
            })
            return jsonify({"message": "Toilet added"}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500


# --------------------
# Cleaning Alerts
# --------------------
@app.route("/api/cleaning-alerts")
def cleaning_alerts():
    # 💎 CACHE CHECK
    now = datetime.now()
    if cache["alerts"]["data"] and (now - cache["alerts"]["time"]).seconds < cache["ttl"]:
        return jsonify(cache["alerts"]["data"])

    try:
        alerts = []
        toilet_map = {
            d.to_dict().get("toilet_id"): d.to_dict()
            for d in db.collection("toilets").stream()
        }
        
        all_sensors = list(db.collection("sensor_data").stream())
        # Sort manually to avoid composite index
        all_sensors.sort(key=lambda d: naive(d.to_dict().get("timestamp")) or datetime.min, reverse=True)
        
        seen = set()
        for doc in all_sensors:
            row = doc.to_dict()
            tid = row.get("toilet_id")
            if tid in seen:
                continue
            seen.add(tid)
            loc = toilet_map.get(tid, {}).get("location", f"Toilet {tid}")
            
            status = str(row.get("status", "")).upper()
            if status == "DIRTY" or row.get("odour_level", 0) > ODOUR_THRESHOLD:
                alerts.append({"toilet_id": tid, "location": loc,
                                "type": "HIGH_ODOUR", "message": "Dirty toilet or high odour detected."})
            elif row.get("usage_count", 0) > USAGE_THRESHOLD:
                alerts.append({"toilet_id": tid, "location": loc,
                                "type": "HIGH_USAGE", "message": "High usage detected."})
        
        # UPDATE CACHE
        cache["alerts"]["data"] = alerts
        cache["alerts"]["time"] = now
        return jsonify(alerts)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify([])


# --------------------
# Alerts API
# --------------------
@app.route("/api/alerts")
def get_alerts():
    try:
        seen = set()
        alerts = []
        for doc in db.collection("sensor_data")\
                      .order_by("timestamp", direction=firestore.Query.DESCENDING).stream():
            row = doc.to_dict()
            tid = row.get("toilet_id")
            if tid in seen:
                continue
            seen.add(tid)
            odour = row.get("odour_level", 0)
            usage = row.get("usage_count", 0)
            if odour > 6 or usage > 40:
                severity = "critical" if odour > 6 else "medium"
                ts = row.get("timestamp")
                alerts.append({
                    "id":       f"T-{tid}",
                    "severity": severity,
                    "status":   "Open",
                    "type":     "Sensor",
                    "message":  f"Odour level {odour}, usage {usage}",
                    "time":     dt_str(ts, "%b %d, %H:%M"),
                })
        return jsonify(alerts)
    except Exception as e:
        return jsonify([])


# --------------------
# Feedback API
# --------------------
@app.route("/api/feedback")
def get_feedback():
    try:
        all_logs = [d.to_dict() for d in db.collection("cleaning_log").stream()]
        cleaned = [l for l in all_logs if l.get("cleaned_time")]
        cleaned.sort(key=lambda x: naive(x.get("cleaned_time")) or datetime.min, reverse=True)
        return jsonify([{
            "id":       f"T-{l.get('toilet_id')}",
            "severity": "low",
            "status":   l.get("verification_status", "Pending"),
            "type":     "Feedback",
            "message":  f"Cleaning {l.get('verification_status')} by staff {l.get('staff_id')}",
            "rating":   4,
            "time":     dt_str(l.get("cleaned_time"), "%b %d, %H:%M"),
        } for l in cleaned])
    except Exception as e:
        return jsonify([])


# --------------------
# Sensor Data (ESP32)
# --------------------
@app.route("/api/data", methods=["POST"])
def receive_sensor_data():
    data = request.json
    gas_value = data.get("gas_value", 0)
    db.collection("sensor_data").add({
        "toilet_id":   10,
        "odour_level": round(gas_value / 100, 2),
        "usage_count": data.get("count"),
        "gas_value":   gas_value,
        "gas_status":  data.get("gas_status"),
        "distance":    data.get("distance"),
        "status":      data.get("status"),
        "alert":       data.get("alert"),
        "timestamp":   datetime.now(),
    })
    return jsonify({"message": "Data stored successfully"})


# --------------------
# AI Prediction
# --------------------
@app.route("/api/predict-from-db")
def predict_from_db():
    try:
        toilet_last = {}
        for doc in db.collection("cleaning_log").stream():
            row = doc.to_dict()
            tid = row.get("toilet_id")
            ct  = naive(row.get("cleaned_time"))
            if ct and (tid not in toilet_last or ct > toilet_last[tid]):
                toilet_last[tid] = ct

        results = []
        for tid, last_cleaned in toilet_last.items():
            if last_cleaned is None:
                last_cleaned = datetime.now() - timedelta(hours=10)
            hours_since = (datetime.now() - last_cleaned).total_seconds() / 3600
            features = np.array([[100, datetime.now().hour, hours_since]])
            prediction = model.predict(features)[0] if model else 30
            status = "Clean" if prediction < 30 else ("Moderate" if prediction < 60 else "Dirty Soon")
            results.append({"toilet_id": tid, "predicted_minutes": int(prediction), "status": status})
        return jsonify(results)
    except Exception as e:
        import traceback
        return jsonify({"error": str(e), "trace": traceback.format_exc()})


# --------------------
# Staff Profile
# --------------------
@app.route("/api/staff/profile/<int:staff_id>")
def get_staff_profile(staff_id):
    try:
        for doc in db.collection("staff").where("staff_id", "==", staff_id).stream():
            d = doc.to_dict()
            if "dob" in d and hasattr(d["dob"], "strftime"):
                d["dob"] = d["dob"].strftime("%d/%m/%Y")
            return jsonify(serialize(d))
        return jsonify(None)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --------------------
# Assigned Tasks
# --------------------
@app.route("/api/staff/assigned-tasks/<int:staff_id>")
def get_assigned_tasks(staff_id):
    try:
        all_logs = [d.to_dict() for d in db.collection("cleaning_log").stream()]
        tasks = [l for l in all_logs
                 if l.get("staff_id") == staff_id and l.get("attendance_status") == "Assigned"]
        return jsonify([{
            "id":           l.get("log_id"),
            "location":     l.get("toilet_id"),
            "assignedTime": dt_str(l.get("assigned_time")),
            "authority":    "Admin",
            "priority":     "High",
            "deadline":     dt_str(l.get("cleaned_time")),
        } for l in tasks])
    except Exception as e:
        return jsonify([])


# --------------------
# Complaints
# --------------------
@app.route("/api/complaints", methods=["GET", "POST"])
def complaints():
    if request.method == "POST":
        try:
            data = request.json
            cid = get_next_id("complaints")
            db.collection("complaints").document(str(cid)).set({
                "complaint_id": cid,
                "category":     data.get("category"),
                "description":  data.get("description"),
                "staff_id":     data.get("staff_id", 0),
                "created_at":   datetime.now(),
            })
            return jsonify({"message": "Complaint submitted successfully"})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    try:
        docs = list(db.collection("complaints").stream())
        docs.sort(key=lambda d: naive(d.to_dict().get("created_at")) or datetime.min, reverse=True)
        return jsonify([{
            "complaint_id": d.to_dict().get("complaint_id"),
            "category":     d.to_dict().get("category"),
            "description":  d.to_dict().get("description"),
            "staff_id":     d.to_dict().get("staff_id"),
            "time":         dt_str(d.to_dict().get("created_at"), "%b %d %H:%M"),
        } for d in docs])
    except Exception as e:
        return jsonify([])


# --------------------
# Reports
# --------------------
@app.route("/api/report/summary")
def report_summary():
    try:
        all_logs = [d.to_dict() for d in db.collection("cleaning_log").stream()]
        cleaned  = [l for l in all_logs if l.get("cleaned_time")]
        durations = []
        for l in cleaned:
            at, ct = naive(l.get("assigned_time")), naive(l.get("cleaned_time"))
            if at and ct:
                durations.append((ct - at).total_seconds() / 60)
        avg      = round(sum(durations) / len(durations)) if durations else 0
        verified = sum(1 for l in all_logs if l.get("verification_status") == "Verified")
        rate     = round((verified / len(all_logs)) * 100) if all_logs else 0
        return jsonify({
            "total_cleanings":   len(cleaned),
            "avg_duration":      f"{avg} min",
            "verification_rate": f"{rate}%",
            "alerts_resolved":   verified,
        })
    except Exception as e:
        return jsonify({"total_cleanings": 0, "avg_duration": "0 min",
                        "verification_rate": "0%", "alerts_resolved": 0})


@app.route("/api/reports")
def get_reports():
    return report_summary()


@app.route("/api/report/cleanings")
def report_cleanings():
    try:
        day_counts = {}
        for doc in db.collection("cleaning_log").stream():
            ct = doc.to_dict().get("cleaned_time")
            if ct:
                day = dt_str(ct, "%Y-%m-%d")
                day_counts[day] = day_counts.get(day, 0) + 1
        return jsonify([{"day": k, "cleanings": v} for k, v in sorted(day_counts.items())])
    except Exception as e:
        return jsonify([])


@app.route("/api/report/types")
def report_types():
    return jsonify([
        {"name": "Routine",     "value": 40, "color": "#22c55e"},
        {"name": "Deep",        "value": 25, "color": "#3b82f6"},
        {"name": "Emergency",   "value": 20, "color": "#f59e0b"},
        {"name": "Inspection",  "value": 15, "color": "#ef4444"},
    ])


@app.route("/api/report/top-staff")
def report_staff():
    try:
        counts = {}
        for doc in db.collection("cleaning_log").stream():
            sid = doc.to_dict().get("staff_id")
            counts[sid] = counts.get(sid, 0) + 1
        names = {d.to_dict().get("staff_id"): d.to_dict().get("name")
                 for d in db.collection("staff").stream()}
        result = sorted(counts.items(), key=lambda x: -x[1])[:5]
        return jsonify([{"name": names.get(sid, f"Staff {sid}"), "cleanings": c}
                        for sid, c in result])
    except Exception as e:
        return jsonify([])


@app.route("/api/report/logs")
def report_logs():
    try:
        all_logs = [d.to_dict() for d in db.collection("cleaning_log").stream()]
        cleaned  = sorted([l for l in all_logs if l.get("cleaned_time")],
                          key=lambda x: naive(x.get("cleaned_time")) or datetime.min, reverse=True)[:10]
        result = []
        for l in cleaned:
            at, ct = naive(l.get("assigned_time")), naive(l.get("cleaned_time"))
            mins = int((ct - at).total_seconds() / 60) if at and ct else ""
            result.append({
                "toilet":   f"T-{l.get('toilet_id')}",
                "staff":    f"Staff {l.get('staff_id')}",
                "type":     "Routine",
                "duration": f"{mins} min" if mins != "" else "-",
                "score":    l.get("verification_status"),
                "time":     dt_str(ct, "%b %d %H:%M"),
            })
        return jsonify(result)
    except Exception as e:
        return jsonify([])


if __name__ == "__main__":
    app.run(debug=True, port=5000)