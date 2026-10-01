import { useState } from "react";
import client from "../../api/client";
import DashboardShell from "../../components/DashboardShell";
import { ListEmpty, ListSkeleton } from "../../components/ListState";
import SearchBox from "../../components/SearchBox";
import { useToast } from "../../context/ToastContext";
import useList from "../../hooks/useList";
import { matches, shortDate } from "../../utils/format";

export default function AdminCustomers() {
  const { toast, confirm } = useToast();
  const { data: customers, error, reload } = useList("/admin/customers");
  const [query, setQuery] = useState("");

  async function toggle(c) {
    const ok = await confirm(c.is_active ? {
      title: `Disable ${c.name}?`,
      message: "They're signed out and can't log in or place orders. Their order history is kept.",
      confirmLabel: "Disable account",
      danger: true,
    } : {
      title: `Re-enable ${c.name}?`,
      confirmLabel: "Re-enable",
    });
    if (!ok) return;
    try {
      await client.put(`/admin/users/${c.id}/active`, { is_active: !c.is_active });
      toast(c.is_active ? "Account disabled" : "Account re-enabled");
      reload();
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't update the account", { type: "error" });
    }
  }

  const shown = customers?.filter((c) => matches(query, c.name, c.email, c.phone));

  return (
    <DashboardShell area="admin">
      <div className="toolbar">
        <SearchBox value={query} onChange={setQuery} placeholder="Name, email or phone" />
        {customers && <span className="muted toolbar__count">{shown.length} of {customers.length}</span>}
      </div>

      {error && <p className="error-text">{error}</p>}
      {!customers && !error && <ListSkeleton />}
      {shown?.length === 0 && (
        <ListEmpty query={query.trim()} onClear={() => setQuery("")}>No customers yet.</ListEmpty>
      )}

      <div className="stack">
        {shown?.map((c) => (
          <div key={c.id} className="card order-card">
            <div className="order-card__main">
              <strong>{c.name}</strong>
              <span className="muted truncate">
                {c.email}{c.phone && ` · ${c.phone}`} · {c.order_count} order{c.order_count === 1 ? "" : "s"} ·
                joined {shortDate(c.created_at || c.createdAt)}
              </span>
            </div>
            <span className={`badge ${c.is_active ? "badge--paid" : "badge--cancelled"}`}>
              {c.is_active ? "active" : "disabled"}
            </span>
            <button className="btn btn--ghost btn--sm" onClick={() => toggle(c)}>
              {c.is_active ? "Disable" : "Enable"}
            </button>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
