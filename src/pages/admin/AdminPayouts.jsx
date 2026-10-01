import { useCallback, useEffect, useState } from "react";
import client from "../../api/client";
import DashboardTabs from "../../components/DashboardTabs";
import { useToast } from "../../context/ToastContext";
import { ADMIN_TABS } from "./AdminOverview";

const kes = (n) => `KES ${Number(n || 0).toLocaleString()}`;
const STATUS_LABELS = { processing: "Processing", paid: "Paid", failed: "Failed", review: "Needs review" };

export default function AdminPayouts() {
  const { toast, confirm } = useToast();
  const [preview, setPreview] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [p, h] = await Promise.all([
        client.get("/payouts/preview"),
        client.get("/payouts"),
      ]);
      setPreview(p.data);
      setPayouts(h.data);
      setError("");
    } catch {
      setError("Couldn't load payout data.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
      await load();
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
      await load();
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't resolve payout", { type: "error" });
    }
  }

  if (!preview) {
    return <div className="page">{error ? <p className="error-text">{error}</p> : <p className="muted">Loading...</p>}</div>;
  }

  const needsReview = payouts.filter((p) => p.status === "review");

  return (
    <div className="page page--wide">
      <h1>Admin</h1>
      <DashboardTabs base="/admin" tabs={ADMIN_TABS} />
      <div className="section-header" style={{ marginTop: "1.25rem" }}>
        <h2 style={{ margin: 0 }}>Payouts</h2>
        <button className="btn btn--primary" onClick={runNow} disabled={running || ready.length === 0}>
          {running ? "Sending..." : ready.length ? `Pay out ${kes(readyTotal)}` : "Nothing to pay out"}
        </button>
      </div>
      <p className="muted" style={{ fontSize: "0.88rem" }}>
        Delivered items become payable immediately. Default commission {preview.default_commission_rate}%.
      </p>

      {needsReview.length > 0 && (
        <div className="notice notice--warn" style={{ marginTop: "1rem" }}>
          {needsReview.length} payout{needsReview.length === 1 ? "" : "s"} need review — Safaricom didn't
          confirm the outcome. Check the M-Pesa portal, then mark each one paid or failed below.
        </div>
      )}

      <h2 className="section-title" style={{ marginTop: "1.5rem" }}>Ready for payout</h2>
      {preview.vendors.length === 0 ? (
        <p className="muted" style={{ fontSize: "0.9rem" }}>No delivered, unpaid items.</p>
      ) : (
        <div className="stack">
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
      )}

      <h2 className="section-title" style={{ marginTop: "2rem" }}>History</h2>
      {payouts.length === 0 ? (
        <p className="muted" style={{ fontSize: "0.9rem" }}>No payouts yet.</p>
      ) : (
        <div className="stack">
          {payouts.map((p) => (
            <div key={p.id} className="card order-card">
              <div className="order-card__main">
                <strong>#{p.id} · {p.vendor?.name} · {kes(p.net_amount)}</strong>
                <span className="muted">
                  {new Date(p.created_at || p.createdAt).toLocaleString()} · {p.triggered_by}
                  {p.mpesa_transaction_id && ` · Ref ${p.mpesa_transaction_id}`}
                  {p.result_desc && p.status !== "paid" && ` · ${p.result_desc}`}
                </span>
              </div>
              <span className={`badge badge--${p.status}`}>{STATUS_LABELS[p.status] || p.status}</span>
              {p.status === "review" && (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn--ghost btn--sm" onClick={() => resolve(p, "failed")}>Failed</button>
                  <button className="btn btn--primary btn--sm" onClick={() => resolve(p, "paid")}>Paid</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="muted" style={{ fontSize: "0.85rem", marginTop: "1.5rem" }}>
        Per-vendor commission rates are edited on each vendor's page under Vendors.
      </p>
    </div>
  );
}
