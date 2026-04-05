import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/log.css";
import mopLogo from "../img_vid/mop_hygo1.png";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");

  const role = searchParams.get("role");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

  const username = e.target.email.value;
  const password = e.target.password.value;

    try {
      const response = await fetch("https://hygo-smart-hygiene-management-system-4os1.onrender.com/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } else {
      setError(data.error || "Login failed");
    }
  } catch (err) {
    console.error("Login error:", err);
    setError("Server connection failed. Make sure the backend is running.");
  }
};

return (

<div className="login-page">

  <div className="login-card">

    <div className="logo-container">
      <img src={mopLogo} alt="Company Logo" className="app-logo" />
    </div>

    {error && <div style={{ color: "#ef4444", marginBottom: "15px", fontWeight: "500", textAlign: "center" }}>{error}</div>}

    <h1>{role === "admin" ? "Admin Login" : "Staff Login"}</h1>

    <p className="subtitle">
      Please enter your details to sign in
    </p>

    <form onSubmit={handleLogin}>

      <input
        type="text"
        name="email"
        placeholder="Username"
        required
      />

      <input
        type="password"
        name="password"
        placeholder="Password"
        required
      />

      <div className="options">

        <button
          type="button"
          className="link-btn"
          onClick={() => alert("Forgot password coming soon")}
        >
          Forgot password?
        </button>

      </div>

      <button type="submit" className="btn">
        Sign in
      </button>

    </form>

    <div className="options">

      <button
        type="button"
        className="link-btn"
        onClick={() => navigate("/roles")}
      >
        ← Change Role
      </button>

    </div>

  </div>

</div>

);

}
