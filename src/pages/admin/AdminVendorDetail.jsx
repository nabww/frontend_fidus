import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import client, { imageUrl } from "../../api/client";
import DashboardShell from "../../components/DashboardShell";
import { ListEmpty, ListSkeleton } from "../../components/ListState";
import SearchBox from "../../components/SearchBox";
import { useToast } from "../../context/ToastContext";
import { kes, matches } from "../../utils/format";

const SEARCH_AFTER = 6; // product search only appears once the list is long enough to need it

export default function AdminVendorDetail() {
  const { id } = useParams();
  const { toast, confirm } = useToast();
  const [vendor, setVendor] = useState(null);
  const [form, setForm] = useState(null);
  const [defaultRate, setDefaultRate] = useState(10);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");

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

  const back = <Link to="/admin/vendors" className="back-link">← Vendors</Link>;
  if (error) return <DashboardShell area="admin" back={back}><p className="error-text">{error}</p></DashboardShell>;
  if (!vendor || !form) return <DashboardShell area="admin" back={back}><ListSkeleton rows={3} /></DashboardShell>;

  const products = vendor.products || [];
  const shown = products.filter((p) => matches(query, p.name, p.category));

  return (
    <DashboardShell area="admin" back={back}>
      <div className="section-header" style={{ marginTop: 0 }}>
        <h2 style={{ margin: 0 }}>{vendor.name}</h2>
        <span className={`badge ${vendor.is_active ? "badge--paid" : "badge--cancelled"}`}>
          {vendor.is_active ? "active" : "disabled"}
        </span>
      </div>

      <form className="form form--full card vendor-form" onSubmit={save}>
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
        <div className="btn-row">
          <button className="btn btn--primary" type="submit" disabled={busy}>
            {busy ? "Saving..." : "Save changes"}
          </button>
          <button type="button" className={`btn ${vendor.is_active ? "btn--ghost" : "btn--primary"}`}
            onClick={toggleVendor}>
            {vendor.is_active ? "Disable vendor" : "Re-enable vendor"}
          </button>
        </div>
      </form>


      <div className="section-header">
        <h2 style={{ margin: 0 }}>Products ({products.length})</h2>
      </div>
      {products.length > SEARCH_AFTER && (
        <div className="toolbar" style={{ marginTop: "0.75rem" }}>
          <SearchBox value={query} onChange={setQuery} placeholder="Product or category" />
          <span className="muted toolbar__count">{shown.length} of {products.length}</span>
        </div>
      )}
      <div className="stack" style={{ marginTop: "0.75rem" }}>
        {products.length === 0 && <ListEmpty>No products.</ListEmpty>}
        {products.length > 0 && shown.length === 0 && (
          <ListEmpty query={query.trim()} onClear={() => setQuery("")} />
        )}
        {shown.map((p) => (
          <div key={p.id} className="card order-card">
            <div className="thumb">
              {p.image_url ? <img src={imageUrl(p.image_url)} alt="" loading="lazy" /> : "📦"}
            </div>
            <div className="order-card__main">
              <strong className="truncate">{p.name}</strong>
              <span className="muted">{kes(p.price)} · {p.stock} in stock</span>
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
    </DashboardShell>
  );
}
