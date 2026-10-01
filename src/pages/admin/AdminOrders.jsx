import { useEffect, useState } from "react";
import client from "../../api/client";
import DashboardTabs from "../../components/DashboardTabs";
import { ADMIN_TABS } from "./AdminOverview";

const kes = (n) => `KES ${Number(n || 0).toLocaleString()}`;
const FILTERS = ["", "pending", "paid", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
  const [orders, setOrders] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    client.get("/admin/orders", { params: status ? { status } : {} })
      .then((res) => { setOrders(res.data); setError(""); })
      .catch(() => setError("Couldn't load orders."));
  }, [status]);

  return (
    <div className="page page--wide">
      <h1>Admin</h1>
      <DashboardTabs base="/admin" tabs={ADMIN_TABS} />

      <div className="chip-row" style={{ marginTop: "1.25rem" }}>
        {FILTERS.map((f) => (
          <button key={f || "all"} className={`chip${status === f ? " chip--active" : ""}`}
            onClick={() => setStatus(f)}>
            {f || "All"}
          </button>
        ))}
      </div>

      {error && <p className="error-text" style={{ marginTop: "1rem" }}>{error}</p>}
      {orders?.length === 0 && (
        <p className="muted" style={{ marginTop: "1.5rem" }}>
          {status ? `No ${status} orders.` : "No orders yet."}
        </p>
      )}

      <div className="stack" style={{ marginTop: "1rem" }}>
        {orders?.map((o) => (
          <div key={o.id} className="card order-card">
            <div className="order-card__main">
              <strong>#{o.id} · {o.customer?.name || "Customer"}</strong>
              <span className="muted">
                {new Date(o.created_at || o.createdAt).toLocaleString()} ·{" "}
                {o.customer?.email} · {o.shipping_address}
              </span>
              <span className="muted">
                {o.items?.map((i) => `${i.quantity}× ${i.product?.name || `#${i.product_id}`}`).join(", ")}
                {o.mpesa_receipt && ` · M-Pesa ${o.mpesa_receipt}`}
              </span>
            </div>
            <span className={`badge badge--${o.status}`}>{o.status}</span>
            <span className="order-card__total">{kes(o.total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
