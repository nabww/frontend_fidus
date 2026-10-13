import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { homeFor } from "../utils/homeFor";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const invite = params.get("invite") === "1"; // admin-created seller account
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) return setError("Passwords don't match");
    setError("");
    setBusy(true);
    try {
      const user = await resetPassword(token, form.password);
      toast(invite ? "Welcome to Fidus — you're signed in" : "Password updated — you're signed in");
      navigate(homeFor(user), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't reset your password.");
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Invalid link</h1>
          <p className="subtitle">This reset link is missing its token.</p>
          <p className="auth-card__footer">
            <Link to="/forgot-password">Request a new link</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{invite ? "Set up your seller account" : "Choose a new password"}</h1>
        <p className="subtitle">
          {invite
            ? "Choose a password to finish setting up — you'll go straight to your dashboard."
            : "You'll be signed in once it's saved."}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="password">New password</label>
            <input
              id="password"
              className="input"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              className="input"
              type="password"
              required
              autoComplete="new-password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            />
          </div>
          <button className="btn btn--primary" type="submit" disabled={busy}>
            {busy ? "Saving..." : "Save password"}
          </button>
          {error && (
            <p className="error-text">
              {error}{" "}
              {error.includes("expired") && <Link to="/forgot-password">Request a new link</Link>}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
