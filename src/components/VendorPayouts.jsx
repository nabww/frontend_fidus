import { useEffect, useState } from "react";
import client from "../api/client";
import { useToast } from "../context/ToastContext";

const kes = (n) => `KES ${Number(n || 0).toLocaleString()}`;

const STATUS_LABELS = { processing: "Processing", paid: "Paid", failed: "Failed", review: "Under review" };

// Mask all but the last 3 digits of the payout number
const masked = (phone) => (phone ? `${"•".repeat(Math.max(0, phone.length - 3))}${phone.slice(-3)}` : "");

export default function VendorPayouts() {
  const { toast } = useToast();
  const [summary, setSummary] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ phone: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => client.get("/payouts/mine").then((res) => {
    setSummary(res.data);
    if (!res.data.payout_phone) setEditing(true);
  });

  useEffect(() => { load().catch(() => setError("Couldn't load payouts.")); }, []);

  async function savePhone(e) {
    e.preventDefault();
    if (form.phone.replace(/\s/g, "") !== form.confirm.replace(/\s/g, "")) {
      return setError("The numbers don't match");
    }
    setError("");
    setBusy(true);
    try {
      await client.put("/payouts/settings", { payout_phone: form.phone });
      await load();
      setEditing(false);
      setForm({ phone: "", confirm: "" });
      toast("Payout number saved");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save the number.");
    } finally {
      setBusy(false);
    }
  }

  if (!summary) return error ? <p className="error-text">{error}</p> : null;

  return (
    <section style={{ marginTop: "2rem" }}>
      <div className="section-header" style={{ marginTop: 0 }}>
        <h2>Payouts</h2>
        <span className="muted" style={{ fontSize: "0.85rem" }}>
          Commission {Number(summary.commission_rate)}% · paid out after delivery
        </span>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <p>Ready for payout</p>
          <strong>{kes(summary.payable.net)}</strong>
        </div>
        <div className="stat-card">
          <p>Awaiting delivery</p>
          <strong>{kes(summary.awaiting_delivery.net)}</strong>
        </div>
        <div className="stat-card">
          <p>Payout number</p>
          {summary.payout_phone && !editing ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              <strong style={{ fontSize: "1.1rem" }}>{masked(summary.payout_phone)}</strong>
              <button className="link-btn" onClick={() => setEditing(true)}>Change</button>
            </div>
          ) : (
            <strong style={{ fontSize: "1rem", color: "var(--danger)" }}>Not set</strong>
          )}
        </div>
      </div>

      {editing && (
        <form className="form card payout-form" onSubmit={savePhone}>
          <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
            {summary.payout_phone
              ? "Enter the new M-Pesa number twice to confirm."
              : "Add the M-Pesa number your earnings should be sent to. Payouts are held until it's set."}
          </p>
          <div className="field">
            <label htmlFor="payout-phone">M-Pesa number</label>
            <input id="payout-phone" className="input" type="tel" inputMode="tel" required
              placeholder="07XX XXX XXX" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="payout-confirm">Confirm number</label>
            <input id="payout-confirm" className="input" type="tel" inputMode="tel" required
              value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              onPaste={(e) => e.preventDefault()} />
          </div>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button className="btn btn--primary" type="submit" disabled={busy}>
              {busy ? "Saving..." : "Save number"}
            </button>
            {summary.payout_phone && (
              <button type="button" className="btn btn--ghost"
                onClick={() => { setEditing(false); setError(""); }}>Cancel</button>
            )}
          </div>
          {error && <p className="error-text">{error}</p>}
        </form>
      )}

      <h2 className="section-title" style={{ marginTop: "1.5rem" }}>Payout history</h2>
      {summary.payouts.length === 0 ? (
        <p className="muted" style={{ fontSize: "0.9rem" }}>No payouts yet.</p>
      ) : (
        <div className="stack">
          {summary.payouts.map((p) => (
            <div key={p.id} className="card order-card">
              <div className="order-card__main">
                <strong>{kes(p.net_amount)}</strong>
                <span className="muted">
                  {new Date(p.created_at || p.createdAt).toLocaleDateString()} · {p.item_count} item
                  {p.item_count === 1 ? "" : "s"} · {kes(p.gross_amount)} less {Number(p.commission_rate)}%
                  {p.mpesa_transaction_id && ` · Ref ${p.mpesa_transaction_id}`}
                </span>
              </div>
              <span className={`badge badge--${p.status}`}>{STATUS_LABELS[p.status] || p.status}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
