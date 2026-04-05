import { useState, useEffect } from "react";
import Sidebar from "../component/Sidebar";
import "../styles/reports.css";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function Reports() {
  const [cleaningData, setCleaningData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({
    total_cleanings: 0,
    avg_duration: "0",
    verification_rate: "0",
    alerts_resolved: 0
  });

  useEffect(() => {
    async function loadReports() {
      try {
        const [cleanings, types, staff, logsRes, summaryRes] = await Promise.all([
          fetch("http://127.0.0.1:5000/api/report/cleanings").then(r => r.json()),
          fetch("http://127.0.0.1:5000/api/report/types").then(r => r.json()),
          fetch("http://127.0.0.1:5000/api/report/top-staff").then(r => r.json()),
          fetch("http://127.0.0.1:5000/api/report/logs").then(r => r.json()),
          fetch("http://127.0.0.1:5000/api/report/summary").then(r => r.json()),
        ]);

        setCleaningData(cleanings || []);
        setPieData(types || []);
        setPerformers(staff || []);
        setLogs(logsRes || []);
        setSummary(summaryRes || summary);
      } catch (error) {
        console.error("Report API Error:", error);
      }
    }
    loadReports();
  }, []);

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        {/* HEADER */}
        <div className="dash-header">
          <div className="dash-title">
            <h1>Reports</h1>
            <p>Analytics and performance insights</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "10px 16px", color: "#4b5563", display: "flex", alignItems: "center", gap: "6px" }}>
              📅 Last 7 Days ⌄
            </button>
            <button style={{ background: "white", border: "1px solid #10b981", color: "#10b981", borderRadius: "8px", padding: "10px 16px", display: "flex", alignItems: "center", gap: "6px", fontWeight: "500" }}>
              📥 Export
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="report-sum-modern">
          <div className="report-card">
            <div>
              <p>Total Cleanings</p>
              <h2>{summary.total_cleanings}</h2>
            </div>
            <div className="sq-icon" style={{ background: "#dcfce7", color: "#10b981" }}>✨</div>
          </div>
          <div className="report-card">
            <div>
              <p>Avg Duration</p>
              <h2>{summary.avg_duration} <span style={{ fontSize: "14px", color: "#6b7280" }}>min</span></h2>
            </div>
            <div className="sq-icon" style={{ background: "#e0f2fe", color: "#3b82f6" }}>🕒</div>
          </div>
          <div className="report-card">
            <div>
              <p>Verification Rate</p>
              <h2>{summary.verification_rate}%</h2>
            </div>
            <div className="sq-icon" style={{ background: "#f3e8ff", color: "#8b5cf6" }}>☑️</div>
          </div>
          <div className="report-card">
            <div>
              <p>Alerts Resolved</p>
              <h2>{summary.alerts_resolved}</h2>
            </div>
            <div className="sq-icon" style={{ background: "#fef9c3", color: "#eab308" }}>📈</div>
          </div>
        </div>

        {/* CHARTS GRID */}
        <div className="charts-split">
          <div className="block-card">
            <h3 style={{ margin: "0 0 20px 0", color: "#1f2937" }}>Daily Cleaning Activity</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={cleaningData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                <Tooltip />
                <Bar dataKey="cleanings" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="block-card">
            <h3 style={{ margin: "0 0 20px 0", color: "#1f2937" }}>Cleaning Types Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={2}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              <span style={{ color: "#4b5563", fontSize: "14px" }}><span style={{ color: "#10b981" }}>■</span> Routine</span>
              <span style={{ color: "#4b5563", fontSize: "14px" }}><span style={{ color: "#f59e0b" }}>■</span> Deep Clean</span>
              <span style={{ color: "#4b5563", fontSize: "14px" }}><span style={{ color: "#ef4444" }}>■</span> Emergency</span>
              <span style={{ color: "#4b5563", fontSize: "14px" }}><span style={{ color: "#8b5cf6" }}>■</span> Inspection</span>
            </div>
          </div>
        </div>

        {/* BOTTOM TWO COLUMNS */}
        <div className="tables-split">
          {/* TOP PERFORMERS */}
          <div className="block-card" style={{ flex: 1 }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#1f2937", borderBottom: "1px solid #e5e7eb", paddingBottom: "10px" }}>Top Performers</h3>
            <div className="performers-list">
              {performers.map((p, i) => (
                <div key={i} className="perf-item">
                  <div className={`rank-circle rank-${i}`}>{i + 1}</div>
                  <div className="perf-dtl">
                    <strong>{p.name}</strong>
                    <p>{p.cleanings} cleanings</p>
                  </div>
                  <div className={`score-badge ${p.score > 0 ? "green-bg" : "gray-bg"}`}>{p.score}</div>
                </div>
              ))}
            </div>
          </div>

          {/* LOGS TABLE */}
          <div className="block-card" style={{ flex: 2 }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#1f2937", borderBottom: "1px solid #e5e7eb", paddingBottom: "10px" }}>Recent Cleaning Logs</h3>
            <table className="logs-tbl">
              <thead>
                <tr>
                  <th>Toilet</th>
                  <th>Staff</th>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Score</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((L, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500, color: "#1f2937" }}>{L.toilet}</td>
                    <td><div style={{ color: "#4b5563" }}>{L.staff}</div></td>
                    <td><span className={`log-tag tag-${L.typeColor}`}>{L.type}</span></td>
                    <td style={{ color: "#4b5563" }}>{L.duration}</td>
                    <td style={{ color: "#10b981", fontWeight: 500 }}>{L.scoreText}</td>
                    <td style={{ color: "#6b7280", fontSize: "13px" }}>{L.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
