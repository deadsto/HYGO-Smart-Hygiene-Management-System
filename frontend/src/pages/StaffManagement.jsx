import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../component/Sidebar";
import "../styles/staff.css";

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("https://hygo-smart-hygiene-management-system-4os1.onrender.com/api/staff")
      .then((res) => res.json())
      .then((data) => setStaff(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching staff:", err));
  }, []);

  // ✅ ENSURE IT IS ALWAYS AN ARRAY
  const validStaff = Array.isArray(staff) ? staff : [];

  // ✅ SUMMARY COUNTS
  const totalStaff = validStaff.length;
  const onDuty = validStaff.filter((s) => s.status === "on").length;
  const offDuty = validStaff.filter((s) => s.status === "off").length;

  // ✅ COMBINED FILTER (search + dropdown)
  const filteredStaff = validStaff.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      String(s.staff_id).includes(search);

    const matchesFilter =
      filter === "all" || s.status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="app">
      <Sidebar />

      <div className="main">
        {/* HEADER */}
        <div className="dash-header">
          <div className="dash-title">
            <h1>Staff Management</h1>
            <p>Manage cleaning staff and assignments</p>
          </div>
          <button
            onClick={() => navigate("/add-staff")}
            className="add-btn"
          >
            ＋ Add Staff Member
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="staff-summary">
          <div className="summary-card">
            <div>
              <p>Total Staff</p>
              <h2>{totalStaff}</h2>
            </div>
            <div className="summary-icon gray" style={{color: "#333", fontSize: "20px"}}>👤</div>
          </div>

          <div className="summary-card active">
            <div>
              <p>On Duty</p>
              <h2 style={{color: "#16a34a"}}>{onDuty}</h2>
            </div>
            <div className="summary-icon green" style={{fontSize: "20px"}}>✔</div>
          </div>

          <div className="summary-card">
            <div>
              <p>Off Duty</p>
              <h2>{offDuty}</h2>
            </div>
            <div className="summary-icon gray" style={{fontSize: "20px"}}>🕒</div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="staff-controls">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="on">On Duty</option>
            <option value="off">Off Duty</option>
          </select>
        </div>

        {/* STAFF GRID */}
        <div className="staff-grid">
          {filteredStaff.map((s) => (
            <div className="staff-card" key={s.staff_id}>
              
              <div className="staff-top">
                <div className="staff-profile">
                  <div className="avatar" style={{ background: s.avatarColor }}>
                    {s.name.charAt(0)}
                  </div>
                  <div className="staff-titles">
                    <h3>{s.name}</h3>
                    <p className="staff-id">ID: EMP-{s.staff_id}</p>
                  </div>
                </div>
                <div className="staff-actions">
                  <span className="icon-btn">📝</span> 
                  <span className="icon-btn">🗑️</span>
                </div>
              </div>

              <div className="staff-info-rows">
                <p>✉️ {s.email}</p>
                <p>📞 {s.phone}</p>
                <p>📍 {s.location}</p>
              </div>

              <div className="staff-tags">
                <span className={`tag ${s.status}`}>
                  {s.status === "on" ? "✔ On Duty" : "🕒 Off Duty"}
                </span>
                <span className={`tag role ${s.role.toLowerCase()}`}>
                  {s.role}
                </span>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
