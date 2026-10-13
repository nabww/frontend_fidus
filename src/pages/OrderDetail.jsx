import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import client, { imageUrl } from "../api/client";
import { useToast } from "../context/ToastContext";
import { kes, ORDER_STEPS as STEPS } from "../utils/format";
import { pollPaymentStatus } from "../utils/payment";

export default function OrderDetail() {
  const { id } = useParams();
  const { toast, confirm } = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [paying, setPaying] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function payNow() {
    setPaying(true);
    setError("");
    try {
      const { data: init } = await client.post(`/payments/pay/${order.id}`);
      if (init.alreadyPaid) {
        setOrder((o) => ({ ...o, status: "paid" }));
        toast("Payment confirmed");
        return;
      }
      const result = await pollPaymentStatus(order.id);
      if (result.status !== "pending") {
        setOrder((o) => ({ ...o, status: result.status }));
        if (result.status === "paid") toast("Payment confirmed");
        else toast("Payment was cancelled or timed out", { type: "error" });
      } else if (result.payment === "failed") {
        setError(`${result.reason || "That payment attempt didn't go through"}. You can try again.`);
      } else {
        setError("Still awaiting confirmation — check back shortly.");
      }
    } catch (err) {
      if (err.response?.status === 409) {
        // A prompt is already live on the customer's phone — don't re-push, just wait
        setError("A payment prompt is already on your phone — complete it there.");
      } else {
        setError(err.response?.data?.message || "Couldn't initiate payment.");
      }
    } finally {
      setPaying(false);
    }
  }

  useEffect(() => {
    client.get(`/orders/${id}`)
      .then((res) => setOrder(res.data))
      .catch(() => setError("Order not found."));
  }, [id]);

  // While a payment prompt is outstanding, keep polling OUR api — the server-side
  // reconciler is the one talking to Daraja, so the page settles whenever it does
  useEffect(() => {
    if (order?.status !== "pending" || !order.checkout_request_id) return;
    const t = setInterval(() => {
      client.get(`/orders/${id}`).then((res) => {
        if (res.data.status !== "pending") {
          setOrder(res.data);
          toast("Payment confirmed — thank you!");
        }
      }).catch(() => {});
    }, 10_000);
    return () => clearInterval(t);
  }, [order?.status, order?.checkout_request_id, id]);

  async function cancel() {
    const ok = await confirm({
      title: "Cancel this order?",
      message: "The items will be released back to stock. This can't be undone.",
      confirmLabel: "Cancel order",
      cancelLabel: "Keep order",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      const { data } = await client.post(`/orders/${id}/cancel`);
      setOrder((o) => ({ ...o, status: data.status }));
      toast("Order cancelled");
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't cancel the order.", { type: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function confirmReceived() {
    const ok = await confirm({
      title: "Confirm delivery?",
      message: "Only confirm once the items are actually in your hands — this releases payment to the vendor.",
      confirmLabel: "I received it",
      cancelLabel: "Not yet",
    });
    if (!ok) return;
    setConfirming(true);
    try {
      const { data } = await client.post(`/orders/${id}/confirm-delivery`);
      setOrder((o) => ({ ...o, status: data.status }));
      toast("Delivery confirmed — enjoy!");
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't confirm delivery.", { type: "error" });
    } finally {
      setConfirming(false);
    }
  }

  if (error && !order) return <div className="page"><p className="error-text">{error}</p></div>;
  if (!order) return <div className="page"><p className="muted">Loading...</p></div>;

  const isPickup = order.fulfillment_type === "pickup";
  const steps = isPickup ? ["pending", "delivered"] : STEPS;
  const stepIndex = steps.indexOf(order.status);
  const cancelled = order.status === "cancelled";

  return (
    <div className="page">
      <div className="section-header" style={{ marginTop: 0 }}>
        <h1 style={{ margin: 0 }}>Order #{order.order_no}</h1>
        {isPickup && <span className="badge badge--info">pickup</span>}
        <span className={`badge badge--${order.status}`}>{order.status}</span>
      </div>
      <p className="muted">
        Placed {new Date(order.created_at || order.createdAt).toLocaleString()}
        {order.mpesa_receipt && ` · M-Pesa receipt ${order.mpesa_receipt}`}
        {order.delivered_at && ` · delivered ${new Date(order.delivered_at).toLocaleString()}`}
      </p>

      {!isPickup && (order.courier || order.tracking_number) && (
        <div className="card" style={{ padding: "0.4rem 1.1rem", marginTop: "1rem" }}>
          <div className="row">
            <span className="muted">Courier</span>
            <span>{order.courier || "—"}</span>
          </div>
          <div className="row" style={{ borderBottom: "none" }}>
            <span className="muted">Tracking number</span>
            <span>{order.tracking_number || "—"}</span>
          </div>
        </div>
      )}

      {cancelled ? (
        <p className="notice">
          This order was cancelled and its stock released.
          {order.refund_status === "due" && " Your refund is being processed."}
          {order.refund_status === "paid" && ` Your refund was sent${order.refund_reference ? ` (${order.refund_reference})` : ""}.`}
        </p>
      ) : (
        <div className="steps">
          {steps.map((step, i) => (
            <div key={step} className={`step ${i <= stepIndex ? "step--done" : ""}`}>
              <span className="step__dot" />
              <span className="step__label">{step}</span>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ marginTop: "1.75rem", marginBottom: "0.5rem" }}>Items</h2>
      <div className="item-grid">
        {order.items?.map((item) => (
          <div key={item.id} className="card item-card">
            <div className="item-card__image">
              {item.product?.image_url
                ? <img src={imageUrl(item.product.image_url)} alt={item.product.name} loading="lazy" />
                : <span aria-hidden="true">◆</span>}
              {item.quantity > 1 && <span className="item-tile__qty">×{item.quantity}</span>}
            </div>
            <div className="item-card__body">
              <span className="item-card__name">{item.product?.name || "Item"}</span>
              <span className="muted item-card__meta">
                {item.quantity} × KES {Number(item.unit_price).toLocaleString()}
              </span>
              <strong>KES {(item.unit_price * item.quantity).toLocaleString()}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: "1.1rem", marginTop: "1.25rem" }}>
        <div className="row"><span className="muted">Subtotal</span><span>KES {Number(order.subtotal).toLocaleString()}</span></div>
        {!isPickup && (
          <div className="row"><span className="muted">Shipping</span><span>KES {Number(order.shipping_cost).toLocaleString()}</span></div>
        )}
        <div className="row" style={{ borderBottom: "none", fontWeight: 600 }}>
          <span>Total</span><span>KES {Number(order.total).toLocaleString()}</span>
        </div>
      </div>

      {isPickup ? (
        <p className="muted" style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
          Pickup — collected at the vendor
        </p>
      ) : order.shipping_address && (
        <p className="muted" style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
          Ships to: {order.shipping_address}
        </p>
      )}

      {order.status === "shipped" && (
        <div className="card" style={{ padding: "1rem 1.1rem", marginTop: "1rem" }}>
          <p style={{ margin: "0 0 0.75rem" }}>
            <strong>Has your order arrived?</strong>{" "}
            <span className="muted">Confirming tells us the vendor delivered — and releases their payment.</span>
          </p>
          <button className="btn btn--primary" onClick={confirmReceived} disabled={confirming}>
            {confirming ? "Confirming..." : "Yes, I received my order"}
          </button>
        </div>
      )}

      {order.status === "pending" && order.checkout_request_id && (
        <p className="notice" style={{ marginTop: "1rem" }}>
          A payment prompt was sent to your phone — this page updates automatically once M-Pesa confirms.
        </p>
      )}

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        {order.status === "pending" && (
          <button className="btn btn--primary" onClick={payNow} disabled={paying}>
            {paying ? "Check your phone..." : order.checkout_request_id ? "Check payment status" : "Pay with M-Pesa"}
          </button>
        )}
        {["pending", "paid"].includes(order.status) && (
          <button className="btn btn--ghost" onClick={cancel} disabled={busy}>
            {busy ? "Cancelling..." : "Cancel order"}
          </button>
        )}
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
