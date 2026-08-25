import { useState } from "react";
import { api } from "../api.js";

export default function Login({ onLogin }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const studentData = await api.studentLogin(name, password);
      localStorage.setItem("mosque_student", JSON.stringify(studentData));
      onLogin(studentData);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: "16px" }}>
      <form onSubmit={handleSubmit} style={{
        width: "100%",
        maxWidth: "400px",
        background: "#ffffff",
        padding: "32px",
        borderRadius: "16px",
        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.04)",
        border: "1px solid #f1f5f9",
        borderTop: "4px solid #EBC250"
      }}>
        <h2 style={{ textAlign: "center", color: "#2DAFBB", marginTop: 0, marginBottom: "24px", fontSize: "22px" }}>
          🔑 تسجيل الدخول إلى السوق
        </h2>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>
            اسم الطالب
          </label>
          <input
            placeholder="أدخل اسمك المسجل"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>
            كلمة المرور
          </label>
          <input
            placeholder="أدخل كلمة المرور"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <button type="submit" style={{ width: "100%", padding: "12px", fontSize: "15px", background: "#2DAFBB" }}>
          دخول
        </button>

        {error && (
          <div className="error" style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "10px", borderRadius: "8px", marginTop: "16px", textAlign: "center", fontSize: "14px" }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}