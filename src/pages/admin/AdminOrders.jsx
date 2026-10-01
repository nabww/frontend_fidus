import { useEffect, useState } from "react";
import client from "../../api/client";
import DashboardTabs from "../../components/DashboardTabs";
import { useToast } from "../../context/ToastContext";
import { ADMIN_TABS } from "./AdminOverview";

const kes = (n) => `KES ${Number(n || 0).toLocaleString()}`;
const FILTERS = ["", "pending", "paid", "shipped", "delivered", "cancelled"];
const ACTION_LABELS = { shipped: "Mark shipped", delivered: "Mark delivered", cancelled: "Cancel" };

export default function AdminOrders() {
  const { toast, confirm } = useToast();
  const [orders, setOrders] = useState(null);
  const [status, setStatus] = useState("");
  const [shipForm, setShipForm] = useState(null); // order id with the courier form open
  const [tracking, setTracking] = useState({ courier: "", tracking_number: "" });
  const [error, setError] = useState("");

  const load = () => client.get("/admin/orders", { params: status ? { status } : {} })
    .then((res) => { setOrders(res.data); setError(""); })
    .catch(() => setError("Couldn't load orders."));
  useEffect(() => { load(); }, [status]);

  async function act(order, nextStatus, extra = {}) {
    if (nextStatus === "cancelled") {
      const ok = await confirm({
        title: `Cancel order #${order.id}?`,
        message: "Stock goes back on the shelf and the customer is emailed. A paid order needs a manual M-Pesa refund.",
        confirmLabel: "Cancel order",
        danger: true,
      });
      if (!ok) return;
    }
    try {
      await client.put(`/orders/${order.id}/status`, { status: nextStatus, ...extra });
      toast(`Order #${order.id} marked ${nextStatus}`);
      setShipForm(null);
      setTracking({ courier: "", tracking_number: "" });
      await load();
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't update the order", { type: "error", duration: 3000 });
    }
  }

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
          <div key={o.id} className="card" style={{ padding: "0.9rem 1.1rem" }}>
            <div className="order-card" style={{ padding: 0 }}>
              <div className="order-card__main">
                <strong>#{o.id} · {o.customer?.name || "Customer"}</strong>
                <span className="muted">
                  {new Date(o.created_at || o.createdAt).toLocaleString()} ·{" "}
                  {o.customer?.email} · {o.shipping_address}
                </span>
                <span className="muted">
                  {o.items?.map((i) => `${i.quantity}× ${i.product?.name || `#${i.product_id}`}`).join(", ")}
                  {o.mpesa_receipt && ` · M-Pesa ${o.mpesa_receipt}`}
                  {o.courier && ` · ${o.courier}${o.tracking_number ? ` ${o.tracking_number}` : ""}`}
                </span>
              </div>
              <span className={`badge badge--${o.status}`}>{o.status}</span>
              <span className="order-card__total">{kes(o.total)}</span>
              {o.allowed?.length > 0 && (
                <div className="order-card__actions">
                  {o.allowed.map((s) => (
                    <button key={s}
                      className={`btn btn--sm ${s === "cancelled" ? "btn--ghost" : "btn--primary"}`}
                      onClick={() => s === "shipped"
                        ? setShipForm(shipForm === o.id ? null : o.id)
                        : act(o, s)}>
                      {ACTION_LABELS[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Admin ships on behalf of a vendor — same courier/tracking capture */}
            {shipForm === o.id && (
              <form style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "0.75rem", alignItems: "flex-end" }}
                onSubmit={(e) => { e.preventDefault(); act(o, "shipped", tracking); }}>
                <div className="field" style={{ flex: 1, minWidth: 140 }}>
                  <label>Courier</label>
                  <input className="input" placeholder="e.g. Fargo, G4S" value={tracking.courier}
                    onChange={(e) => setTracking({ ...tracking, courier: e.target.value })} />
                </div>
                <div className="field" style={{ flex: 1, minWidth: 140 }}>
                  <label>Tracking number</label>
                  <input className="input" placeholder="Optional" value={tracking.tracking_number}
                    onChange={(e) => setTracking({ ...tracking, tracking_number: e.target.value })} />
                </div>
                <button className="btn btn--primary btn--sm" type="submit">Confirm shipped</button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
