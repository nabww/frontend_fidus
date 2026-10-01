import { useEffect, useState } from "react";
import client from "../../api/client";
import DashboardTabs from "../../components/DashboardTabs";

const kes = (n) => `KES ${Number(n || 0).toLocaleString()}`;

export const ADMIN_TABS = [
  { to: "", label: "Overview" },
  { to: "/vendors", label: "Vendors" },
  { to: "/customers", label: "Customers" },
  { to: "/orders", label: "Orders" },
  { to: "/products", label: "Products" },
  { to: "/payouts", label: "Payouts" },
];

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    client.get("/admin/stats")
      .then((res) => setStats(res.data))
      .catch(() => setError("Couldn't load stats."));
  }, []);

  return (
    <div className="page page--wide">
      <h1>Admin</h1>
      <DashboardTabs base="/admin" tabs={ADMIN_TABS} />
      {error && <p className="error-text" style={{ marginTop: "1rem" }}>{error}</p>}

      {stats && (
        <>
          <div className="stat-cards">
            <div className="stat-card"><p>Gross sales</p><strong>{kes(stats.gmv)}</strong></div>
            <div className="stat-card"><p>Orders</p><strong>{stats.orders}</strong></div>
            <div className="stat-card"><p>Commission earned</p><strong>{kes(stats.commissionEarned)}</strong></div>
            <div className="stat-card"><p>Paid out to vendors</p><strong>{kes(stats.paidOut)}</strong></div>
          </div>
          <div className="stat-cards">
            <div className="stat-card"><p>Vendors</p><strong>{stats.users.vendor || 0}</strong></div>
            <div className="stat-card"><p>Customers</p><strong>{stats.users.customer || 0}</strong></div>
            <div className="stat-card"><p>Live products</p><strong>{stats.activeProducts}</strong></div>
            <div className="stat-card"><p>Awaiting payment</p><strong>{stats.byStatus.pending || 0}</strong></div>
          </div>

          <h2 className="section-title">Orders by status</h2>
          <div className="card" style={{ padding: "0.4rem 1.1rem" }}>
            {Object.entries(stats.byStatus).map(([s, n]) => (
              <div key={s} className="row">
                <span className={`badge badge--${s}`}>{s}</span>
                <span>{n}</span>
              </div>
            ))}
            {Object.keys(stats.byStatus).length === 0 && (
              <p className="muted" style={{ padding: "0.5rem 0", margin: 0 }}>No orders yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
