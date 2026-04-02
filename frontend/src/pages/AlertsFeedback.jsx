import { useState, useEffect } from "react";
import Sidebar from "../component/Sidebar";
import "../styles/alert.css";

const BASE_URL = "https://hygo-smart-hygiene-management-system.onrender.com";

export default function AlertsFeedback() {
  const [alerts, setAlerts] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [activeTab, setActiveTab] = useState("alerts");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [alertsRes, feedbackRes] = await Promise.all([
          fetch(`${BASE_URL}/api/alerts`),
          fetch(`${BASE_URL}/api/feedback`),
        ]);
        const alertsData = await alertsRes.json();
        const feedbackData = await feedbackRes.json();
        setAlerts(Array.isArray(alertsData) ? alertsData : []);
        setFeedback(Array.isArray(feedbackData) ? feedbackData : []);
      } catch (err) {
        console.error("Error loading alerts/feedback:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const severityClass = (sev) => {
    if (sev === "critical") return "alert-card critical";
    if (sev === "medium") return "alert-card warning";
    return "alert-card safe";
  };

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        {/* HEADER */}
        <div className="dash-header">
          <div className="dash-title">
            <h1>Alerts & Feedback</h1>
            <p>Monitor system alerts and staff feedback</p>
          </div>
        </div>

        {/* TABS */}
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === "alerts" ? "active" : ""}`}
            onClick={() => setActiveTab("alerts")}
          >
            ⚠️ Alerts ({alerts.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "feedback" ? "active" : ""}`}
            onClick={() => setActiveTab("feedback")}
          >
            💬 Feedback ({feedback.length})
          </button>
        </div>

        {loading && <p style={{ padding: "1rem", color: "#888" }}>Loading...</p>}

        {/* ALERTS TAB */}
        {!loading && activeTab === "alerts" && (
          <div className="alerts-section">
            {alerts.length === 0 ? (
              <p style={{ color: "green", padding: "1rem" }}>
                ✅ No active alerts. All toilets are clean!
              </p>
            ) : (
              <div className="alerts-list">
                {alerts.map((alert, i) => (
                  <div key={i} className={severityClass(alert.severity)}>
                    <div className="alert-left">
                      <strong>{alert.id}</strong>
                      <p>{alert.message}</p>
                      <span style={{ fontSize: "0.75rem", color: "#888" }}>
                        {alert.time}
                      </span>
                    </div>
                    <div className="alert-right">
                      <span
                        className={`badge ${alert.severity}`}
                        style={{ textTransform: "capitalize" }}
                      >
                        {alert.severity}
                      </span>
                      <p style={{ marginTop: "0.25rem", fontSize: "0.8rem" }}>
                        {alert.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FEEDBACK TAB */}
        {!loading && activeTab === "feedback" && (
          <div className="alerts-section">
            {feedback.length === 0 ? (
              <p style={{ padding: "1rem", color: "#888" }}>
                No feedback records found.
              </p>
            ) : (
              <div className="alerts-list">
                {feedback.map((fb, i) => (
                  <div key={i} className="alert-card safe">
                    <div className="alert-left">
                      <strong>{fb.id}</strong>
                      <p>{fb.message}</p>
                      <span style={{ fontSize: "0.75rem", color: "#888" }}>
                        {fb.time}
                      </span>
                    </div>
                    <div className="alert-right">
                      <span className="badge low">
                        ⭐ {fb.rating || "N/A"}
                      </span>
                      <p style={{ marginTop: "0.25rem", fontSize: "0.8rem" }}>
                        {fb.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}