import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { SUPPORT } from "../../config/support";

const COPY = {
  pending: {
    title: "Your application is under review",
    body: "Thanks for applying to sell on Fidus. Our team checks every seller before they go live — this usually takes 1–2 business days. We'll email you as soon as there's a decision.",
  },
  rejected: {
    title: "Your application wasn't approved",
    body: "Thanks for your interest in selling on Fidus. Unfortunately we couldn't approve your application this time.",
  },
};

export default function VendorStatus() {
  const { user, refreshUser } = useAuth();
  const [checking, setChecking] = useState(false);

  // Pick up a decision made while they were away
  useEffect(() => {
    refreshUser().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (user?.role === "vendor" && user.vendor_status === "approved")
    return <Navigate to="/vendor" replace />;
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  if (user?.role === "customer" && !user.vendor_status) return <Navigate to="/sell" replace />;
  const status = user?.vendor_status === "rejected" ? "rejected" : "pending";
  const { title, body } = COPY[status];
  const isCustomer = user?.role === "customer"; // applied from an existing shopping account

  async function check() {
    setChecking(true);
    try {
      await refreshUser();
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="page">
      <div className="card status-card">
        <span className={`status-card__icon status-card__icon--${status}`} aria-hidden="true">
          {status === "pending" ? "…" : "!"}
        </span>
        <h1>{title}</h1>
        <p className="muted">{body}</p>
        {isCustomer && status === "pending" && (
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            You can keep shopping as usual in the meantime.
          </p>
        )}
        {status === "rejected" && user?.review_note && (
          <p className="notice notice--warn">
            <strong>Reason:</strong> {user.review_note}
          </p>
        )}
        <div className="btn-row" style={{ justifyContent: "center" }}>
          {status === "pending" && (
            <button className="btn btn--primary" onClick={check} disabled={checking}>
              {checking ? "Checking..." : "Check status"}
            </button>
          )}
          {status === "rejected" && isCustomer && (
            <Link to="/sell" className="btn btn--primary">
              Apply again
            </Link>
          )}
          {isCustomer && (
            <Link to="/" className="btn btn--ghost">
              Continue shopping
            </Link>
          )}
          <Link to="/help" className="btn btn--ghost">
            Contact support
          </Link>
        </div>
        <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>
          Questions? Email{" "}
          <a href={`mailto:${SUPPORT.email}`} style={{ color: "var(--accent)" }}>
            {SUPPORT.email}
          </a>
        </p>
      </div>
    </div>
  );
}
