import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client, { imageUrl } from "../../api/client";
import DashboardTabs from "../../components/DashboardTabs";
import { VENDOR_TABS } from "./VendorOrders";

export default function VendorProducts() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    client.get("/products/vendor/mine", { params: { page } })
      .then((res) => { setData(res.data); setError(""); })
      .catch(() => setError("Couldn't load products."));
  }, [page]);

  const products = data?.data || [];

  return (
    <div className="page">
      <h1>Selling on Fidus</h1>
      <DashboardTabs base="/vendor" tabs={VENDOR_TABS} />

      <div className="section-header" style={{ marginTop: "1.25rem" }}>
        <h2>Products{data ? ` (${data.total})` : ""}</h2>
        <Link to="/vendor/products/new" className="btn btn--primary btn--sm">Add product</Link>
      </div>

      {error && <p className="error-text" style={{ marginTop: "1rem" }}>{error}</p>}
      {data && products.length === 0 && (
        <p className="muted" style={{ marginTop: "1rem" }}>
          No products yet — add your first one to start selling.
        </p>
      )}

      <div className="stack" style={{ marginTop: "0.5rem" }}>
        {products.map((p) => (
          <Link key={p.id} to={`/vendor/products/${p.id}/edit`} className="card order-card">
            <div className="cart-item__thumb" style={{ width: 48, height: 48 }}>
              {p.image_url ? <img src={imageUrl(p.image_url)} alt="" loading="lazy" /> : "📦"}
            </div>
            <div className="order-card__main">
              <strong>{p.name}</strong>
              <span className="muted">
                {p.category || "Uncategorised"} · KES {Number(p.price).toLocaleString()} · {p.stock} in stock
              </span>
            </div>
            {!p.is_active && <span className="badge badge--cancelled">hidden</span>}
            {p.stock === 0 && p.is_active && <span className="badge">out of stock</span>}
          </Link>
        ))}
      </div>

      {data?.pages > 1 && (
        <div className="pagination">
          <button className="btn btn--ghost btn--sm" disabled={page <= 1}
            onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="muted">{page} / {data.pages}</span>
          <button className="btn btn--ghost btn--sm" disabled={page >= data.pages}
            onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
