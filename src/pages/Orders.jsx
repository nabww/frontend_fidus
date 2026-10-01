import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";

const STATUS_LABELS = {
  pending: "Awaiting payment",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    client.get("/orders/mine")
      .then((res) => setOrders(res.data))
      .catch(() => setError("Couldn't load your orders."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <h1>My orders</h1>
      {loading && <p className="muted">Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && orders.length === 0 && (
        <>
          <p className="muted">No orders yet.</p>
          <Link to="/" className="btn btn--ghost" style={{ marginTop: "1rem" }}>Browse products</Link>
        </>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
        {orders.map((o) => (
          <Link key={o.id} to={`/orders/${o.id}`} className="card order-card">
            <div className="order-card__main">
              <strong>Order #{o.id}</strong>
              <span className="muted">
                {new Date(o.created_at || o.createdAt).toLocaleDateString()} ·{" "}
                {o.items?.length || 0} item{o.items?.length === 1 ? "" : "s"}
              </span>
            </div>
            <span className={`badge badge--${o.status}`}>{STATUS_LABELS[o.status] || o.status}</span>
            <span className="order-card__total">KES {Number(o.total).toLocaleString()}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
