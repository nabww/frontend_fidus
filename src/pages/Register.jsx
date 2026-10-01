import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import OAuthButtons from "../components/OAuthButtons";
import { homeFor } from "../utils/homeFor";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from;
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "", role: "customer" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return setError("Passwords don't match");
    }
    setError("");
    setBusy(true);
    try {
      const { confirmPassword, ...payload } = form;
      const user = await register(payload);
      navigate(from || homeFor(user), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      setBusy(false);
    }
  }

  const field = (id, label, props) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="input" required {...props} />
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create your account</h1>
        <p className="subtitle">Join Fidus — shop or sell electronics</p>
        <form onSubmit={handleSubmit}>
          {field("name", "Full name", {
            value: form.name,
            autoComplete: "name",
            onChange: (e) => setForm({ ...form, name: e.target.value }),
          })}
          {field("email", "Email", {
            type: "email",
            value: form.email,
            autoComplete: "email",
            onChange: (e) => setForm({ ...form, email: e.target.value }),
          })}
          {field("phone", "Phone", {
            type: "tel",
            placeholder: "07XX XXX XXX",
            value: form.phone,
            autoComplete: "tel",
            onChange: (e) => setForm({ ...form, phone: e.target.value }),
          })}
          {field("password", "Password", {
            type: "password",
            minLength: 8,
            value: form.password,
            autoComplete: "new-password",
            onChange: (e) => setForm({ ...form, password: e.target.value }),
          })}
          {field("confirm", "Confirm password", {
            type: "password",
            value: form.confirmPassword,
            autoComplete: "new-password",
            onChange: (e) => setForm({ ...form, confirmPassword: e.target.value }),
          })}
          <label className="check">
            <input type="checkbox" checked={form.role === "vendor"}
              onChange={(e) => setForm({ ...form, role: e.target.checked ? "vendor" : "customer" })} />
            Register as a vendor
          </label>
          <button className="btn btn--primary" type="submit" disabled={busy}>
            {busy ? "Creating account..." : "Create account"}
          </button>
          {error && <p className="error-text">{error}</p>}
        </form>
        <OAuthButtons />
        <p className="footer">
          Already have an account? <Link to="/login" state={{ from }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
