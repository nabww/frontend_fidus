import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../../api/client";
import DashboardTabs from "../../components/DashboardTabs";
import { useToast } from "../../context/ToastContext";

const kes = (n) => `KES ${Number(n || 0).toLocaleString()}`;
const FILTERS = ["", "paid", "shipped", "delivered", "pending", "cancelled"];
const ACTION_LABELS = { shipped: "Mark shipped", delivered: "Mark delivered", cancelled: "Cancel order" };

export const VENDOR_TABS = [
  { to: "", label: "Overview" },
  { to: "/orders", label: "Orders" },
  { to: "/products", label: "Products" },
];

// The vendor's share of an order (they only ever see their own items)
const vendorTotal = (order) =>
  order.items.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0);

export default function VendorOrders() {
  const navigate = useNavigate();
  const { toast, confirm } = useToast();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = (s = status) => {
    setLoading(true);
    client.get("/orders/vendor", { params: s ? { status: s } : {} })
      .then((res) => { setOrders(res.data); setError(""); })
      .catch(() => setError("Couldn't load orders."))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(status); }, [status]);

  async function act(order, nextStatus, e) {
    e.preventDefault(); // the card is a Link — don't navigate
    if (nextStatus === "shipped") {
      // Courier + tracking are captured on the detail page
      navigate(`/vendor/orders/${order.id}`, { state: { ship: true } });
      return;
    }
    if (nextStatus === "cancelled") {
      const ok = await confirm({
        title: `Cancel order #${order.id}?`,
        message: "Stock goes back on the shelf. The customer is emailed — a paid order needs a manual M-Pesa refund.",
        confirmLabel: "Cancel order",
        danger: true,
      });
      if (!ok) return;
    }
    try {
      await client.put(`/orders/${order.id}/status`, { status: nextStatus });
      toast(`Order #${order.id} marked ${nextStatus}`);
      load();
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't update the order", { type: "error", duration: 3000 });
    }
  }

  return (
    <div className="page">
      <h1>Selling on Fidus</h1>
      <DashboardTabs base="/vendor" tabs={VENDOR_TABS} />

      <div className="chip-row" style={{ marginTop: "1.25rem" }}>
        {FILTERS.map((f) => (
          <button key={f || "all"} className={`chip${status === f ? " chip--active" : ""}`}
            onClick={() => setStatus(f)}>
            {f || "All"}
          </button>
        ))}
      </div>

      {error && <p className="error-text" style={{ marginTop: "1rem" }}>{error}</p>}
      {!loading && orders.length === 0 && (
        <p className="muted" style={{ marginTop: "1.5rem" }}>
          {status ? `No ${status} orders.` : "No orders yet — they'll appear here when customers buy your products."}
        </p>
      )}

      <div className="stack" style={{ marginTop: "1rem" }}>
        {orders.map((o) => (
          <Link key={o.id} to={`/vendor/orders/${o.id}`} className="card order-card">
            <div className="order-card__main">
              <strong>Order #{o.id} · {o.customer?.name || "Customer"}</strong>
              <span className="muted">
                {new Date(o.created_at || o.createdAt).toLocaleDateString()} ·{" "}
                {o.items.map((i) => `${i.quantity}× ${i.product?.name || "item"}`).join(", ")}
              </span>
            </div>
            <span className={`badge badge--${o.status}`}>{o.status}</span>
            <span className="order-card__total">{kes(vendorTotal(o))}</span>
            {o.allowed?.length > 0 && (
              <div className="order-card__actions" onClick={(e) => e.preventDefault()}>
                {o.allowed.map((s) => (
                  <button key={s}
                    className={`btn btn--sm ${s === "cancelled" ? "btn--ghost" : "btn--primary"}`}
                    onClick={(e) => act(o, s, e)}>
                    {ACTION_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
