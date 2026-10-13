import { useState } from "react";
import useStoreConfig from "../hooks/useStoreConfig";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import CartLine from "../components/CartLine";
import { useToast } from "../context/ToastContext";
import { pollPaymentStatus } from "../utils/payment";

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customer_email: user?.email || "",
    customer_phone: "",
    town: "",
    address_detail: "",
  });
  const [status, setStatus] = useState("idle"); // idle | placing | awaiting-payment | error | paid | failed
  const [message, setMessage] = useState("");
  const config = useStoreConfig();
  const zones = config?.zones || [];
  const freeMin = config?.freeMin || 0;

  async function pollPayment(orderId) {
    const result = await pollPaymentStatus(orderId);
    if (result.payment === "failed") return "failed";
    return result.status;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("placing");
    setMessage("");
    try {
      const { data: order } = await client.post("/orders", {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        town: form.town,
        shipping_address: `${form.town} — ${form.address_detail}`,
      });

      setStatus("awaiting-payment");
      await client.post(`/payments/pay/${order.id}`);

      const result = await pollPayment(order.id);
      if (result === "paid") {
        clearCart();
        setStatus("paid");
        setMessage("Payment confirmed — thank you!");
        toast("Payment confirmed — thank you!");
        navigate(`/orders/${order.id}`);
      } else if (result === "cancelled") {
        setStatus("failed");
        setMessage("Payment was cancelled or timed out. You can try again.");
      } else if (result === "failed") {
        clearCart();
        setStatus("failed");
        setMessage(
          "That payment didn't go through. Your order is saved — retry payment from its page."
        );
        setTimeout(() => navigate(`/orders/${order.id}`), 2500);
      } else {
        setStatus("failed");
        setMessage("No confirmation received — you can track the order below.");
        clearCart();
        setTimeout(() => navigate(`/orders/${order.id}`), 2500);
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  }

  const busy = status === "placing" || status === "awaiting-payment" || status === "paid";

  if (items.length === 0 && status === "idle") {
    return (
      <div className="page empty-state">
        <h1>Nothing to check out</h1>
        <p className="muted">Your cart is empty.</p>
        <Link to="/" className="btn btn--primary">
          Browse products
        </Link>
      </div>
    );
  }

  const zone = zones.find((z) => z.town === form.town);
  const freeShip = freeMin > 0 && subtotal >= freeMin;
  const shipping = !zone ? null : freeShip ? 0 : zone.fee;
  const total = shipping == null ? null : subtotal + shipping;

  return (
    <div className="page page--wide">
      <h1>Checkout</h1>
      <div className="checkout-grid">
        <section>
          <h2 className="section-title">Your items</h2>
          <div className="stack">
            {items.map((item) => (
              <CartLine key={item.productId} item={item} disabled={busy} />
            ))}
          </div>
        </section>

        <aside className="checkout-aside">
          <div className="card summary-card">
            <div className="row">
              <span className="muted">Subtotal</span>
              <span>KES {subtotal.toLocaleString()}</span>
            </div>
            <div className="row">
              <span className="muted">Shipping{form.town ? ` · ${form.town}` : ""}</span>
              <span>
                {shipping == null
                  ? "Pick a town"
                  : shipping === 0
                    ? "Free"
                    : `KES ${shipping.toLocaleString()}`}
              </span>
            </div>
            <div className="row row--total">
              <span>Total</span>
              <span>{total == null ? "…" : `KES ${total.toLocaleString()}`}</span>
            </div>
          </div>

          <form className="form form--full" onSubmit={handleSubmit}>
            <h2 className="section-title">Delivery & payment</h2>
            <div className="field">
              <label htmlFor="co-email">Email for receipt</label>
              <input
                id="co-email"
                className="input"
                type="email"
                required
                autoComplete="email"
                value={form.customer_email}
                onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="co-phone">M-Pesa number</label>
              <input
                id="co-phone"
                className="input"
                type="tel"
                inputMode="tel"
                required
                autoComplete="tel"
                placeholder="07XX XXX XXX"
                value={form.customer_phone}
                onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
              />
              <p className="field__hint">We'll send the payment prompt to this number.</p>
            </div>
            <div className="field">
              <label htmlFor="co-town">Delivery town</label>
              <select
                id="co-town"
                className="input"
                required
                value={form.town}
                onChange={(e) => setForm({ ...form, town: e.target.value })}
              >
                <option value="">Select a town</option>
                {zones.map((z) => (
                  <option key={z.town} value={z.town}>
                    {z.town}
                    {freeShip || z.fee === 0 ? " — free" : ` — KES ${z.fee.toLocaleString()}`}
                  </option>
                ))}
              </select>
              {freeMin > 0 && (
                <p className="field__hint">
                  {freeShip
                    ? "Your order qualifies for free delivery."
                    : `Free delivery on orders over KES ${freeMin.toLocaleString()} — you're KES ${(freeMin - subtotal).toLocaleString()} away.`}
                </p>
              )}
            </div>
            <div className="field">
              <label htmlFor="co-address">Address details</label>
              <input
                id="co-address"
                className="input"
                required
                autoComplete="street-address"
                placeholder="Estate / street / building / landmark"
                value={form.address_detail}
                onChange={(e) => setForm({ ...form, address_detail: e.target.value })}
              />
            </div>
            <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
              {status === "placing"
                ? "Placing order..."
                : status === "awaiting-payment"
                  ? "Check your phone for the M-Pesa prompt..."
                  : status === "paid"
                    ? "Payment confirmed"
                    : total == null
                      ? "Pay with M-Pesa"
                      : `Pay KES ${total.toLocaleString()} with M-Pesa`}
            </button>
            {status === "awaiting-payment" && (
              <div className="pay-wait" role="status" aria-live="polite">
                <span className="spinner" aria-hidden="true" />
                <div>
                  <strong>Check your phone</strong>
                  <p>
                    Enter your M-Pesa PIN on the prompt sent to{" "}
                    {form.customer_phone || "your phone"}. This page updates on its own — no need to
                    refresh.
                  </p>
                </div>
              </div>
            )}
            {status === "paid" && <p className="notice">{message}</p>}
            {(status === "error" || status === "failed") && <p className="error-text">{message}</p>}
            {status === "idle" && (
              <p className="field__hint" style={{ textAlign: "center" }}>
                Secure payment via M-Pesa · No card needed
              </p>
            )}
          </form>
        </aside>
      </div>
    </div>
  );
}
