import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../../api/client";
import DashboardShell from "../../components/DashboardShell";
import FilterChips from "../../components/FilterChips";
import { ListEmpty, ListSkeleton } from "../../components/ListState";
import SearchBox from "../../components/SearchBox";
import { useToast } from "../../context/ToastContext";
import useList from "../../hooks/useList";
import { kes, matches, shortDate, vendorTotal } from "../../utils/format";

const FILTERS = ["", "paid", "shipped", "delivered", "pending", "cancelled"];
const ACTION_LABELS = { shipped: "Mark shipped", delivered: "Mark delivered", cancelled: "Cancel order" };

export default function VendorOrders() {
  const navigate = useNavigate();
  const { toast, confirm } = useToast();
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const { data: orders, loading, error, reload } = useList("/orders/vendor", { status: status || undefined });

  async function act(order, nextStatus, e) {
    e.preventDefault(); // the card is a Link — don't navigate
    if (nextStatus === "shipped") {
      // Courier + tracking are captured on the detail page
      navigate(`/vendor/orders/${order.id}`, { state: { ship: true } });
      return;
    }
    if (nextStatus === "cancelled") {
      const ok = await confirm({
        title: `Cancel order #${order.order_no}?`,
        message: "Stock goes back on the shelf. The customer is emailed — a paid order needs a manual M-Pesa refund.",
        confirmLabel: "Cancel order",
        danger: true,
      });
      if (!ok) return;
    }
    try {
      await client.put(`/orders/${order.id}/status`, { status: nextStatus });
      toast(`Order #${order.order_no} marked ${nextStatus}`);
      reload();
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't update the order", { type: "error", duration: 3000 });
    }
  }

  const shown = orders?.filter((o) =>
    matches(query, `#${o.order_no}`, o.customer?.name, o.items.map((i) => i.product?.name).join(" ")));

  return (
    <DashboardShell area="vendor">
      <div className="toolbar">
        <SearchBox value={query} onChange={setQuery} placeholder="Order #, customer or product" />
        <FilterChips options={FILTERS} value={status} onChange={setStatus} />
      </div>

      {error && <p className="error-text">{error}</p>}
      {!orders && !error && <ListSkeleton />}
      {shown?.length === 0 && (
        <ListEmpty query={query.trim()} filtered={status} onClear={() => { setQuery(""); setStatus(""); }}>
          No orders yet — they'll appear here when customers buy your products.
        </ListEmpty>
      )}

      <div className={`stack${loading && orders ? " is-loading" : ""}`}>
        {shown?.map((o) => (
          <Link key={o.id} to={`/vendor/orders/${o.id}`} className="card order-card">
            <div className="order-card__main">
              <strong>#{o.order_no} · {o.customer?.name || "Customer"}</strong>
              <span className="muted truncate">
                {shortDate(o.created_at || o.createdAt)} ·{" "}
                {o.items.map((i) => `${i.quantity}× ${i.product?.name || "item"}`).join(", ")}
              </span>
            </div>
            {o.fulfillment_type === "pickup" && <span className="badge badge--info">pickup</span>}
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
    </DashboardShell>
  );
}
