import { useState } from "react";
import client from "../../api/client";
import DashboardShell from "../../components/DashboardShell";
import { ListEmpty, ListSkeleton } from "../../components/ListState";
import SearchBox from "../../components/SearchBox";
import { useToast } from "../../context/ToastContext";
import useList from "../../hooks/useList";
import { kes, matches } from "../../utils/format";

const STATUS_LABELS = { processing: "Processing", paid: "Paid", failed: "Failed", review: "Needs review" };
const SEARCH_AFTER = 6; // history search only appears once the list is long enough to need it

export default function AdminPayouts() {
  const { toast, confirm } = useToast();
  const previewList = useList("/payouts/preview");
  const historyList = useList("/payouts");
  const preview = previewList.data;
  const payouts = historyList.data || [];
  const error = previewList.error || historyList.error;
  const [running, setRunning] = useState(false);
  const [query, setQuery] = useState("");

  const reload = () => { previewList.reload(); historyList.reload(); };
  const ready = preview?.vendors.filter((v) => !v.blocker) || [];
  const readyTotal = ready.reduce((s, v) => s + v.net, 0);

  async function runNow() {
    const ok = await confirm({
      title: `Pay out ${kes(readyTotal)}?`,
      message: `This sends M-Pesa transfers to ${ready.length} vendor${ready.length === 1 ? "" : "s"} now.`,
      confirmLabel: "Send payouts",
    });
    if (!ok) return;
    setRunning(true);
    try {
      const { data } = await client.post("/payouts/run");
      const sent = data.results.filter((r) => r.status === "processing").length;
      const problems = data.results.filter((r) => r.error || r.status === "failed" || r.status === "review").length;
      toast(
        problems ? `${sent} sent, ${problems} need attention` : `${sent} payout${sent === 1 ? "" : "s"} sent`,
        { type: problems ? "error" : "success", duration: 3000 }
      );
      reload();
    } catch (err) {
      toast(err.response?.data?.message || "Payout run failed", { type: "error", duration: 3500 });
    } finally {
      setRunning(false);
    }
  }

  async function resolve(payout, outcome) {
    const ok = await confirm(outcome === "paid" ? {
      title: "Mark as paid?",
      message: `Only do this if ${kes(payout.net_amount)} reached ${payout.vendor?.name}'s M-Pesa (check the M-Pesa portal).`,
      confirmLabel: "Mark paid",
    } : {
      title: "Mark as failed?",
      message: "The items go back into the next payout run. Only do this if the money did NOT arrive.",
      confirmLabel: "Mark failed",
      danger: true,
    });
    if (!ok) return;
    try {
      await client.post(`/payouts/${payout.id}/resolve`, { outcome });
      toast(outcome === "paid" ? "Marked as paid" : "Marked as failed — items released");
      reload();
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't resolve payout", { type: "error" });
    }
  }

  const needsReview = payouts.filter((p) => p.status === "review");
  const shown = payouts.filter((p) => matches(query, p.vendor?.name, p.mpesa_transaction_id, p.status, p.triggered_by));

  return (
    <DashboardShell area="admin">
      {error && <p className="error-text">{error}</p>}
      {!preview && !error && <ListSkeleton rows={3} />}

      {preview && (
        <>
          <div className="section-header" style={{ marginTop: 0 }}>
            <div>
              <h2 style={{ margin: 0 }}>Ready for payout</h2>
              <p className="muted list-hint" style={{ margin: "0.2rem 0 0" }}>
                Delivered items are payable immediately · default commission {preview.default_commission_rate}%
              </p>
            </div>
            <button className="btn btn--primary" onClick={runNow} disabled={running || ready.length === 0}>
              {running ? "Sending..." : ready.length ? `Pay out ${kes(readyTotal)}` : "Nothing to pay out"}
            </button>
          </div>

          {needsReview.length > 0 && (
            <div className="notice notice--warn" style={{ marginTop: "1rem" }}>
              {needsReview.length} payout{needsReview.length === 1 ? "" : "s"} need review — Safaricom didn't
              confirm the outcome. Check the M-Pesa portal, then mark each one paid or failed below.
            </div>
          )}

          <div className="stack" style={{ marginTop: "1rem" }}>
            {preview.vendors.length === 0 && <ListEmpty>No delivered, unpaid items.</ListEmpty>}
            {preview.vendors.map((v) => (
              <div key={v.vendor.id} className="card order-card">
                <div className="order-card__main">
                  <strong>{v.vendor.name}</strong>
                  <span className="muted">
                    {v.item_count} item{v.item_count === 1 ? "" : "s"} · {kes(v.gross)} gross − {v.commission_rate}%
                  </span>
                </div>
                {v.blocker
                  ? <span className="badge badge--failed">{v.blocker}</span>
                  : <span className="order-card__total">{kes(v.net)}</span>}
              </div>
            ))}
          </div>

          <div className="section-header">
            <h2 style={{ margin: 0 }}>History</h2>
          </div>
          {payouts.length > SEARCH_AFTER && (
            <div className="toolbar" style={{ marginTop: "0.75rem" }}>
              <SearchBox value={query} onChange={setQuery} placeholder="Vendor, M-Pesa ref or status" />
              <span className="muted toolbar__count">{shown.length} of {payouts.length}</span>
            </div>
          )}
          <div className="stack" style={{ marginTop: "0.75rem" }}>
            {payouts.length === 0 && <ListEmpty>No payouts yet.</ListEmpty>}
            {payouts.length > 0 && shown.length === 0 && (
              <ListEmpty query={query.trim()} onClear={() => setQuery("")} />
            )}
            {shown.map((p) => (
              <div key={p.id} className="card order-card">
                <div className="order-card__main">
                  <strong>{p.vendor?.name} · {kes(p.net_amount)}</strong>
                  <span className="muted truncate">
                    {new Date(p.created_at || p.createdAt).toLocaleString()} · {p.triggered_by}
                    {p.mpesa_transaction_id && ` · Ref ${p.mpesa_transaction_id}`}
                    {p.result_desc && p.status !== "paid" && ` · ${p.result_desc}`}
                  </span>
                </div>
                <span className={`badge badge--${p.status}`}>{STATUS_LABELS[p.status] || p.status}</span>
                {p.status === "review" && (
                  <div className="order-card__actions">
                    <button className="btn btn--ghost btn--sm" onClick={() => resolve(p, "failed")}>Failed</button>
                    <button className="btn btn--primary btn--sm" onClick={() => resolve(p, "paid")}>Paid</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="muted list-hint">
            Per-vendor commission rates are edited on each vendor's page under Vendors.
          </p>
        </>
      )}
    </DashboardShell>
  );
}
