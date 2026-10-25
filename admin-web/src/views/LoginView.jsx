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

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-logo-droplet">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="url(#cyan-grad-admin)" />
              <defs>
                <linearGradient id="cyan-grad-admin" x1="12" y1="2.69" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00b4d8" />
                  <stop offset="1" stopColor="#0284c7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="login-brand-name">Califnco</h1>
          <p className="login-brand-slogan">Pure Water, Better Life</p>
          <div className="login-divider-pill"></div>
          <h2 className="login-welcome-title">Welcome Back</h2>
          <p className="login-welcome-sub">Login to your executive account</p>
        </div>

        {error && (
          <div className="login-error-banner">
            <span style={{ marginRight: "6px" }}>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email or Phone</label>
            <div className="input-with-icon">
              <span className="input-icon">👤</span>
              <input
                type="email"
                className="form-input form-input-padded"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@califnco.com"
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "26px" }}>
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                className="form-input form-input-padded"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-pill-primary" style={{ width: "100%", height: "48px" }} disabled={loading}>
            {loading ? "Authenticating..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
