import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import client, { imageUrl } from "../../api/client";
import DashboardTabs from "../../components/DashboardTabs";
import { useToast } from "../../context/ToastContext";
import { ADMIN_TABS } from "./AdminOverview";

export default function AdminVendorDetail() {
  const { id } = useParams();
  const { toast, confirm } = useToast();
  const [vendor, setVendor] = useState(null);
  const [form, setForm] = useState(null);
  const [defaultRate, setDefaultRate] = useState(10);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => Promise.all([
    client.get(`/admin/vendors/${id}`),
    client.get("/admin/vendors"),
  ]).then(([v, list]) => {
    setVendor(v.data);
    setDefaultRate(list.data.default_commission_rate);
    setForm({
      name: v.data.name,
      email: v.data.email,
      phone: v.data.phone || "",
      payout_phone: v.data.payout_phone || "",
      commission_rate: v.data.commission_rate ?? "",
      is_active: v.data.is_active,
    });
  }).catch(() => setError("Couldn't load this vendor."));

  useEffect(() => { load(); }, [id]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await client.put(`/admin/vendors/${id}`, {
        ...form,
        commission_rate: form.commission_rate === "" ? null : form.commission_rate,
      });
      toast("Vendor updated");
      await load();
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't save changes", { type: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function toggleProduct(p) {
    const label = p.is_active ? "hide" : "restore";
    if (p.is_active) {
      const ok = await confirm({
        title: `Hide "${p.name}"?`,
        message: "It leaves the shop immediately. Existing orders are unaffected.",
        confirmLabel: "Hide product",
        danger: true,
      });
      if (!ok) return;
    }
    try {
      await client.put(`/admin/products/${p.id}/active`, { is_active: !p.is_active });
      toast(`Product ${label === "hide" ? "hidden" : "back in the shop"}`);
      await load();
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't update the product", { type: "error" });
    }
  }

  async function toggleVendor() {
    const disabling = form.is_active;
    const ok = await confirm(disabling ? {
      title: `Disable ${vendor.name}?`,
      message: "They're signed out, can't log in, and all their products leave the shop. Nothing is deleted.",
      confirmLabel: "Disable vendor",
      danger: true,
    } : {
      title: `Re-enable ${vendor.name}?`,
      message: "They can sign in again and their active products return to the shop.",
      confirmLabel: "Re-enable",
    });
    if (!ok) return;
    try {
      await client.put(`/admin/vendors/${id}`, { is_active: !disabling });
      toast(disabling ? "Vendor disabled" : "Vendor re-enabled");
      await load();
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't update the vendor", { type: "error" });
    }
  }

  if (error) return <div className="page"><p className="error-text">{error}</p></div>;
  if (!vendor || !form) return <div className="page"><p className="muted">Loading...</p></div>;

  return (
    <div className="page">
      <Link to="/admin/vendors" className="back-link">← Vendors</Link>
      <DashboardTabs base="/admin" tabs={ADMIN_TABS} />

      <div className="section-header" style={{ marginTop: "1rem" }}>
        <h1 style={{ margin: 0 }}>{vendor.name}</h1>
        <span className={`badge ${vendor.is_active ? "badge--paid" : "badge--cancelled"}`}>
          {vendor.is_active ? "active" : "disabled"}
        </span>
      </div>

      <form className="form form--full card" style={{ padding: "1.25rem", marginTop: "1rem", maxWidth: 520 }} onSubmit={save}>
        <div className="field">
          <label htmlFor="v-name">Name</label>
          <input id="v-name" className="input" value={form.name} onChange={set("name")} required />
        </div>
        <div className="field">
          <label htmlFor="v-email">Email</label>
          <input id="v-email" className="input" type="email" value={form.email} onChange={set("email")} required />
        </div>
        <div className="field">
          <label htmlFor="v-phone">Phone</label>
          <input id="v-phone" className="input" type="tel" value={form.phone} onChange={set("phone")}
            placeholder="07XX XXX XXX" />
        </div>
        <div className="field">
          <label htmlFor="v-payout">Payout M-Pesa number</label>
          <input id="v-payout" className="input" type="tel" value={form.payout_phone} onChange={set("payout_phone")}
            placeholder="07XX XXX XXX" />
        </div>
        <div className="field">
          <label htmlFor="v-rate">Commission rate % <span className="muted">(blank = default {defaultRate}%)</span></label>
          <input id="v-rate" className="input" type="number" min="0" max="100" step="0.5"
            style={{ maxWidth: 140 }} value={form.commission_rate} onChange={set("commission_rate")}
            placeholder={String(defaultRate)} />
        </div>
        <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.25rem" }}>
          <button className="btn btn--primary" type="submit" disabled={busy}>
            {busy ? "Saving..." : "Save changes"}
          </button>
          <button type="button" className={`btn ${vendor.is_active ? "btn--ghost" : "btn--primary"}`}
            onClick={toggleVendor}>
            {vendor.is_active ? "Disable vendor" : "Re-enable vendor"}
          </button>
        </div>
      </form>

      <h2 className="section-title" style={{ marginTop: "1.75rem" }}>
        Products ({vendor.products?.length || 0})
      </h2>
      {vendor.products?.length === 0 && <p className="muted" style={{ fontSize: "0.9rem" }}>No products.</p>}
      <div className="stack">
        {vendor.products?.map((p) => (
          <div key={p.id} className="card order-card">
            <div className="cart-item__thumb" style={{ width: 48, height: 48 }}>
              {p.image_url ? <img src={imageUrl(p.image_url)} alt="" loading="lazy" /> : "📦"}
            </div>
            <div className="order-card__main">
              <strong>{p.name}</strong>
              <span className="muted">
                KES {Number(p.price).toLocaleString()} · {p.stock} in stock
              </span>
            </div>
            <span className={`badge ${p.is_active ? "badge--paid" : "badge--cancelled"}`}>
              {p.is_active ? "live" : "hidden"}
            </span>
            <button className="btn btn--ghost btn--sm" onClick={() => toggleProduct(p)}>
              {p.is_active ? "Hide" : "Restore"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
