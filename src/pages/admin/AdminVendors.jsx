import { useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";
import DashboardShell from "../../components/DashboardShell";
import FilterChips from "../../components/FilterChips";
import { ListEmpty, ListSkeleton } from "../../components/ListState";
import SearchBox from "../../components/SearchBox";
import { useToast } from "../../context/ToastContext";
import useList from "../../hooks/useList";
import { matches, shortDate } from "../../utils/format";

const EMPTY_INVITE = { name: "", business_name: "", email: "", phone: "" };

export function VendorStatusBadge({ vendor }) {
  if (vendor.vendor_status === "pending")
    return <span className="badge badge--review">pending review</span>;
  if (vendor.vendor_status === "rejected")
    return <span className="badge badge--cancelled">rejected</span>;
  return (
    <span className={`badge ${vendor.is_active ? "badge--paid" : "badge--cancelled"}`}>
      {vendor.is_active ? "active" : "disabled"}
    </span>
  );
}

export default function AdminVendors() {
  const { toast } = useToast();
  const { data, error, reload } = useList("/admin/vendors");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [inviting, setInviting] = useState(false);
  const [invite, setInvite] = useState(EMPTY_INVITE);
  const [busy, setBusy] = useState(false);

  const pending = data?.pending_count || 0;
  const shown = data?.vendors.filter(
    (v) =>
      (!status || v.vendor_status === status) &&
      matches(query, v.name, v.business_name, v.email, v.phone)
  );

  async function sendInvite(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await client.post("/admin/vendors", invite);
      toast(`Invite sent to ${invite.email}`);
      setInvite(EMPTY_INVITE);
      setInviting(false);
      reload();
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't create the vendor", { type: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell area="admin">
      <div className="toolbar">
        <SearchBox value={query} onChange={setQuery} placeholder="Name, business, email or phone" />
        <FilterChips
          value={status}
          onChange={setStatus}
          options={[
            { value: "", label: "All" },
            { value: "pending", label: pending ? `Pending (${pending})` : "Pending" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
          ]}
        />
        <button
          className="btn btn--primary btn--sm toolbar__count"
          onClick={() => setInviting((v) => !v)}
        >
          {inviting ? "Close" : "Add vendor"}
        </button>
      </div>

      {inviting && (
        <form className="card order-block" onSubmit={sendInvite} style={{ marginBottom: "1rem" }}>
          <strong>Add a vendor</strong>
          <p className="muted" style={{ margin: "0.3rem 0 0", fontSize: "0.85rem" }}>
            They're approved straight away and get an email to set their own password.
          </p>
          <div className="inline-form">
            <div className="field">
              <label>Name</label>
              <input
                className="input"
                required
                value={invite.name}
                onChange={(e) => setInvite({ ...invite, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Business name</label>
              <input
                className="input"
                value={invite.business_name}
                onChange={(e) => setInvite({ ...invite, business_name: e.target.value })}
              />
            </div>
            <div className="field field--grow">
              <label>Email</label>
              <input
                className="input"
                type="email"
                required
                value={invite.email}
                onChange={(e) => setInvite({ ...invite, email: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Phone</label>
              <input
                className="input"
                type="tel"
                placeholder="07XX XXX XXX"
                value={invite.phone}
                onChange={(e) => setInvite({ ...invite, phone: e.target.value })}
              />
            </div>
            <button className="btn btn--primary" disabled={busy}>
              {busy ? "Sending..." : "Send invite"}
            </button>
          </div>
        </form>
      )}

      {pending > 0 && status !== "pending" && (
        <button className="notice notice--warn pending-banner" onClick={() => setStatus("pending")}>
          {pending} seller application{pending === 1 ? "" : "s"} waiting for review →
        </button>
      )}
      {data && (
        <p className="muted list-hint" style={{ marginTop: 0 }}>
          Default commission {data.default_commission_rate}% — a vendor's own rate overrides it.
        </p>
      )}

      {error && <p className="error-text">{error}</p>}
      {!data && !error && <ListSkeleton />}
      {shown?.length === 0 && (
        <ListEmpty query={query.trim()} onClear={() => setQuery("")}>
          {status ? `No ${status} vendors.` : "No vendors yet."}
        </ListEmpty>
      )}

      <div className="stack">
        {shown?.map((v) => (
          <Link key={v.id} to={`/admin/vendors/${v.id}`} className="card order-card">
            <div className="order-card__main">
              <strong>{v.business_name ? `${v.business_name} · ${v.name}` : v.name}</strong>
              <span className="muted truncate">
                {v.vendor_status === "pending" ? (
                  <>
                    Applied {shortDate(v.created_at || v.createdAt)} · {v.email}
                    {v.phone && ` · ${v.phone}`}
                  </>
                ) : (
                  <>
                    {v.email}
                    {v.phone && ` · ${v.phone}`} · {v.product_count} product
                    {v.product_count === 1 ? "" : "s"}
                    {v.payout_phone ? " · payout number set" : " · no payout number"}
                    {v.commission_rate != null && ` · ${Number(v.commission_rate)}% commission`}
                  </>
                )}
              </span>
            </div>
            <VendorStatusBadge vendor={v} />
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
