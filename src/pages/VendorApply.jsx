import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homeFor } from "../utils/homeFor";

const EMPTY = { name: "", business_name: "", email: "", phone: "", application_note: "", password: "", confirm: "" };

export default function VendorApply() {
  const { user, applyVendor, upgradeToVendor } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const upgrading = user?.role === "customer"; // existing customer → seller

  if (user?.role === "vendor") return <Navigate to={homeFor(user)} replace />;
  if (upgrading && user.vendor_status === "pending") return <Navigate to="/vendor/status" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!upgrading && form.password !== form.confirm) return setError("Passwords don't match");
    setError("");
    setBusy(true);
    try {
      if (upgrading) {
        await upgradeToVendor({
          business_name: form.business_name,
          phone: form.phone || undefined,
          application_note: form.application_note,
        });
      } else {
        const { confirm, ...payload } = form;
        await applyVendor(payload);
      }
      navigate("/vendor/status", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't submit your application");
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <h1>Sell on Fidus</h1>
        <p className="subtitle">
          Tell us about your business. Every seller is reviewed by our team before going live — we'll email you once you're approved.
        </p>

        {user && !upgrading ? (
          <p className="notice" style={{ textAlign: "center" }}>
            You're signed in as an admin — seller applications are for customer accounts.
          </p>
        ) : upgrading ? (
          <form onSubmit={handleSubmit}>
            <p className="notice" style={{ margin: 0 }}>
              Applying as <strong>{user.email}</strong>. You'll keep your order history and can carry on shopping.
            </p>
            {user.vendor_status === "rejected" && (
              <p className="notice notice--warn" style={{ margin: 0 }}>
                Your last application wasn't approved{user.review_note ? `: ${user.review_note}` : "."} You're welcome to apply again.
              </p>
            )}
            <div className="form-grid">
              <div className="field">
                <label htmlFor="vu-biz">Business name</label>
                <input id="vu-biz" className="input" required autoComplete="organization"
                  value={form.business_name} onChange={set("business_name")} />
              </div>
              <div className="field">
                <label htmlFor="vu-phone">Business phone</label>
                <input id="vu-phone" className="input" type="tel" autoComplete="tel" placeholder="07XX XXX XXX"
                  value={form.phone} onChange={set("phone")} />
                <p className="field__hint">Leave blank to use the number on your account.</p>
              </div>
            </div>
            <div className="field">
              <label htmlFor="vu-note">What do you sell?</label>
              <textarea id="vu-note" className="input" required rows={4} minLength={20} maxLength={2000}
                placeholder="E.g. phone accessories and chargers, based in Nairobi CBD, selling for 3 years…"
                value={form.application_note} onChange={set("application_note")} />
              <p className="field__hint">Product types, where you're based, and anything that helps us verify your business.</p>
            </div>
            <button className="btn btn--primary" type="submit" disabled={busy}>
              {busy ? "Submitting..." : "Submit application"}
            </button>
            {error && <p className="error-text">{error}</p>}
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="va-name">Your name</label>
                <input id="va-name" className="input" required autoComplete="name" value={form.name} onChange={set("name")} />
              </div>
              <div className="field">
                <label htmlFor="va-biz">Business name</label>
                <input id="va-biz" className="input" required autoComplete="organization" value={form.business_name} onChange={set("business_name")} />
              </div>
              <div className="field">
                <label htmlFor="va-email">Business email</label>
                <input id="va-email" className="input" type="email" required autoComplete="email" value={form.email} onChange={set("email")} />
              </div>
              <div className="field">
                <label htmlFor="va-phone">Phone</label>
                <input id="va-phone" className="input" type="tel" required autoComplete="tel" placeholder="07XX XXX XXX"
                  value={form.phone} onChange={set("phone")} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="va-note">What do you sell?</label>
              <textarea id="va-note" className="input" required rows={4} minLength={20} maxLength={2000}
                placeholder="E.g. phone accessories and chargers, based in Nairobi CBD, selling for 3 years…"
                value={form.application_note} onChange={set("application_note")} />
              <p className="field__hint">Product types, where you're based, and anything that helps us verify your business.</p>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="va-pass">Password</label>
                <input id="va-pass" className="input" type="password" required minLength={8} autoComplete="new-password"
                  value={form.password} onChange={set("password")} />
              </div>
              <div className="field">
                <label htmlFor="va-confirm">Confirm password</label>
                <input id="va-confirm" className="input" type="password" required autoComplete="new-password"
                  value={form.confirm} onChange={set("confirm")} />
              </div>
            </div>
            <button className="btn btn--primary" type="submit" disabled={busy}>
              {busy ? "Submitting..." : "Submit application"}
            </button>
            {error && <p className="error-text">{error}</p>}
          </form>
        )}

        {!user && (
          <p className="auth-card__footer">
            Already shop with us? <Link to="/login" state={{ from: "/sell" }}>Sign in</Link> to apply with your account ·{" "}
            Just shopping? <Link to="/register">Create a customer account</Link>
          </p>
        )}
      </div>
    </div>
  );
}
