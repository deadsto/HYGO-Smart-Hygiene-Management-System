import { useState, useEffect } from "react";
import Sidebar from "../component/Sidebar";
import "../styles/alert.css";

const BASE_URL = "https://hygo-smart-hygiene-management-system-4os1.onrender.com";

export default function AlertsFeedback() {
  const [activeTab, setActiveTab] = useState("alerts");
  const [alerts, setAlerts] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [alertsRes, feedbackRes] = await Promise.all([
        fetch("https://hygo-smart-hygiene-management-system-4os1.onrender.com/api/alerts"),
        fetch("https://hygo-smart-hygiene-management-system-4os1.onrender.com/api/feedback"),
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
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        {/* HEADER */}
        <div className="dash-header">
          <div className="dash-title">
            <h1>Alerts & Feedback</h1>
            <p>Monitor alerts and user feedback</p>
          </div>
          <button className="add-btn" style={{ background: "#059669", borderRadius: "8px", fontWeight: "500", display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px" }}>
            <span>＋</span> Create Alert
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="alert-summary-modern">
          <div className="sum-card">
            <div className="icon-box" style={{background: "#fee2e2", color: "#ef4444"}}>❗</div>
            <div className="sum-details">
              <h2>{alerts.filter(a => a.severity === 'critical').length}</h2>
              <p>Critical</p>
            </div>
          </div>
          <div className="sum-card">
            <div className="icon-box" style={{background: "#ffedd5", color: "#f97316"}}>⚠️</div>
            <div className="sum-details">
              <h2>{alerts.filter(a => a.severity === 'high').length}</h2>
              <p>High Severity</p>
            </div>
          </div>
          <div className="sum-card">
            <div className="icon-box" style={{background: "#dcfce7", color: "#16a34a"}}>✅</div>
            <div className="sum-details">
              <h2>{alerts.filter(a => a.status === 'Resolved').length}</h2>
              <p>Resolved</p>
            </div>
          </div>
          <div className="sum-card">
            <div className="icon-box" style={{background: "#fef9c3", color: "#eab308"}}>⭐</div>
            <div className="sum-details">
              <h2>{feedback.length > 0 ? (feedback.reduce((acc, f) => acc + (f.rating || 5), 0) / feedback.length).toFixed(1) : "5.0"}</h2>
              <p>Avg Rating</p>
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="alert-controls">
          <div className="tabs-modern">
            <button
              className={`modern-tab ${activeTab === "alerts" ? "active" : ""}`}
              onClick={() => setActiveTab("alerts")}
            >
              ⚠️ Alerts ({alerts.length})
            </button>
            <button
              className={`modern-tab ${activeTab === "feedback" ? "active" : ""}`}
              onClick={() => setActiveTab("feedback")}
            >
              💬 Feedback ({feedback.length})
            </button>
          </div>

          <div className="filters-row">
            <div className="search-wrap" style={{flex: 2}}>
              <span className="search-icon">🔍</span>
              <input placeholder="Search alerts..." style={{width: "100%", padding: "10px 10px 10px 35px", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
            </div>
            <select style={{flex: 1, padding: "10px", border: "1px solid #e5e7eb", borderRadius: "8px"}}>
              <option>All Status</option>
            </select>
            <select style={{flex: 1, padding: "10px", border: "1px solid #e5e7eb", borderRadius: "8px"}}>
              <option>All Severity</option>
            </select>
          </div>
        </div>

        {/* ALERTS TAB */}
        {activeTab === "alerts" && (
          <div className="alerts-list-modern">
            {alerts.map((alert, i) => (
              <div key={i} className="alert-card-modern">
                <div className={`status-icon-box ${alert.severity === 'critical' ? 'red-theme' : 'orange-theme'}`} style={{width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0}}>
                  {alert.severity === 'critical' ? '❗' : '⚠️'}
                </div>
                
                <div className="alert-content-modern">
                  <div className="alert-row-top">
                    <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
                      <span style={{fontWeight: 600, fontSize: "16px", color: "#1f2937"}}>{alert.id || `T-${alert.toilet_id}`}</span>
                      <span className={`pill ${alert.severity}`}>{alert.severity}</span>
                      <span className={`pill status-${(alert.status || 'open').toLowerCase()}`}>{alert.status || 'Open'}</span>
                      <span className="pill category-pill">🔧 {alert.category || 'System'}</span>
                    </div>
                    {(alert.status !== "Resolved") && (
                      <button className="start-btn">Start Work</button>
                    )}
                  </div>
                  <p className="alert-msg">{alert.message}</p>
                  <p className="alert-time">🕒 {alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FEEDBACK TAB */}
        {activeTab === "feedback" && (
          <div className="alerts-list-modern">
            {feedback.map((fb, i) => (
              <div key={i} className="alert-card-modern">
                <div className="status-icon-box blue-theme" style={{width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0}}>
                  💬
                </div>
                
                <div className="alert-content-modern">
                  <div className="alert-row-top">
                    <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
                      <span style={{fontWeight: 600, fontSize: "16px", color: "#1f2937"}}>{fb.id || `T-${fb.toilet_id}`}</span>
                      <span className={`pill status-resolved`}>Verified</span>
                      <span className="pill category-pill">💬 Feedback</span>
                    </div>
                  </div>
                  <p className="alert-msg">{fb.message}</p>
                  <div className="stars-row">
                    {"⭐".repeat(fb.rating || 5)} <span style={{color: "#9ca3af"}}>({fb.rating || 5}/5)</span>
                  </div>
                  <p className="alert-time">🕒 {fb.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
