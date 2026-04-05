import { Bar, Line, Pie } from "react-chartjs-2";
import "chart.js/auto";
import Sidebar from "../component/Sidebar";
import "../styles/dash.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {

  const [alerts, setAlerts] = useState([]);
  const [toilets, setToilets] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [toiletData, setToiletData] = useState([]);


  const fetchData = () => {
    // Alerts
    fetch("https://hygo-smart-hygiene-management-system-4os1.onrender.com/api/cleaning-alerts")
      .then(res => res.json())
      .then(data => setAlerts(data));

    // Toilets
    fetch("https://hygo-smart-hygiene-management-system-4os1.onrender.com/api/toilets")
      .then(res => res.json())
      .then(data => setToilets(data));

    //  (AI prediction)
    fetch("https://hygo-smart-hygiene-management-system-4os1.onrender.com/api/predict-from-db")
      .then(res => res.json())
      .then(data => setPredictions(data))
      .catch(err => console.log("Prediction error:", err));
  };

  // 🔗 Fetch alerts from Flask (DB)
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  const total = toilets.length;
  const dirty = Array.isArray(alerts) ? new Set(alerts.map(a => a.toilet_id)).size : 0;
  const clean = total - dirty;


  // We will map strictly from the database 'toilets' instead of 'predictions'
  // Always verify it is an array before mapping in case the backend returns an error object
  const validToilets = Array.isArray(toilets) ? toilets : [];
  const barLabels = validToilets.map(t => `T0${t.toilet_id}`);
  
  // Create safe fallback scores from live sensor data attached to toilets
  const usageData = validToilets.map(t => (t.distance ? Math.abs(t.distance * 10) : 10));
  const cleaningFreqData = validToilets.map(t => (t.distance ? Math.abs(t.distance * 3) : 3));

  const barData = {
    labels: barLabels,
    datasets: [
      {
        label: "Usage Activity",
        data: usageData,
        backgroundColor: "#10b981",
        borderRadius: 4,
        barPercentage: 0.5,
      },
      {
        label: "Cleaning Frequency",
        data: cleaningFreqData,
        backgroundColor: "#8b5cf6",
        borderRadius: 4,
        barPercentage: 0.5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { borderDash: [4, 4] } },
      x: { grid: { display: false } }
    }
  };

  const cleanlinessData = validToilets.map(t => {
    // Map odour level (0 - 10) to a cleanliness percentage (100 - 0)
    let odour = t.odour_level || 0;
    if (odour > 10) odour = 10;
    return 100 - (odour * 10);
  });

  const lineData = {
    labels: barLabels, // Using toilet IDs from DB instead of hours
    datasets: [
      {
        label: "Average Cleanliness Score",
        data: cleanlinessData,
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#fff",
        pointBorderColor: "#10b981",
        pointBorderWidth: 2
      }
    ],
  };

  const lineOptions = {
    ...chartOptions,
    scales: {
      y: { min: 0, max: 100, grid: { borderDash: [4, 4] } },
      x: { grid: { display: false } }
    }
  };

  // ✅ Correct console log
  console.log("API DATA:", toilets);

  return (
    <div className="app">
      <Sidebar />

      <div className="main">
        {/* HEADER */}
        <div className="dash-header">
          <div className="dash-title">
            <h1>Dashboard</h1>
            <p>Monitor and manage hygiene across all facilities</p>
          </div>

          <button className="refresh-btn"
            onClick={fetchData}>
            ⟳ Refresh Data
          </button>
        </div>

        {/* KPI CARDS */}
        <div className="cards5">

          <div className="dash-card">
            <div className="card-header">
              <div>
                <p className="card-title">Total Toilets</p>
                <h2>{total || 8}</h2>
                <span className="card-sub">All facilities</span>
              </div>
              <div className="card-icon blue"><i className="fa-solid fa-bath"></i> 🚿</div>
            </div>
            <div className="blob blue"></div>
          </div>

          <div className="dash-card">
            <div className="card-header">
              <div>
                <p className="card-title">Clean Toilets</p>
                <h2>{clean || 5}</h2>
                <span className="card-sub up">↗ +5% today</span>
              </div>
              <div className="card-icon green">✨</div>
            </div>
            <div className="blob green"></div>
          </div>

          <div className="dash-card">
            <div className="card-header">
              <div>
                <p className="card-title">Dirty Toilets</p>
                <h2>{dirty || 2}</h2>
                <span className="card-sub down">↘ Needs attention</span>
              </div>
              <div className="card-icon red">💧</div>
            </div>
            <div className="blob red"></div>
          </div>

          <div className="dash-card">
            <div className="card-header">
              <div>
                <p className="card-title">Active Alerts</p>
                <h2>{alerts.length || 1}</h2>
                <span className="card-sub">Requires action</span>
              </div>
              <div className="card-icon yellow">⚠️</div>
            </div>
            <div className="blob yellow"></div>
          </div>

          <div className="dash-card">
            <div className="card-header">
              <div>
                <p className="card-title">Staff On Duty</p>
                <h2>4</h2>
                <span className="card-sub">of 6 total</span>
              </div>
              <div className="card-icon purple">🧑‍🤝‍🧑</div>
            </div>
            <div className="blob purple"></div>
          </div>

        </div>

        {/* CHART SECTION */}
        <div className="charts-row">
          <div className="chart-container">
            <p className="chart-title">Weekly Usage & Cleaning Frequency</p>
            <div className="chart-wrap">
              <Bar data={barData} options={chartOptions} />
            </div>
          </div>

          <div className="chart-container">
            <p className="chart-title">Average Cleanliness Score</p>
            <div className="chart-wrap">
              <Line data={lineData} options={lineOptions} />
            </div>
          </div>
        </div>

        {/* BOTTOM PANELS */}
        <div className="panels-row">
          {/* Active Alerts Panel */}
          <div className="panel alert-panel">
            <div className="panel-header">
              <h3>Active Alerts</h3>
              <a href="#viewall">View All &gt;</a>
            </div>

            <div className="panel-body">
              {alerts.length === 0 ? (
                 <p style={{ color: "green", fontSize: "14px" }}>No active alerts. All toilets are clean ✅</p>
              ) : (
                alerts.map((alert, index) => (
                  <div key={index} className="modern-alert">
                    <div className="ma-top">
                      <div className="ma-left">
                        <div className="dot blue-dot"></div>
                        <strong>T-00{alert.toilet_id}</strong>
                        <span className="pill low">low</span>
                      </div>
                      <div className="ma-right">⚠️</div>
                    </div>
                    <div className="ma-content">
                      <p>{alert.message || "Motion sensor calibration needed."}</p>
                      <span className="ma-time">Feb 15, 16:37</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cleaning Logs Panel */}
          <div className="panel logs-panel">
            <div className="panel-header">
              <h3>Recent Cleaning Logs</h3>
              <a href="#viewall">View All &gt;</a>
            </div>
            
            <div className="table-responsive">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Toilet ID</th>
                    <th>Staff</th>
                    <th>Type</th>
                    <th>Score</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>T-001</strong></td>
                    <td>Maria Santos</td>
                    <td><span className="pill routine">Routine</span></td>
                    <td className="score-cell">72 &rarr; <strong>95</strong></td>
                    <td className="time-cell">Feb 15, 16:37</td>
                  </tr>
                  <tr>
                    <td><strong>T-002</strong></td>
                    <td>Maria Santos</td>
                    <td><span className="pill routine">Routine</span></td>
                    <td className="score-cell">65 &rarr; <strong>88</strong></td>
                    <td className="time-cell">Feb 15, 16:37</td>
                  </tr>
                  <tr>
                    <td><strong>T-004</strong></td>
                    <td>John Williams</td>
                    <td><span className="pill deep">Deep Clean</span></td>
                    <td className="score-cell">48 &rarr; <strong>91</strong></td>
                    <td className="time-cell">Feb 15, 16:37</td>
                  </tr>
                  <tr>
                    <td><strong>T-007</strong></td>
                    <td>Emily Davis</td>
                    <td><span className="pill routine">Routine</span></td>
                    <td className="score-cell">58 &rarr; <strong>82</strong></td>
                    <td className="time-cell">Feb 15, 16:37</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
