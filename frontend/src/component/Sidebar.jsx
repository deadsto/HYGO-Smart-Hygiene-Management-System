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
        {/* Circular Back Button */}
        <button className="back-circle-btn" onClick={handleBack} title="Go Back">
          ←
        </button>
        <h2 className="up-text">HYGO</h2>
      </div>

      <div className="nav-links-container">
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "nav-btn active" : "nav-btn")}>
          Dashboard
        </NavLink>
        <NavLink to="/staff" className={({ isActive }) => (isActive ? "nav-btn active" : "nav-btn")}>
          Staff Management
        </NavLink>
        <NavLink to="/toilet" className={({ isActive }) => (isActive ? "nav-btn active" : "nav-btn")}>
          Toilet Status
        </NavLink>
        <NavLink to="/alerts" className={({ isActive }) => (isActive ? "nav-btn active" : "nav-btn")}>
          Alerts & Feedback
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => (isActive ? "nav-btn active" : "nav-btn")}>
          Reports
        </NavLink>
      </div>

      {/* Aesthetic Logout Section */}
      <div className="sidebar-footer">
        <button className="logout-card-btn" onClick={handleLogout}>
          <span className="logout-icon">Logout to Login</span>
        </button>
      </div>
    </div>
  );
}