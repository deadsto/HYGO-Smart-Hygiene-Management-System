import { NavLink, useNavigate } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="side">
      <div className="side_header">
        <div className="logo-section">
          <span className="logo-icon">💧</span>
          <div>
            <h2 className="up-text" style={{margin: 0, fontSize: '20px'}}>HYGO</h2>
            <p style={{margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: 400}}>Smart Hygiene</p>
          </div>
        </div>
        <button className="back-circle-btn" onClick={handleBack} title="Go Back">
          ‹
        </button>
      </div>

      <div className="nav-links-container">
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "nav-btn active" : "nav-btn")}>
          <span className="nav-icon">⛾</span> Dashboard
        </NavLink>
        <NavLink to="/staff" className={({ isActive }) => (isActive ? "nav-btn active" : "nav-btn")}>
          <span className="nav-icon">👤</span> Staff Management
        </NavLink>
        <NavLink to="/toilet" className={({ isActive }) => (isActive ? "nav-btn active" : "nav-btn")}>
          <span className="nav-icon">🚽</span> Toilet Status
        </NavLink>
        <NavLink to="/alerts" className={({ isActive }) => (isActive ? "nav-btn active" : "nav-btn")}>
          <span className="nav-icon">⚠️</span> Alerts & Feedback
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => (isActive ? "nav-btn active" : "nav-btn")}>
          <span className="nav-icon">📊</span> Reports
        </NavLink>
      </div>

      <div className="sidebar-footer">
        <div className="nav-btn" style={{cursor: "pointer"}}>
          <span className="nav-icon">⚙️</span> Settings
        </div>
        <div className="nav-btn" style={{cursor: "pointer", color: "#e2e8f0"}} onClick={handleLogout}>
          <span className="nav-icon">🚪</span> Logout
        </div>
      </div>
    </div>
  );
}
