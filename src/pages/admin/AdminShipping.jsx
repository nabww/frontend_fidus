import { useState } from "react";
import client from "../../api/client";
import DashboardShell from "../../components/DashboardShell";
import { ListEmpty, ListSkeleton } from "../../components/ListState";
import { useToast } from "../../context/ToastContext";
import useList from "../../hooks/useList";
import { kes } from "../../utils/format";

export default function AdminShipping() {
  const { toast } = useToast();
  const { data, error, reload } = useList("/admin/shipping");
  const [edits, setEdits] = useState({});       // town -> fee (unsaved)
  const [min, setMin] = useState(null);        // null = untouched
  const [newZone, setNewZone] = useState({ town: "", fee: "" });
  const [busy, setBusy] = useState("");

  async function saveZone(zone) {
    const fee = Number(edits[zone.town] ?? zone.fee);
    setBusy(`zone:${zone.town}`);
    try {
      await client.put("/admin/shipping/zones", { town: zone.town, fee, is_active: zone.is_active });
      setEdits((e) => { const n = { ...e }; delete n[zone.town]; return n; });
      toast(`${zone.town} updated`);
      reload();
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't save the zone", { type: "error" });
    } finally {
      setBusy("");
    }
  }

  async function toggleZone(zone) {
    setBusy(`zone:${zone.town}`);
    try {
      await client.put(`/admin/shipping/zones/${encodeURIComponent(zone.town)}/active`, { is_active: !zone.is_active });
      toast(zone.is_active ? `${zone.town} disabled` : `${zone.town} enabled`);
      reload();
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't update the zone", { type: "error" });
    } finally {
      setBusy("");
    }
  }

  async function addZone(e) {
    e.preventDefault();
    setBusy("add");
    try {
      await client.put("/admin/shipping/zones", { town: newZone.town, fee: Number(newZone.fee) });
      setNewZone({ town: "", fee: "" });
      toast("Delivery town added");
      reload();
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't add the town", { type: "error" });
    } finally {
      setBusy("");
    }
  }

  async function saveMin(e) {
    e.preventDefault();
    setBusy("min");
    try {
      await client.put("/admin/shipping/free-min", { free_shipping_min: min ?? data.free_shipping_min });
      setMin(null);
      toast("Free-delivery threshold saved");
      reload();
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't save the threshold", { type: "error" });
    } finally {
      setBusy("");
    }
  }

  return (
    <DashboardShell area="admin">
      {error && <p className="error-text">{error}</p>}
      {!data && !error && <ListSkeleton />}
      {data && (
        <>
          <form className="card order-block" onSubmit={saveMin}>
            <strong>Free delivery</strong>
            <p className="muted" style={{ margin: "0.3rem 0 0.8rem" }}>
              Orders at or above this subtotal ship free, to any town. Set to 0 to turn it off.
            </p>
            <div className="inline-form" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
              <div className="field">
                <label>Minimum subtotal (KES)</label>
                <input
                  className="input" type="number" min="0" step="1" inputMode="numeric"
                  value={min ?? data.free_shipping_min}
                  onChange={(e) => setMin(e.target.value)}
                />
              </div>
              <button className="btn btn--primary" disabled={busy === "min" || (min ?? data.free_shipping_min) === data.free_shipping_min}>
                {busy === "min" ? "Saving..." : "Save"}
              </button>
            </div>
            {Number(min ?? data.free_shipping_min) > 0 && (
              <p className="muted" style={{ margin: "0.6rem 0 0", fontSize: "0.85rem" }}>
                Currently: free delivery on orders of {kes(min ?? data.free_shipping_min)} or more.
              </p>
            )}
          </form>

          <h2 className="section-title" style={{ marginTop: "1.75rem" }}>Delivery towns & fees</h2>
          {data.zones.length === 0 && <ListEmpty>No delivery towns configured.</ListEmpty>}
          <div className="stack">
            {data.zones.map((z) => (
              <div key={z.town} className={`card order-card ${!z.is_active ? "is-loading" : ""}`}>
                <div className="order-card__main">
                  <strong>{z.town}</strong>
                  <span className="muted truncate">
                    {Number(z.fee) === 0 ? "Free delivery" : `KES ${Number(z.fee).toLocaleString()}`}
                    {!z.is_active && " · not offered at checkout"}
                  </span>
                </div>
                <input
                  className="input" type="number" min="0" step="1" inputMode="numeric"
                  style={{ width: 110 }}
                  value={edits[z.town] ?? z.fee}
                  onChange={(e) => setEdits((s) => ({ ...s, [z.town]: e.target.value }))}
                  aria-label={`${z.town} fee`}
                />
                {edits[z.town] !== undefined && Number(edits[z.town]) !== Number(z.fee) && (
                  <button className="btn btn--primary btn--sm" disabled={busy === `zone:${z.town}`} onClick={() => saveZone(z)}>
                    Save
                  </button>
                )}
                <button className="btn btn--ghost btn--sm" disabled={busy === `zone:${z.town}`} onClick={() => toggleZone(z)}>
                  {z.is_active ? "Hide" : "Show"}
                </button>
              </div>
            ))}
          </div>

          <form className="inline-form" onSubmit={addZone} style={{ marginTop: "1rem" }}>
            <div className="field field--grow">
              <label>Add a town</label>
              <input className="input" required placeholder="e.g. Eldoret" value={newZone.town}
                onChange={(e) => setNewZone({ ...newZone, town: e.target.value })} />
            </div>
            <div className="field">
              <label>Fee (KES)</label>
              <input className="input" required type="number" min="0" step="1" inputMode="numeric" value={newZone.fee}
                onChange={(e) => setNewZone({ ...newZone, fee: e.target.value })} />
            </div>
            <button className="btn btn--primary" disabled={busy === "add"}>Add</button>
          </form>
        </>
      )}
    </DashboardShell>
  );
}
