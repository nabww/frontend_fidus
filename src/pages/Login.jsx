import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import OAuthButtons from "../components/OAuthButtons";
import { homeFor } from "../utils/homeFor";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from;
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await login(form.email, form.password);
      navigate(from || homeFor(user), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="subtitle">Sign in to your Fidus account</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="field">
            <div className="field__label-row">
              <label htmlFor="password">Password</label>
              <Link to="/forgot-password" className="field__aside">Forgot password?</Link>
            </div>
            <input
              id="password"
              className="input"
              type="password"
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button className="btn btn--primary" type="submit" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </button>
          {error && <p className="error-text">{error}</p>}
        </form>
        <OAuthButtons />
        <p className="auth-card__footer">
          New here? <Link to="/register" state={{ from }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
