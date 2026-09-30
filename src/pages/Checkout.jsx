import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { useCart } from "../context/CartContext";

const SHIPPING_FLAT_RATE = 300; // must match backend's SHIPPING_FLAT_RATE

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ customer_email: "", customer_phone: "", shipping_address: "" });
  const [status, setStatus] = useState("idle"); // idle | placing | awaiting-payment | error

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("placing");
    try {
      const { data: order } = await client.post("/orders", {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        ...form,
      });

      setStatus("awaiting-payment");
      await client.post(`/payments/pay/${order.id}`);
      clearCart();
      navigate("/"); // in a full build, redirect to an order-status page instead
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  return (
    <div className="page">
      <h1>Checkout</h1>
      <p>Subtotal: KES {subtotal.toLocaleString()}</p>
      <p>Shipping: KES {SHIPPING_FLAT_RATE}</p>
      <p><strong>Total: KES {(subtotal + SHIPPING_FLAT_RATE).toLocaleString()}</strong></p>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Email"
          type="email"
          required
          value={form.customer_email}
          onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
        />
        <input
          placeholder="M-Pesa phone number (07XX XXX XXX)"
          required
          value={form.customer_phone}
          onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
        />
        <input
          placeholder="Shipping address"
          required
          value={form.shipping_address}
          onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
        />
        <button type="submit" disabled={status === "placing" || status === "awaiting-payment"}>
          {status === "awaiting-payment" ? "Check your phone for the M-Pesa prompt..." : "Pay with M-Pesa"}
        </button>
        {status === "error" && <p>Something went wrong. Please try again.</p>}
      </form>
    </div>
  );
}
