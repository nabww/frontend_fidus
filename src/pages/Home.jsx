import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client, { imageUrl } from "../api/client";

function SkeletonCard() {
  return (
    <div className="product-card product-card--skeleton">
      <div className="product-card__image shimmer" />
      <div className="shimmer" style={{ height: 14, borderRadius: 4, margin: "0.6rem 0 0.3rem", width: "75%" }} />
      <div className="shimmer" style={{ height: 12, borderRadius: 4, width: "45%" }} />
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    client.get("/products/categories").then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      client.get("/products", { params: { search, category: category || undefined, page, limit: 12 } })
        .then((res) => {
          setProducts(res.data.data);
          setPages(res.data.pages);
          setTotal(res.data.total);
          setError("");
        })
        .catch(() => setError("Couldn't load products. Is the API running?"))
        .finally(() => setLoading(false));
    }, 300); // debounce keystrokes
    return () => clearTimeout(timer);
  }, [search, category, page]);

  function pickCategory(c) {
    setCategory((prev) => (prev === c ? "" : c));
    setPage(1);
  }

  return (
    <div className="page">
      <div className="shop-header">
        <div>
          <h1 style={{ margin: 0 }}>Shop</h1>
          <p className="muted" style={{ margin: "0.2rem 0 0", fontSize: "0.9rem" }}>
            {loading ? "…" : `${total} product${total === 1 ? "" : "s"}`}
          </p>
        </div>
        <input
          className="input shop-search"
          type="search"
          placeholder="Search products"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {categories.length > 0 && (
        <div className="chip-row">
          {categories.map((c) => (
            <button
              key={c}
              className={`chip ${category === c ? "chip--active" : ""}`}
              onClick={() => pickCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {error && <p className="error-text" style={{ marginTop: "1rem" }}>{error}</p>}
      {!error && !loading && products.length === 0 && (
        <div className="empty-state" style={{ padding: "2.5rem 0" }}>
          <p className="muted">No products match your search.</p>
          {(search || category) && (
            <button className="btn btn--ghost" onClick={() => { setSearch(""); setCategory(""); setPage(1); }}>
              Clear filters
            </button>
          )}
        </div>
      )}

      <div className="product-grid">
        {loading
          ? Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)
          : products.map((p) => (
              <Link key={p.id} to={`/products/${p.id}`} className="product-card">
                <div className="product-card__image">
                  {p.image_url ? <img src={imageUrl(p.image_url)} alt={p.name} /> : "◆"}
                  {p.stock === 0 && <span className="product-card__oos">Out of stock</span>}
                </div>
                {p.category && <p className="product-card__cat">{p.category}</p>}
                <p className="product-card__name">{p.name}</p>
                <div className="product-card__meta">
                  <p className="product-card__price">KES {Number(p.price).toLocaleString()}</p>
                  {p.stock > 0 && p.stock <= 5 && (
                    <span className="stock-hint">Only {p.stock} left</span>
                  )}
                </div>
              </Link>
            ))}
      </div>

      {pages > 1 && (
        <div className="pagination">
          <button className="btn btn--ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span className="muted">Page {page} of {pages}</span>
          <button className="btn btn--ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
