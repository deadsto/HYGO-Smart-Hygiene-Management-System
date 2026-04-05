import { useEffect, useState } from "react";
import Sidebar from "../component/Sidebar";
import "../styles/toilet.css";

export default function ToiletStatus() {

  const [toilets, setToilets] = useState([]);

  const fetchToilets = () => {
    fetch("https://hygo-smart-hygiene-management-system-4os1.onrender.com/api/toilets")
      .then((res) => res.json())
      .then((data) => setToilets(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching toilets:", err));
  };

  useEffect(() => {
    fetchToilets();
    const interval = setInterval(fetchToilets, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  // SUMMARY COUNTS
  const clean = toilets.filter((t) => t.status === "clean").length;
  const dirty = toilets.filter((t) => t.status === "dirty").length;
  const maintenance = toilets.filter((t) => t.status === "maintenance").length;
  const offline = toilets.filter((t) => t.status === "offline").length;

  return (
    <div className="app">
      <Sidebar />

      <div className="main">
        {/* HEADER */}
        <div className="dash-header">
          <div className="dash-title">
            <h1>Toilet Status</h1>
            <p>Monitor all toilet facilities in real-time</p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button className="add-btn" style={{ background: "#059669", borderRadius: "8px", fontWeight: "500", display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px" }}>
              <span>＋</span> Add Toilet
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="toilet-summary-modern">
          <div className="sum-card">
            <div className="icon-box clean-box">✨</div>
            <div className="sum-details">
              <h2>{clean}</h2>
              <p>Clean</p>
            </div>
          </div>

          <div className="sum-card">
            <div className="icon-box dirty-box">💧</div>
            <div className="sum-details">
              <h2>{dirty}</h2>
              <p>Dirty</p>
            </div>
          </div>

          <div className="sum-card">
            <div className="icon-box maint-box">🔧</div>
            <div className="sum-details">
              <h2>{maintenance}</h2>
              <p>Maintenance</p>
            </div>
          </div>

          <div className="sum-card">
            <div className="icon-box offline-box">🚫</div>
            <div className="sum-details">
              <h2>{offline}</h2>
              <p>Offline</p>
            </div>
          </div>
        </div>

        {/* SEARCH & TOGGLES */}
        <div className="toilet-controls">
          <div className="search-box">
            <span className="s-icon">🔍</span>
            <input placeholder="Search by ID or location..." />
          </div>
          <div className="view-toggles">
            <button className="toggle-btn active">⊞</button>
            <button className="toggle-btn">≡</button>
          </div>
        </div>

        {/* TOILET CARDS */}
        <div className="toilet-grid-modern">
          {toilets.map((t) => {
            return (
              <div className="toilet-card-modern" key={t.toilet_id}>
                <div className={`status-icon-box ${t.status}`}>
                  {t.status === "clean" && "✨"}
                  {t.status === "dirty" && "💧"}
                  {t.status === "maintenance" && "🔧"}
                  {t.status === "offline" && "🚫"}
                </div>

                <h3>{t.name}</h3>
                <p className="meta-info">📍 {t.location}</p>
                <p className="meta-info">🏢 {t.floor}</p>

                <div className="card-bottom">
                  <div className="progress-labels">
                    <span>Cleanliness</span>
                    <span className={`score-text ${t.status}`}>{t.cleanliness}%</span>
                  </div>

                  <div className="progress-bg">
                    <div
                      className={`progress-fill ${t.status}`}
                      style={{ width: `${t.cleanliness}%` }}
                    />
                  </div>

                  <span className={`pill ${t.status}`}>
                    {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
