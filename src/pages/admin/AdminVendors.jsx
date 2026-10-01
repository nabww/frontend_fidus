import { useState } from "react";
import { Link } from "react-router-dom";
import DashboardShell from "../../components/DashboardShell";
import { ListEmpty, ListSkeleton } from "../../components/ListState";
import SearchBox from "../../components/SearchBox";
import useList from "../../hooks/useList";
import { matches } from "../../utils/format";

export default function AdminVendors() {
  const { data, error } = useList("/admin/vendors");
  const [query, setQuery] = useState("");
  const shown = data?.vendors.filter((v) => matches(query, v.name, v.email, v.phone));

  return (
    <DashboardShell area="admin">
      <div className="toolbar">
        <SearchBox value={query} onChange={setQuery} placeholder="Name, email or phone" />
        {data && <span className="muted toolbar__count">{shown.length} of {data.vendors.length}</span>}
      </div>
      {data && (
        <p className="muted list-hint" style={{ marginTop: 0 }}>
          Default commission {data.default_commission_rate}% — a vendor's own rate overrides it.
        </p>
      )}

      {error && <p className="error-text">{error}</p>}
      {!data && !error && <ListSkeleton />}
      {shown?.length === 0 && (
        <ListEmpty query={query.trim()} onClear={() => setQuery("")}>No vendors yet.</ListEmpty>
      )}

      <div className="stack">
        {shown?.map((v) => (
          <Link key={v.id} to={`/admin/vendors/${v.id}`} className="card order-card">
            <div className="order-card__main">
              <strong>{v.name}</strong>
              <span className="muted truncate">
                {v.email}{v.phone && ` · ${v.phone}`} · {v.product_count} product{v.product_count === 1 ? "" : "s"}
                {v.payout_phone ? " · payout number set" : " · no payout number"}
                {v.commission_rate != null && ` · ${Number(v.commission_rate)}% commission`}
              </span>
            </div>
            <span className={`badge ${v.is_active ? "badge--paid" : "badge--cancelled"}`}>
              {v.is_active ? "active" : "disabled"}
            </span>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
