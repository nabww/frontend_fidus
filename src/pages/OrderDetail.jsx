import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import client, { imageUrl } from "../api/client";
import { useToast } from "../context/ToastContext";

const STEPS = ["pending", "paid", "shipped", "delivered"];

export default function OrderDetail() {
  const { id } = useParams();
  const { toast, confirm } = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [paying, setPaying] = useState(false);

  async function payNow() {
    setPaying(true);
    setError("");
    try {
      await client.post(`/payments/pay/${order.id}`);
      // Poll until Daraja confirms (or the callback lands first)
      const deadline = Date.now() + 90_000;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 3000));
        const { data } = await client.get(`/payments/status/${order.id}`);
        if (data.status !== "pending") {
          setOrder((o) => ({ ...o, status: data.status }));
          if (data.status === "paid") toast("Payment confirmed");
          else toast("Payment was cancelled or timed out", { type: "error" });
          return;
        }
      }
      setError("Still awaiting confirmation — check back shortly.");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't initiate payment.");
    } finally {
      setPaying(false);
    }
  }

  useEffect(() => {
    client.get(`/orders/${id}`)
      .then((res) => setOrder(res.data))
      .catch(() => setError("Order not found."));
  }, [id]);

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

  if (error && !order) return <div className="page"><p className="error-text">{error}</p></div>;
  if (!order) return <div className="page"><p className="muted">Loading...</p></div>;

  const stepIndex = STEPS.indexOf(order.status);
  const cancelled = order.status === "cancelled";

  return (
    <div className="page">
      <div className="section-header" style={{ marginTop: 0 }}>
        <h1 style={{ margin: 0 }}>Order #{order.id}</h1>
        <span className={`badge badge--${order.status}`}>{order.status}</span>
      </div>
      <p className="muted">
        Placed {new Date(order.created_at || order.createdAt).toLocaleString()}
        {order.mpesa_receipt && ` · M-Pesa receipt ${order.mpesa_receipt}`}
        {order.delivered_at && ` · delivered ${new Date(order.delivered_at).toLocaleString()}`}
      </p>

      {(order.courier || order.tracking_number) && (
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
        <p className="notice">This order was cancelled and its stock released.</p>
      ) : (
        <div className="steps">
          {STEPS.map((step, i) => (
            <div key={step} className={`step ${i <= stepIndex ? "step--done" : ""}`}>
              <span className="step__dot" />
              <span className="step__label">{step}</span>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ marginTop: "1.75rem", marginBottom: "0.5rem" }}>Items</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {order.items?.map((item) => (
          <div key={item.id} className="card cart-item">
            <div className="cart-item__thumb">
              {item.product?.image_url
                ? <img src={imageUrl(item.product.image_url)} alt={item.product.name} />
                : "◆"}
            </div>
            <div className="cart-item__info">
              <span className="cart-item__name">{item.product?.name || `Product #${item.product_id}`}</span>
              <span className="muted">× {item.quantity} @ KES {Number(item.unit_price).toLocaleString()}</span>
            </div>
            <span className="cart-item__total">
              KES {(item.unit_price * item.quantity).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: "1.1rem", marginTop: "1.25rem" }}>
        <div className="row"><span className="muted">Subtotal</span><span>KES {Number(order.subtotal).toLocaleString()}</span></div>
        <div className="row"><span className="muted">Shipping</span><span>KES {Number(order.shipping_cost).toLocaleString()}</span></div>
        <div className="row" style={{ borderBottom: "none", fontWeight: 600 }}>
          <span>Total</span><span>KES {Number(order.total).toLocaleString()}</span>
        </div>
      </div>

      <p className="muted" style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
        Ships to: {order.shipping_address}
      </p>

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        {order.status === "pending" && (
          <button className="btn btn--primary" onClick={payNow} disabled={paying}>
            {paying ? "Check your phone..." : "Pay with M-Pesa"}
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
