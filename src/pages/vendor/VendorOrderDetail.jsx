import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import client, { imageUrl } from "../../api/client";
import DashboardShell from "../../components/DashboardShell";
import { ListSkeleton } from "../../components/ListState";
import { useToast } from "../../context/ToastContext";
import { kes, ORDER_STEPS as STEPS, vendorTotal } from "../../utils/format";

export default function VendorOrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { toast, confirm } = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [shipping, setShipping] = useState(false); // courier form open
  const [tracking, setTracking] = useState({ courier: "", tracking_number: "" });
  const [editingTracking, setEditingTracking] = useState(false);

  const load = () => client.get(`/orders/vendor/${id}`)
    .then((res) => {
      setOrder(res.data);
      setTracking({ courier: res.data.courier || "", tracking_number: res.data.tracking_number || "" });
    })
    .catch(() => setError("Couldn't load this order."));
  useEffect(() => { load(); }, [id]);

  // "Mark shipped" from the orders list lands here with the courier form open
  useEffect(() => {
    if (location.state?.ship && order?.allowed?.includes("shipped")) setShipping(true);
  }, [location.state, order]);

  async function act(nextStatus) {
    if (nextStatus === "cancelled") {
      const ok = await confirm({
        title: `Cancel order #${order.order_no}?`,
        message: "Stock goes back on the shelf. The customer is emailed — a paid order needs a manual M-Pesa refund.",
        confirmLabel: "Cancel order",
        danger: true,
      });
      if (!ok) return;
    }
    setBusy(true);
    try {
      const payload = { status: nextStatus };
      if (nextStatus === "shipped") Object.assign(payload, tracking);
      await client.put(`/orders/${order.id}/status`, payload);
      toast(`Order marked ${nextStatus}`);
      setShipping(false);
      await load();
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't update the order", { type: "error", duration: 3000 });
    } finally {
      setBusy(false);
    }
  }

  async function saveTracking(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await client.put(`/orders/${order.id}/tracking`, tracking);
      toast("Tracking updated");
      setEditingTracking(false);
      await load();
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't save tracking", { type: "error" });
    } finally {
      setBusy(false);
    }
  }

  const back = <Link to="/vendor/orders" className="back-link">← Orders</Link>;
  if (error) return <DashboardShell area="vendor" back={back}><p className="error-text">{error}</p></DashboardShell>;
  if (!order) return <DashboardShell area="vendor" back={back}><ListSkeleton rows={3} /></DashboardShell>;

  const myTotal = vendorTotal(order);
  const isPickup = order.fulfillment_type === "pickup";
  const steps = isPickup ? ["pending", "delivered"] : STEPS;
  const stepIndex = steps.indexOf(order.status);
  const canShip = order.allowed?.includes("shipped");
  const canCancel = order.allowed?.includes("cancelled");
  const canDeliver = order.allowed?.includes("delivered");
  const hasTracking = order.courier || order.tracking_number;

  return (
    <DashboardShell area="vendor" back={back}>
      <div className="section-header" style={{ marginTop: 0 }}>
        <h2 style={{ margin: 0 }}>Order #{order.order_no}</h2>
        {isPickup && <span className="badge badge--info">pickup</span>}
        <span className={`badge badge--${order.status}`}>{order.status}</span>
      </div>
      <p className="muted" style={{ fontSize: "0.88rem" }}>
        {new Date(order.created_at || order.createdAt).toLocaleString()} · {order.customer?.name}
        {order.delivered_at && ` · delivered ${new Date(order.delivered_at).toLocaleString()}`}
      </p>

      {order.status !== "cancelled" && (
        <div className="steps">
          {steps.map((s, i) => (
            <div key={s} className={`step${i <= stepIndex ? " step--done" : ""}`}>
              <span className="step__dot" /><span className="step__label">{s}</span>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: "0.4rem 1.1rem", marginTop: "1rem" }}>
        <div className="row">
          <span className="muted">Fulfillment</span>
          <span>{isPickup ? "Pickup (direct sale)" : "Delivery"}</span>
        </div>
        {!isPickup && order.shipping_address && (
          <div className="row"><span className="muted">Deliver to</span><span>{order.shipping_address}</span></div>
        )}
        <div className="row"><span className="muted">Customer</span>
          <span>{order.customer?.name} · {order.customer_phone}</span></div>
        <div className="row"><span className="muted">Receipts go to</span><span>{order.customer_email}</span></div>
      </div>

      {!isPickup && hasTracking && !editingTracking && (
        <div className="card" style={{ padding: "0.4rem 1.1rem", marginTop: "0.75rem" }}>
          <div className="row">
            <span className="muted">Courier</span>
            <span>{order.courier || "—"}</span>
          </div>
          <div className="row" style={{ borderBottom: "none" }}>
            <span className="muted">Tracking</span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              {order.tracking_number || "—"}
              {order.status === "shipped" && (
                <button className="link-btn" onClick={() => setEditingTracking(true)}>Edit</button>
              )}
            </span>
          </div>
        </div>
      )}
      {!isPickup && editingTracking && (
        <form className="card" style={{ padding: "1.1rem", marginTop: "0.75rem" }} onSubmit={saveTracking}>
          <div className="field">
            <label htmlFor="courier-edit">Courier</label>
            <input id="courier-edit" className="input" placeholder="e.g. Fargo, G4S, Sendy"
              value={tracking.courier}
              onChange={(e) => setTracking({ ...tracking, courier: e.target.value })} />
          </div>
          <div className="field" style={{ marginTop: "0.75rem" }}>
            <label htmlFor="tracking-edit">Tracking number</label>
            <input id="tracking-edit" className="input" placeholder="Waybill / tracking ref"
              value={tracking.tracking_number}
              onChange={(e) => setTracking({ ...tracking, tracking_number: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.9rem" }}>
            <button className="btn btn--primary btn--sm" type="submit" disabled={busy}>Save</button>
            <button type="button" className="btn btn--ghost btn--sm"
              onClick={() => setEditingTracking(false)}>Cancel</button>
          </div>
        </form>
      )}

      <h2 className="section-title" style={{ marginTop: "1.5rem" }}>Your items</h2>
      <div className="stack">
        {order.items.map((i) => (
          <div key={i.id} className="card cart-item">
            <div className="cart-item__thumb">
              {i.product?.image_url
                ? <img src={imageUrl(i.product.image_url)} alt="" loading="lazy" />
                : "📦"}
            </div>
            <div className="cart-item__info">
              <span className="cart-item__name">{i.product?.name || "Removed product"}</span>
              <span className="muted">{i.quantity} × {kes(i.unit_price)}</span>
            </div>
            <span className="cart-item__total">{kes(Number(i.unit_price) * i.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <span className="muted">Your earnings from this order</span>
        <strong>{kes(myTotal)}</strong>
      </div>

      {/* Ship form: courier + tracking captured inline, both optional */}
      {canShip && shipping && (
        <form className="card" style={{ padding: "1.1rem", marginTop: "1rem" }}
          onSubmit={(e) => { e.preventDefault(); act("shipped"); }}>
          <p className="muted" style={{ margin: "0 0 0.75rem", fontSize: "0.88rem" }}>
            Optional — the customer sees these on their order page and in the shipping email.
          </p>
          <div className="field">
            <label htmlFor="courier">Courier</label>
            <input id="courier" className="input" placeholder="e.g. Fargo, G4S, Sendy"
              value={tracking.courier}
              onChange={(e) => setTracking({ ...tracking, courier: e.target.value })} />
          </div>
          <div className="field" style={{ marginTop: "0.75rem" }}>
            <label htmlFor="tracking">Tracking number</label>
            <input id="tracking" className="input" placeholder="Waybill / tracking ref"
              value={tracking.tracking_number}
              onChange={(e) => setTracking({ ...tracking, tracking_number: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.9rem" }}>
            <button className="btn btn--primary" type="submit" disabled={busy}>
              {busy ? "Saving..." : "Confirm shipped"}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setShipping(false)}>Back</button>
          </div>
        </form>
      )}

      {!shipping && (canShip || canDeliver || canCancel) && (
        <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem", flexWrap: "wrap" }}>
          {canShip && (
            <button className="btn btn--primary" disabled={busy} onClick={() => setShipping(true)}>
              Mark as shipped
            </button>
          )}
          {canDeliver && (
            <button className="btn btn--primary" disabled={busy} onClick={() => act("delivered")}>
              Mark as delivered
            </button>
          )}
          {canCancel && (
            <button className="btn btn--ghost" disabled={busy} onClick={() => act("cancelled")}>
              Cancel order
            </button>
          )}
        </div>
      )}
      {order.status === "pending" && (
        <p className="muted" style={{ fontSize: "0.85rem", marginTop: "1rem" }}>
          Waiting for the customer's M-Pesa payment — you can act once it's paid.
        </p>
      )}
    </DashboardShell>
  );
}
