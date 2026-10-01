import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import CartLine from "../components/CartLine";
import { useToast } from "../context/ToastContext";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 90_000;

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
  const [shipping, setShipping] = useState(null);
  const [towns, setTowns] = useState([]);

  useEffect(() => {
    client.get("/config").then((res) => {
      setShipping(res.data.shippingFlatRate);
      setTowns(res.data.shippingTowns || []);
    });
  }, []);

  async function pollPayment(orderId) {
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      const { data } = await client.get(`/payments/status/${orderId}`);
      if (data.status !== "pending") return data.status;
    }
    return "pending";
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
        <Link to="/" className="btn btn--primary">Browse products</Link>
      </div>
    );
  }

  const total = shipping == null ? null : subtotal + shipping;

  return (
    <div className="page page--wide">
      <h1>Checkout</h1>
      <div className="checkout-grid">
        <section>
          <h2 className="section-title">Your items</h2>
          <div className="stack">
            {items.map((item) => <CartLine key={item.productId} item={item} disabled={busy} />)}
          </div>
        </section>

        <aside className="checkout-aside">
          <div className="card summary-card">
            <div className="row"><span className="muted">Subtotal</span><span>KES {subtotal.toLocaleString()}</span></div>
            <div className="row"><span className="muted">Shipping</span><span>{shipping == null ? "…" : `KES ${shipping}`}</span></div>
            <div className="row row--total">
              <span>Total</span><span>{total == null ? "…" : `KES ${total.toLocaleString()}`}</span>
            </div>
          </div>

          <form className="form form--full" onSubmit={handleSubmit}>
            <h2 className="section-title">Delivery & payment</h2>
            <div className="field">
              <label htmlFor="co-email">Email for receipt</label>
              <input id="co-email" className="input" type="email" required autoComplete="email"
                value={form.customer_email}
                onChange={(e) => setForm({ ...form, customer_email: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="co-phone">M-Pesa number</label>
              <input id="co-phone" className="input" type="tel" inputMode="tel" required autoComplete="tel"
                placeholder="07XX XXX XXX"
                value={form.customer_phone}
                onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="co-town">Delivery town</label>
              <select id="co-town" className="input" required value={form.town}
                onChange={(e) => setForm({ ...form, town: e.target.value })}>
                <option value="">Select a town</option>
                {towns.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="co-address">Address details</label>
              <input id="co-address" className="input" required autoComplete="street-address"
                placeholder="Estate / street / building / landmark"
                value={form.address_detail}
                onChange={(e) => setForm({ ...form, address_detail: e.target.value })} />
            </div>
            <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
              {status === "placing"
                ? "Placing order..."
                : status === "awaiting-payment"
                  ? "Check your phone for the M-Pesa prompt..."
                  : status === "paid"
                    ? "Payment confirmed"
                    : total == null ? "Pay with M-Pesa" : `Pay KES ${total.toLocaleString()} with M-Pesa`}
            </button>
            {status === "paid" && <p className="notice">{message}</p>}
            {(status === "error" || status === "failed") && <p className="error-text">{message}</p>}
          </form>
        </aside>
      </div>
    </div>
  );
}
