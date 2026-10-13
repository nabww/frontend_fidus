import { useState } from "react";
import { Link } from "react-router-dom";
import { imageUrl } from "../../api/client";
import DashboardShell from "../../components/DashboardShell";
import { ListEmpty, ListSkeleton } from "../../components/ListState";
import SearchBox from "../../components/SearchBox";
import useDebounced from "../../hooks/useDebounced";
import useList from "../../hooks/useList";
import { kes } from "../../utils/format";

export default function VendorProducts() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const q = useDebounced(query).trim();
  const { data, loading, error } = useList("/products/vendor/mine", { page, q: q || undefined });
  const products = data?.data || [];

  return (
    <DashboardShell area="vendor">
      <div className="toolbar">
        <SearchBox
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder="Search your products"
        />
        <Link to="/vendor/products/new" className="btn btn--primary btn--sm">
          Add product
        </Link>
      </div>

      {error && <p className="error-text">{error}</p>}
      {!data && !error && <ListSkeleton />}
      {data && products.length === 0 && (
        <ListEmpty query={q} onClear={() => setQuery("")}>
          No products yet — add your first one to start selling.
        </ListEmpty>
      )}

      <div className={`stack${loading && data ? " is-loading" : ""}`}>
        {products.map((p) => (
          <Link key={p.id} to={`/vendor/products/${p.id}/edit`} className="card order-card">
            <div className="thumb">
              {p.image_url ? <img src={imageUrl(p.image_url)} alt="" loading="lazy" /> : "📦"}
            </div>
            <div className="order-card__main">
              <strong className="truncate">{p.name}</strong>
              <span className="muted">
                {p.category || "Uncategorised"} ·{" "}
                {p.discount_active ? (
                  <>
                    <span className="price--old">{kes(p.price)}</span> {kes(p.effective_price)}
                  </>
                ) : (
                  kes(p.price)
                )}{" "}
                · {p.stock} in stock
              </span>
            </div>
            {p.discount_active && (
              <span className="badge badge--accent">-{p.discount_percent}%</span>
            )}
            {p.one_of_a_kind && <span className="badge badge--info">unique</span>}
            {!p.is_active && <span className="badge badge--cancelled">hidden</span>}
            {p.stock === 0 && p.is_active && !p.one_of_a_kind && (
              <span className="badge">out of stock</span>
            )}
          </Link>
        ))}
      </div>

      {data?.pages > 1 && (
        <div className="pagination">
          <button
            className="btn btn--ghost btn--sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            ← Prev
          </button>
          <span className="muted">
            {page} / {data.pages}
          </span>
          <button
            className="btn btn--ghost btn--sm"
            disabled={page >= data.pages}
            onClick={() => setPage(page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </DashboardShell>
  );
}
