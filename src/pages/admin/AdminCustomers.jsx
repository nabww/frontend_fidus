import { useEffect, useState } from "react";
import client from "../../api/client";
import DashboardTabs from "../../components/DashboardTabs";
import { useToast } from "../../context/ToastContext";
import { ADMIN_TABS } from "./AdminOverview";

export default function AdminCustomers() {
  const { toast, confirm } = useToast();
  const [customers, setCustomers] = useState(null);
  const [error, setError] = useState("");

  const load = () => client.get("/admin/customers")
    .then((res) => { setCustomers(res.data); setError(""); })
    .catch(() => setError("Couldn't load customers."));
  useEffect(() => { load(); }, []);

  async function toggle(c) {
    const ok = await confirm(c.is_active ? {
      title: `Disable ${c.name}?`,
      message: "They're signed out and can't log in or place orders. Their order history is kept.",
      confirmLabel: "Disable account",
      danger: true,
    } : {
      title: `Re-enable ${c.name}?`,
      confirmLabel: "Re-enable",
    });
    if (!ok) return;
    try {
      await client.put(`/admin/users/${c.id}/active`, { is_active: !c.is_active });
      toast(c.is_active ? "Account disabled" : "Account re-enabled");
      await load();
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't update the account", { type: "error" });
    }
  }

  return (
    <div className="page page--wide">
      <h1>Admin</h1>
      <DashboardTabs base="/admin" tabs={ADMIN_TABS} />
      <h2 className="section-title" style={{ marginTop: "1.25rem" }}>
        Customers{customers ? ` (${customers.length})` : ""}
      </h2>

      {error && <p className="error-text">{error}</p>}
      {customers?.length === 0 && <p className="muted">No customers yet.</p>}

      <div className="stack">
        {customers?.map((c) => (
          <div key={c.id} className="card order-card">
            <div className="order-card__main">
              <strong>{c.name}</strong>
              <span className="muted">
                {c.email}
                {c.phone && ` · ${c.phone}`} · {c.order_count} order{c.order_count === 1 ? "" : "s"} ·
                joined {new Date(c.created_at || c.createdAt).toLocaleDateString()}
              </span>
            </div>
            <span className={`badge ${c.is_active ? "badge--paid" : "badge--cancelled"}`}>
              {c.is_active ? "active" : "disabled"}
            </span>
            <button className="btn btn--ghost btn--sm" onClick={() => toggle(c)}>
              {c.is_active ? "Disable" : "Enable"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
