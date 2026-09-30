import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";

export default function VendorDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    client.get("/products/vendor/mine").then((res) => setProducts(res.data));
    client.get("/orders/vendor").then((res) => setOrders(res.data));
  }, []);

  const pendingPayout = orders
    .filter((o) => o.Order?.payout_status === "pending")
    .reduce((sum, o) => sum + Number(o.unit_price) * o.quantity, 0);

  return (
    <div className="page">
      <h1>Vendor dashboard</h1>
      <div className="stat-cards">
        <div className="stat-card"><p>Products</p><strong>{products.length}</strong></div>
        <div className="stat-card"><p>Orders</p><strong>{orders.length}</strong></div>
        <div className="stat-card"><p>Pending payout</p><strong>KES {pendingPayout.toLocaleString()}</strong></div>
      </div>

      <div className="section-header">
        <h2>Products</h2>
        <Link to="/vendor/products/new"><button>Add product</button></Link>
      </div>
      {products.map((p) => (
        <div key={p.id} className="cart-row">
          <span>{p.name}</span>
          <span>KES {Number(p.price).toLocaleString()} · {p.stock} in stock</span>
          <Link to={`/vendor/products/${p.id}/edit`}>Edit</Link>
        </div>
      ))}
    </div>
  );
}
