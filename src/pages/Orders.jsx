import { useState } from "react";
import { Link } from "react-router-dom";
import ItemTiles from "../components/ItemTiles";
import { ListEmpty, ListSkeleton } from "../components/ListState";
import SearchBox from "../components/SearchBox";
import useList from "../hooks/useList";
import { kes, matches, shortDate } from "../utils/format";

const STATUS_LABELS = {
  pending: "Awaiting payment",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
const SEARCH_AFTER = 5; // search only appears once the history is long enough to need it

export default function Orders() {
  const { data: orders, error } = useList("/orders/mine");
  const [query, setQuery] = useState("");

  const shown = orders?.filter((o) =>
    matches(
      query,
      `#${o.order_no}`,
      o.status,
      STATUS_LABELS[o.status],
      o.items?.map((i) => i.product?.name).join(" ")
    )
  );

  return (
    <div className="page">
      <h1>My orders</h1>
      {orders?.length > SEARCH_AFTER && (
        <div className="toolbar">
          <SearchBox value={query} onChange={setQuery} placeholder="Order # or product" />
        </div>
      )}
      {error && <p className="error-text">{error}</p>}
      {!orders && !error && <ListSkeleton />}
      {orders?.length === 0 && (
        <div className="empty-state" style={{ padding: "2.5rem 0" }}>
          <p className="muted">No orders yet.</p>
          <Link to="/" className="btn btn--ghost">
            Browse products
          </Link>
        </div>
      )}
      {orders?.length > 0 && shown.length === 0 && (
        <ListEmpty query={query.trim()} onClear={() => setQuery("")} />
      )}
      <div className="stack">
        {shown?.map((o) => (
          <Link key={o.id} to={`/orders/${o.id}`} className="card order-tile">
            <div className="order-card">
              <div className="order-card__main">
                <strong>Order #{o.order_no}</strong>
                <span className="muted truncate">
                  {shortDate(o.created_at || o.createdAt)} ·{" "}
                  {o.items?.map((i) => `${i.quantity}× ${i.product?.name || "item"}`).join(", ")}
                </span>
              </div>
              <span className={`badge badge--${o.status}`}>
                {STATUS_LABELS[o.status] || o.status}
              </span>
              <span className="order-card__total">{kes(o.total)}</span>
            </div>
            <ItemTiles items={o.items} />
          </Link>
        ))}
      </div>
    </div>
  );
}
