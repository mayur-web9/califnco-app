import React, { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

export default function LoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    if (e) e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid = cred.user.uid;

      // Verify user is an Admin in Firestore
      const userSnap = await getDoc(doc(db, "users", uid));
      if (!userSnap.exists() || userSnap.data()?.role !== "Admin") {
        await signOut(auth);
        setError("Access Denied: Only Califnco executive administrators may access this portal.");
        setLoading(false);
        return;
      }

      onLoginSuccess({ uid, ...userSnap.data() });
    } catch (err) {
      setError(err.message || "Login failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  }

  function prefillAdmin() {
    setEmail("admin@test.com");
    setPassword("Admin@123456");
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">💧</div>
          <h1 className="login-title">Califnco Admin</h1>
          <p className="login-subtitle">Executive Command Center</p>
        </div>

        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#f87171",
            padding: "12px",
            borderRadius: "8px",
            fontSize: "13px",
            marginBottom: "16px"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@califnco.com"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "24px" }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "14px" }} disabled={loading}>
            {loading ? "Authenticating..." : "Sign in to Dashboard →"}
          </button>
        </form>

        <div className="quick-creds">
          <div><strong>Evaluation Credentials:</strong></div>
          <div><code>admin@test.com</code> / <code>Admin@123456</code></div>
          <button type="button" className="quick-creds-btn" onClick={prefillAdmin}>
            ⚡ Prefill Admin Credentials
          </button>
        </div>
      </div>
    </div>
  );
}
