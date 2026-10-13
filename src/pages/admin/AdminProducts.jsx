import { useState } from "react";
import client, { imageUrl } from "../../api/client";
import DashboardShell from "../../components/DashboardShell";
import FilterChips from "../../components/FilterChips";
import { ListEmpty, ListSkeleton } from "../../components/ListState";
import SearchBox from "../../components/SearchBox";
import { useToast } from "../../context/ToastContext";
import useDebounced from "../../hooks/useDebounced";
import useList from "../../hooks/useList";
import { kes } from "../../utils/format";

const FILTERS = [
  { value: "", label: "All" },
  { value: "true", label: "Live" },
  { value: "false", label: "Hidden" },
];

export default function AdminProducts() {
  const { toast, confirm } = useToast();
  const [active, setActive] = useState("");
  const [query, setQuery] = useState("");
  const q = useDebounced(query).trim();
  const { data: products, loading, error, reload } = useList("/admin/products", {
    active: active || undefined,
    q: q || undefined,
  });
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  function openEdit(p) {
    setEditId(p.id);
    setForm({ name: p.name, price: p.price, stock: p.stock, category: p.category || "" });
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await client.put(`/admin/products/${editId}`, form);
      toast("Product updated");
      setEditId(null);
      reload();
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't save changes", { type: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function feature(p) {
    try {
      await client.put(`/admin/products/${p.id}`, { is_featured: !p.is_featured });
      toast(p.is_featured ? "Removed from featured" : "Featured — it'll lead the shop");
      reload();
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't update the product", { type: "error" });
    }
  }

  async function toggle(p) {
    if (p.is_active) {
      const ok = await confirm({
        title: `Hide "${p.name}"?`,
        message: `It leaves the shop immediately. ${p.vendor?.name || "The vendor"}'s existing orders are unaffected.`,
        confirmLabel: "Hide product",
        danger: true,
      });
      if (!ok) return;
    }
    try {
      await client.put(`/admin/products/${p.id}/active`, { is_active: !p.is_active });
      toast(p.is_active ? "Product hidden" : "Product restored");
      reload();
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't update the product", { type: "error" });
    }
  }

  return (
    <DashboardShell area="admin">
      <div className="toolbar">
        <SearchBox value={query} onChange={setQuery} placeholder="Product, category or vendor" />
        <FilterChips options={FILTERS} value={active} onChange={setActive} />
      </div>

      {error && <p className="error-text">{error}</p>}
      {!products && !error && <ListSkeleton />}
      {products?.length === 0 && (
        <ListEmpty query={q} filtered={active} onClear={() => { setQuery(""); setActive(""); }}>
          No products yet.
        </ListEmpty>
      )}

      <div className={`stack${loading && products ? " is-loading" : ""}`}>
        {products?.map((p) => (
          <div key={p.id} className="card order-block">
            <div className="order-card">
              <div className="thumb">
                {p.image_url ? <img src={imageUrl(p.image_url)} alt="" loading="lazy" /> : "📦"}
              </div>
              <div className="order-card__main">
                <strong className="truncate">{p.name}</strong>
                <span className="muted truncate">
                  {p.vendor?.name} · {p.category || "Uncategorised"} · {p.discount_active
                    ? <><span className="price--old">{kes(p.price)}</span> {kes(p.effective_price)}</>
                    : kes(p.price)} · {p.stock} in stock
                </span>
              </div>
              {p.discount_active && <span className="badge badge--accent">-{p.discount_percent}%</span>}
              {!p.vendor?.is_active && <span className="badge badge--review">vendor disabled</span>}
              {p.is_featured && <span className="badge badge--feature">featured</span>}
              <span className={`badge ${p.is_active ? "badge--paid" : "badge--cancelled"}`}>
                {p.is_active ? "live" : "hidden"}
              </span>
              <div className="order-card__actions">
                <button
                  className={`btn btn--sm ${p.is_featured ? "btn--primary" : "btn--ghost"}`}
                  title={p.is_featured ? "Remove from featured" : "Feature in the shop"}
                  onClick={() => feature(p)}
                >
                  {p.is_featured ? "★ Featured" : "☆ Feature"}
                </button>
                <button className="btn btn--ghost btn--sm"
                  onClick={() => (editId === p.id ? setEditId(null) : openEdit(p))}>
                  {editId === p.id ? "Close" : "Edit"}
                </button>
                <button className="btn btn--ghost btn--sm" onClick={() => toggle(p)}>
                  {p.is_active ? "Hide" : "Restore"}
                </button>
              </div>
            </div>

            {/* Quick fixes for a vendor who can't be reached */}
            {editId === p.id && (
              <form className="inline-form" onSubmit={save}>
                <div className="field field--grow">
                  <label>Name</label>
                  <input className="input" value={form.name} required
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="field">
                  <label>Price (KES)</label>
                  <input className="input" type="number" min="0" step="0.01" value={form.price} required
                    onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="field">
                  <label>Stock</label>
                  <input className="input" type="number" min="0" step="1" value={form.stock} required
                    onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                </div>
                <div className="field">
                  <label>Category</label>
                  <input className="input" value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
                <button className="btn btn--primary btn--sm" type="submit" disabled={busy}>
                  {busy ? "Saving..." : "Save"}
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
      {products?.length >= 500 && <p className="muted list-hint">Showing the latest 500 — search to narrow down.</p>}
    </DashboardShell>
  );
}
