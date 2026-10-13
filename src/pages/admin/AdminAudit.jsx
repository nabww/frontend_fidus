import { useState } from "react";
import DashboardShell from "../../components/DashboardShell";
import { ListEmpty, ListSkeleton } from "../../components/ListState";
import SearchBox from "../../components/SearchBox";
import useDebounced from "../../hooks/useDebounced";
import useList from "../../hooks/useList";
import { matches, shortDateTime } from "../../utils/format";

// "vendor.approved" → "vendor · approved"
const label = (action) => action?.replace(/[._]/g, " · ");

// Compact rendering of an entry's meta — values only, objects skipped
function metaText(meta) {
  if (!meta || typeof meta !== "object") return "";
  return Object.values(meta)
    .filter((v) => v !== null && v !== undefined && typeof v !== "object")
    .join(" · ");
}

export default function AdminAudit() {
  const [query, setQuery] = useState("");
  const q = useDebounced(query).trim();
  const { data: logs, loading, error } = useList("/admin/audit", { q: q || undefined });

  // Server filters actor/action; meta text is matched client-side on top
  const shown = logs?.filter((l) => matches(query, l.actor_label, l.action, metaText(l.meta)));

  return (
    <DashboardShell area="admin">
      <div className="toolbar">
        <SearchBox value={query} onChange={setQuery} placeholder="Who or what — e.g. approved, payout, email" />
        {logs && <span className="muted toolbar__count">{shown.length} of {logs.length}</span>}
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        Every privileged action on the platform, newest first. Entries are kept even if the account is later removed.
      </p>

      {error && <p className="error-text">{error}</p>}
      {!logs && !error && <ListSkeleton />}
      {shown?.length === 0 && (
        <ListEmpty query={q} onClear={() => setQuery("")}>Nothing recorded yet.</ListEmpty>
      )}

      <div className={`stack${loading && logs ? " is-loading" : ""}`}>
        {shown?.map((l) => (
          <div key={l.id} className="card order-card">
            <div className="order-card__main">
              <strong>{label(l.action)}</strong>
              <span className="muted truncate">{l.actor_label}</span>
              {metaText(l.meta) && <span className="muted truncate">{metaText(l.meta)}</span>}
            </div>
            <span className="muted" style={{ whiteSpace: "nowrap" }}>{shortDateTime(l.created_at || l.createdAt)}</span>
          </div>
        ))}
      </div>
      {logs?.length >= 200 && <p className="muted list-hint">Showing the latest 200 — search to narrow down.</p>}
    </DashboardShell>
  );
}
