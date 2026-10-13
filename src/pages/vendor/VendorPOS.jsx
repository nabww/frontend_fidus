import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import client, { imageUrl } from "../../api/client";
import DashboardShell from "../../components/DashboardShell";
import SearchBox from "../../components/SearchBox";
import { ListSkeleton } from "../../components/ListState";
import { useToast } from "../../context/ToastContext";
import useDebounced from "../../hooks/useDebounced";
import useList from "../../hooks/useList";
import useStoreConfig from "../../hooks/useStoreConfig";
import { kes } from "../../utils/format";

export default function VendorPOS() {
  const { toast } = useToast();
  const config = useStoreConfig();
  const zones = config?.zones || [];
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const q = useDebounced(query).trim();
  const { data } = useList("/products/vendor/mine", { q: q || undefined, limit: 50 });
  const products = (data?.data || []).filter((p) => p.is_active && p.stock > 0);

  const [cart, setCart] = useState([]);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fulfillment, setFulfillment] = useState("pickup"); // pickup | delivery
  const [town, setTown] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [preloaded, setPreloaded] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | placing | paying | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Auto-add product if opened via ?product=<id> (e.g. from "Sell this item")
  useEffect(() => {
    if (preloaded || !products.length) return;
    const pid = searchParams.get("product");
    if (!pid) return;
    const p = products.find((x) => x.id === pid);
    if (p && !cart.find((c) => c.productId === p.id)) {
      setCart([
        {
          productId: p.id,
          name: p.name,
          price: Number(p.effective_price ?? p.price),
          image_url: p.image_url,
          stock: p.stock,
          quantity: 1,
        },
      ]);
    }
    setPreloaded(true);
    setSearchParams({}, { replace: true }); // clean up the URL
  }, [products, preloaded, searchParams, setSearchParams, cart]);

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const isDelivery = fulfillment === "delivery";
  const zone = isDelivery ? zones.find((z) => z.town === town) : null;
  const freeShip = isDelivery && config?.freeMin > 0 && subtotal >= config.freeMin;
  const shipping = isDelivery ? (freeShip ? 0 : (zone?.fee ?? null)) : 0;
  const total = subtotal + (shipping || 0);

  function addToCart(product) {
    setCart((c) => {
      const existing = c.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast("No more stock available", { type: "error" });
          return c;
        }
        return c.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...c,
        {
          productId: product.id,
          name: product.name,
          price: Number(product.effective_price ?? product.price),
          image_url: product.image_url,
          stock: product.stock,
          quantity: 1,
        },
      ];
    });
  }

  function updateQty(productId, qty) {
    if (qty < 1) return removeFromCart(productId);
    setCart((c) => c.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)));
  }

  function removeFromCart(productId) {
    setCart((c) => c.filter((i) => i.productId !== productId));
  }

  function reset() {
    setCart([]);
    setPhone("");
    setFulfillment("pickup");
    setTown("");
    setAddressDetail("");
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
  }

  async function handleSale(e) {
    e.preventDefault();
    if (!cart.length) return toast("Add products to the sale", { type: "error" });
    if (!phone.trim()) return toast("Enter the customer's M-Pesa number", { type: "error" });
    if (isDelivery && !town) return toast("Select a delivery town", { type: "error" });
    if (isDelivery && !addressDetail.trim())
      return toast("Enter the delivery address", { type: "error" });

    setStatus("placing");
    setErrorMsg("");

    try {
      const payload = {
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        customer_phone: phone,
        fulfillment_type: fulfillment,
      };
      if (email.trim()) payload.customer_email = email.trim();
      if (isDelivery) {
        payload.town = town;
        payload.shipping_address = `${town} — ${addressDetail.trim()}`;
      }
      const { data: res } = await client.post("/pos/orders", payload);

      setResult(res);

      if (res.stkError) {
        setStatus("error");
        setErrorMsg(res.stkError);
        toast("Order created but payment prompt failed", { type: "error" });
        return;
      }

      setStatus("paying");
      toast("STK push sent — waiting for customer to pay");

      const payResult = await pollPaymentStatus(res.order.id);
      if (payResult.status === "delivered" || payResult.status === "paid") {
        setStatus("done");
        toast("Payment confirmed — sale complete", { type: "success" });
      } else if (payResult.payment === "failed") {
        setStatus("error");
        setErrorMsg(payResult.reason || "Customer cancelled or timed out");
        toast("Payment failed — you can retry", { type: "error" });
      } else {
        setStatus("error");
        setErrorMsg("Still waiting for payment confirmation");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.response?.data?.message || "Something went wrong");
      toast(err.response?.data?.message || "Failed to create the sale", { type: "error" });
    }
  }

  async function retryPayment() {
    if (!result?.order?.id) return;
    setStatus("paying");
    setErrorMsg("");
    try {
      const { data: res } = await client.post(`/pos/orders/${result.order.id}/pay`);
      if (res.alreadyPaid) {
        setStatus("done");
        toast("Payment already confirmed", { type: "success" });
        return;
      }
      toast("STK push sent again");
      const payResult = await pollPaymentStatus(result.order.id, "/pos/orders");
      if (payResult.status === "delivered" || payResult.status === "paid") {
        setStatus("done");
        toast("Payment confirmed — sale complete", { type: "success" });
      } else if (payResult.payment === "failed") {
        setStatus("error");
        setErrorMsg(payResult.reason || "Customer cancelled or timed out");
      } else {
        setStatus("error");
        setErrorMsg("Still waiting for confirmation");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.response?.data?.message || "Retry failed");
    }
  }

  // Payment polling for POS uses the POS-specific endpoint
  async function pollPaymentStatus(orderId) {
    const deadline = Date.now() + 120_000; // outlast the ~90s STK prompt lifetime
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 3000));
      const { data: d } = await client.get(`/pos/orders/${orderId}/payment-status`);
      if (d.status !== "pending" || d.payment === "failed") return d;
    }
    return { status: "pending", timedOut: true };
  }

  if (status === "done") {
    return (
      <DashboardShell area="vendor">
        <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
          <h2 style={{ color: "var(--accent)", marginBottom: "0.5rem" }}>Sale Complete</h2>
          <p className="muted">
            Order #{result?.order?.order_no} — {kes(result?.order?.total)}
          </p>
          <button className="btn btn--primary" style={{ marginTop: "1rem" }} onClick={reset}>
            New Sale
          </button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell area="vendor">
      <div className="pos-layout">
        <div className="pos-products">
          <SearchBox value={query} onChange={setQuery} placeholder="Search your products" />
          {!data && <ListSkeleton />}
          <div className="pos-grid">
            {products.map((p) => (
              <button
                key={p.id}
                className="card pos-product-card"
                onClick={() => addToCart(p)}
                disabled={status !== "idle"}
              >
                <div className="pos-product-img">
                  {p.image_url ? (
                    <img src={imageUrl(p.image_url)} alt="" loading="lazy" />
                  ) : (
                    <span className="muted">No image</span>
                  )}
                </div>
                <div className="pos-product-info">
                  <strong className="truncate">{p.name}</strong>
                  <span className="muted">
                    {p.discount_active ? (
                      <>
                        <span className="price--old">{kes(p.price)}</span> {kes(p.effective_price)}
                      </>
                    ) : (
                      kes(p.price)
                    )}{" "}
                    · {p.stock} left
                  </span>
                </div>
              </button>
            ))}
            {data && products.length === 0 && (
              <p
                className="muted"
                style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem 0" }}
              >
                {q ? "No matching products" : "No products in stock"}
              </p>
            )}
          </div>
        </div>

        <form className="pos-cart" onSubmit={handleSale}>
          <h3 className="pos-cart__title">Current Sale</h3>
          {cart.length === 0 && (
            <p className="muted" style={{ padding: "1rem 0", textAlign: "center" }}>
              Tap a product to add it
            </p>
          )}
          <div className="pos-cart__items">
            {cart.map((item) => (
              <div key={item.productId} className="pos-cart__item">
                <div className="pos-cart__item-info">
                  <strong className="truncate">{item.name}</strong>
                  <span className="muted">{kes(item.price)} each</span>
                </div>
                <div className="pos-cart__item-controls">
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => updateQty(item.productId, item.quantity - 1)}
                    disabled={status !== "idle"}
                  >
                    −
                  </button>
                  <span className="pos-qty">{item.quantity}</span>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => updateQty(item.productId, item.quantity + 1)}
                    disabled={status !== "idle" || item.quantity >= item.stock}
                  >
                    +
                  </button>
                  <span className="muted" style={{ minWidth: 70, textAlign: "right" }}>
                    {kes(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {cart.length > 0 && (
            <>
              <div className="pos-cart__subtotal">
                <span>Subtotal</span>
                <span>{kes(subtotal)}</span>
              </div>

              <div className="field" style={{ margin: "0.75rem 0 0.5rem" }}>
                <label>Fulfillment</label>
                <div className="pos-fulfillment-toggle">
                  <button
                    type="button"
                    className={`btn btn--sm ${fulfillment === "pickup" ? "btn--primary" : "btn--ghost"}`}
                    onClick={() => setFulfillment("pickup")}
                    disabled={status !== "idle"}
                  >
                    Pickup
                  </button>
                  <button
                    type="button"
                    className={`btn btn--sm ${fulfillment === "delivery" ? "btn--primary" : "btn--ghost"}`}
                    onClick={() => setFulfillment("delivery")}
                    disabled={status !== "idle"}
                  >
                    Delivery
                  </button>
                </div>
              </div>

              {isDelivery && (
                <>
                  <div className="field" style={{ margin: "0.5rem 0" }}>
                    <label htmlFor="pos-town">Delivery town</label>
                    <select
                      id="pos-town"
                      className="input"
                      value={town}
                      required
                      onChange={(e) => setTown(e.target.value)}
                      disabled={status !== "idle"}
                    >
                      <option value="">Select a town</option>
                      {zones.map((z) => (
                        <option key={z.town} value={z.town}>
                          {z.town}
                          {freeShip || z.fee === 0 ? " — free" : ` — KES ${z.fee.toLocaleString()}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field" style={{ margin: "0.5rem 0" }}>
                    <label htmlFor="pos-addr">Delivery address</label>
                    <input
                      id="pos-addr"
                      className="input"
                      placeholder="Street, building, apt"
                      value={addressDetail}
                      onChange={(e) => setAddressDetail(e.target.value)}
                      disabled={status !== "idle"}
                      required
                    />
                  </div>
                  {shipping != null && (
                    <div className="pos-cart__subtotal">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? "Free" : kes(shipping)}</span>
                    </div>
                  )}
                </>
              )}

              <div className="pos-cart__total">
                <span>Total</span>
                <strong>{kes(total)}</strong>
              </div>

              <div className="field" style={{ margin: "0.75rem 0" }}>
                <label htmlFor="pos-phone">Customer M-Pesa Number</label>
                <input
                  id="pos-phone"
                  className="input"
                  type="tel"
                  placeholder="07XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={status !== "idle"}
                  required
                />
              </div>
              <div className="field" style={{ margin: "0 0 0.75rem" }}>
                <label htmlFor="pos-email">
                  Customer Email <span className="muted">(optional — for receipts)</span>
                </label>
                <input
                  id="pos-email"
                  className="input"
                  type="email"
                  placeholder="customer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status !== "idle"}
                />
              </div>
              {errorMsg && (
                <p className="error-text" style={{ margin: "0.5rem 0" }}>
                  {errorMsg}
                </p>
              )}
              {status === "idle" && (
                <button
                  type="submit"
                  className="btn btn--primary pos-pay-btn"
                  disabled={isDelivery && shipping == null}
                >
                  Send Payment Request — {kes(total)}
                </button>
              )}
              {status === "placing" && (
                <button className="btn btn--primary pos-pay-btn" disabled>
                  Creating order...
                </button>
              )}
              {status === "paying" && (
                <button className="btn btn--primary pos-pay-btn" disabled>
                  Waiting for payment...
                </button>
              )}
              {status === "error" && (
                <div className="pos-cart__actions">
                  <button type="button" className="btn btn--primary" onClick={retryPayment}>
                    Retry Payment
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={reset}>
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </form>
      </div>
    </DashboardShell>
  );
}
