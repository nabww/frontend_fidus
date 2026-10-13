import { useState } from "react";
import client from "../../api/client";
import DashboardShell from "../../components/DashboardShell";
import FilterChips from "../../components/FilterChips";
import { ListEmpty, ListSkeleton } from "../../components/ListState";
import SearchBox from "../../components/SearchBox";
import { useToast } from "../../context/ToastContext";
import useDebounced from "../../hooks/useDebounced";
import useList from "../../hooks/useList";
import { kes, shortDate } from "../../utils/format";

const FILTERS = ["", "pending", "paid", "shipped", "delivered", "cancelled", "refund due"];
const ACTION_LABELS = { shipped: "Mark shipped", delivered: "Mark delivered", cancelled: "Cancel" };
const EMPTY_TRACKING = { courier: "", tracking_number: "" };

export default function AdminOrders() {
  const { toast, confirm } = useToast();
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const q = useDebounced(query).trim();
  const {
    data: orders,
    loading,
    error,
    reload,
  } = useList("/admin/orders", {
    status: status === "refund due" ? undefined : status || undefined,
    refund: status === "refund due" ? "due" : undefined,
    q: q || undefined,
  });
  const [shipForm, setShipForm] = useState(null); // order id with the courier form open
  const [tracking, setTracking] = useState(EMPTY_TRACKING);
  const [refundForm, setRefundForm] = useState(null); // order id with the refund form open
  const [refundRef, setRefundRef] = useState("");

  async function markRefunded(order) {
    if (!refundRef.trim()) return toast("Enter the M-Pesa reversal reference", { type: "error" });
    try {
      await client.put(`/admin/orders/${order.id}/refund`, { reference: refundRef.trim() });
      toast(`Order #${order.order_no} refund recorded`);
      setRefundForm(null);
      setRefundRef("");
      reload();
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't record the refund", { type: "error" });
    }
  }

  async function act(order, nextStatus, extra = {}) {
    if (nextStatus === "cancelled") {
      const ok = await confirm({
        title: `Cancel order #${order.order_no}?`,
        message:
          "Stock goes back on the shelf and the customer is emailed. A paid order needs a manual M-Pesa refund.",
        confirmLabel: "Cancel order",
        danger: true,
      });
      if (!ok) return;
    }
    try {
      await client.put(`/orders/${order.id}/status`, { status: nextStatus, ...extra });
      toast(`Order #${order.order_no} marked ${nextStatus}`);
      setShipForm(null);
      setTracking(EMPTY_TRACKING);
      reload();
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't update the order", {
        type: "error",
        duration: 3000,
      });
    }
  }

  return (
    <DashboardShell area="admin">
      <div className="toolbar">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Order #, email, phone, receipt, tracking"
        />
        <FilterChips options={FILTERS} value={status} onChange={setStatus} />
      </div>

      {error && <p className="error-text">{error}</p>}
      {!orders && !error && <ListSkeleton />}
      {orders?.length === 0 && (
        <ListEmpty
          query={q}
          filtered={status}
          onClear={() => {
            setQuery("");
            setStatus("");
          }}
        >
          No orders yet.
        </ListEmpty>
      )}

      <div className={`stack${loading && orders ? " is-loading" : ""}`}>
        {orders?.map((o) => (
          <div key={o.id} className="card order-block">
            <div className="order-card">
              <div className="order-card__main">
                <strong>
                  #{o.order_no} · {o.customer?.name || "Customer"}
                </strong>
                <span className="muted truncate">
                  {shortDate(o.created_at || o.createdAt)} · {o.customer?.email} ·{" "}
                  {o.fulfillment_type === "pickup" ? "Pickup" : o.shipping_address}
                </span>
                <span className="muted truncate">
                  {o.items?.map((i) => `${i.quantity}× ${i.product?.name || "item"}`).join(", ")}
                  {o.mpesa_receipt && ` · ${o.mpesa_receipt}`}
                  {o.courier &&
                    ` · ${o.courier}${o.tracking_number ? ` ${o.tracking_number}` : ""}`}
                </span>
              </div>
              {o.fulfillment_type === "pickup" && <span className="badge badge--info">pickup</span>}
              {o.refund_status === "due" && <span className="badge badge--failed">refund due</span>}
              {o.refund_status === "paid" && <span className="badge badge--paid">refunded</span>}
              <span className={`badge badge--${o.status}`}>{o.status}</span>
              <span className="order-card__total">{kes(o.total)}</span>
              {o.allowed?.length > 0 && (
                <div className="order-card__actions">
                  {o.allowed.map((s) => (
                    <button
                      key={s}
                      className={`btn btn--sm ${s === "cancelled" ? "btn--ghost" : "btn--primary"}`}
                      onClick={() =>
                        s === "shipped" ? setShipForm(shipForm === o.id ? null : o.id) : act(o, s)
                      }
                    >
                      {ACTION_LABELS[s]}
                    </button>
                  ))}
                </div>
              )}
              {o.refund_status === "due" && (
                <div className="order-card__actions">
                  <button
                    className="btn btn--sm btn--primary"
                    onClick={() => setRefundForm(refundForm === o.id ? null : o.id)}
                  >
                    Mark refunded
                  </button>
                </div>
              )}
            </div>

            {/* Records the manual M-Pesa reversal reference */}
            {refundForm === o.id && (
              <form
                className="inline-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  markRefunded(o);
                }}
              >
                <div className="field">
                  <label>M-Pesa reversal reference</label>
                  <input
                    className="input"
                    placeholder="e.g. QJX7A2B3CD"
                    value={refundRef}
                    onChange={(e) => setRefundRef(e.target.value)}
                    required
                  />
                </div>
                <button className="btn btn--primary btn--sm" type="submit">
                  Confirm refunded
                </button>
              </form>
            )}

            {/* Admin ships on behalf of a vendor — same courier/tracking capture */}
            {shipForm === o.id && (
              <form
                className="inline-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  act(o, "shipped", tracking);
                }}
              >
                <div className="field">
                  <label>Courier</label>
                  <input
                    className="input"
                    placeholder="e.g. Fargo, G4S"
                    value={tracking.courier}
                    onChange={(e) => setTracking({ ...tracking, courier: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Tracking number</label>
                  <input
                    className="input"
                    placeholder="Optional"
                    value={tracking.tracking_number}
                    onChange={(e) => setTracking({ ...tracking, tracking_number: e.target.value })}
                  />
                </div>
                <button className="btn btn--primary btn--sm" type="submit">
                  Confirm shipped
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
      {orders?.length >= 200 && (
        <p className="muted list-hint">Showing the latest 200 — search to narrow down.</p>
      )}
    </DashboardShell>
  );
}
