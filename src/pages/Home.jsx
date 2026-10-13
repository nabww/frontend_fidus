import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import client, { imageUrl } from "../api/client";
import SearchBox from "../components/SearchBox";
import { kes } from "../utils/format";

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
  const [sort, setSort] = useState("recommended");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [featured, setFeatured] = useState([]);
  const browsing = !search && !category && page === 1;
  const isNew = (p) => Date.now() - new Date(p.created_at || p.createdAt) < 7 * 864e5;

  useEffect(() => {
    client.get("/products/categories").then((res) => setCategories(res.data));
  }, []);

  // The featured strip only exists while casually browsing — search and
  // category picks mean the shopper already knows what they want
  useEffect(() => {
    if (!browsing) return;
    client.get("/products", { params: { featured: 1, limit: 8 } })
      .then((res) => setFeatured(res.data.data));
  }, [browsing]);

  useEffect(() => {
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      client.get("/products", {
        params: { search, category: category || undefined, sort, page, limit: 12 },
        signal: controller.signal,
      })
        .then((res) => {
          setProducts(res.data.data);
          setPages(res.data.pages);
          setTotal(res.data.total);
          setError("");
        })
        .catch((err) => {
          if (!axios.isCancel(err)) setError("We couldn't load the shop just now.");
        })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 300); // debounce keystrokes
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, category, sort, page, retry]);

  function pickCategory(c) {
    setCategory((prev) => (prev === c ? "" : c));
    setPage(1);
  }

  function goToPage(n) {
    setPage(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="page">
      {browsing && (featured.length ? (
        <section className="featured">
          <h2 className="featured__title">Featured</h2>
          <div className="featured__row">
            {featured.map((p) => (
              <Link key={p.id} to={`/products/${p.id}`} className="featured-card">
                <div className="featured-card__image">
                  {p.image_url ? <img src={imageUrl(p.image_url)} alt={p.name} loading="lazy" /> : "◆"}
                </div>
                <p className="featured-card__name">{p.name}</p>
                <p className="featured-card__price">
                  {p.discount_active ? (
                    <><span className="price--old">{kes(p.price)}</span> {kes(p.effective_price)}</>
                  ) : kes(p.price)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="hero">
          <h2 className="hero__title">Electronics, delivered across Kenya.</h2>
          <p className="hero__sub">Pay with M-Pesa, track every step, and confirm when it arrives.</p>
          <ul className="hero__points">
            <li>M-Pesa checkout</li>
            <li>Countrywide delivery</li>
            <li>Track your order</li>
          </ul>
        </section>
      ))}

      <div className="shop-header">
        <div>
          <h1 style={{ margin: 0 }}>Shop</h1>
          <p className="muted" style={{ margin: "0.2rem 0 0", fontSize: "0.9rem" }}>
            {loading ? "…" : `${total} product${total === 1 ? "" : "s"}`}
          </p>
        </div>
        <SearchBox
          className="shop-search"
          placeholder="Search products"
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
        />
      </div>

      <div className="shop-filters">
        {categories.length > 0 && (
          <div className="chip-row">
            <button className={`chip ${!category ? "chip--active" : ""}`} onClick={() => { setCategory(""); setPage(1); }}>
              All
            </button>
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
        <select className="input shop-sort" value={sort} aria-label="Sort products"
          onChange={(e) => { setSort(e.target.value); setPage(1); }}>
          <option value="recommended">Recommended</option>
          <option value="best">Best sellers</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>

      {error && (
        <div className="empty-state" style={{ padding: "2.5rem 0" }}>
          <p className="muted">{error} Check your connection and try again.</p>
          <button className="btn btn--ghost" onClick={() => setRetry((r) => r + 1)}>Retry</button>
        </div>
      )}
      {!error && !loading && products.length === 0 && (
        <div className="empty-state" style={{ padding: "2.5rem 0" }}>
          <p className="muted">
            {search ? <>No products match “{search}”.</> : "Nothing here yet — check back soon."}
          </p>
          {(search || category) && (
            <button className="btn btn--ghost" onClick={() => { setSearch(""); setCategory(""); setPage(1); }}>
              Clear filters
            </button>
          )}
        </div>
      )}

      <div className="product-grid">
        {error ? null : loading
          ? Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)
          : products.map((p) => (
              <Link key={p.id} to={`/products/${p.id}`} className="product-card">
                <div className="product-card__image">
                  {p.image_url ? <img src={imageUrl(p.image_url)} alt={p.name} loading="lazy" /> : "◆"}
                  {p.stock === 0 && <span className="product-card__oos">Out of stock</span>}
                  {p.stock > 0 && p.discount_active && <span className="product-card__sale">-{p.discount_percent}%</span>}
                  {p.stock > 0 && !p.discount_active && isNew(p) && <span className="product-card__new">New</span>}
                </div>
                {p.category && <p className="product-card__cat">{p.category}</p>}
                <p className="product-card__name">{p.name}</p>
                <div className="product-card__meta">
                  <p className="product-card__price">
                    {p.discount_active ? (
                      <><span className="price--old">{kes(p.price)}</span> {kes(p.effective_price)}</>
                    ) : kes(p.price)}
                  </p>
                  {p.stock > 0 && p.stock <= 5 && (
                    <span className="stock-hint">Only {p.stock} left</span>
                  )}
                </div>
              </Link>
            ))}
      </div>

      {pages > 1 && (
        <div className="pagination">
          <button className="btn btn--ghost" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
            Previous
          </button>
          <span className="muted">Page {page} of {pages}</span>
          <button className="btn btn--ghost" disabled={page >= pages} onClick={() => goToPage(page + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
