import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";
import DashboardTabs from "../../components/DashboardTabs";
import { ADMIN_TABS } from "./AdminOverview";

export default function AdminVendors() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    client.get("/admin/vendors")
      .then((res) => setData(res.data))
      .catch(() => setError("Couldn't load vendors."));
  }, []);

  return (
    <div className="page page--wide">
      <h1>Admin</h1>
      <DashboardTabs base="/admin" tabs={ADMIN_TABS} />
      <h2 className="section-title" style={{ marginTop: "1.25rem" }}>
        Vendors{data ? ` (${data.vendors.length})` : ""}
      </h2>
      <p className="muted" style={{ fontSize: "0.85rem", margin: "0 0 0.5rem" }}>
        Default commission {data?.default_commission_rate}% — a vendor's own rate overrides it.
      </p>

      {error && <p className="error-text">{error}</p>}
      {data?.vendors.length === 0 && <p className="muted">No vendors yet.</p>}

      <div className="stack">
        {data?.vendors.map((v) => (
          <Link key={v.id} to={`/admin/vendors/${v.id}`} className="card order-card">
            <div className="order-card__main">
              <strong>{v.name}</strong>
              <span className="muted">
                {v.email}
                {v.phone && ` · ${v.phone}`} · {v.product_count} product{v.product_count === 1 ? "" : "s"}
                {v.payout_phone ? " · payout number set" : " · no payout number"}
                {v.commission_rate != null && ` · ${Number(v.commission_rate)}% commission`}
              </span>
            </div>
            <span className={`badge ${v.is_active ? "badge--paid" : "badge--cancelled"}`}>
              {v.is_active ? "active" : "disabled"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
