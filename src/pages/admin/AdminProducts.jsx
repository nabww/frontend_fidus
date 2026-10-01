import { useEffect, useState } from "react";
import client, { imageUrl } from "../../api/client";
import DashboardTabs from "../../components/DashboardTabs";
import { useToast } from "../../context/ToastContext";
import { ADMIN_TABS } from "./AdminOverview";

const kes = (n) => `KES ${Number(n || 0).toLocaleString()}`;
const FILTERS = [
  { value: "", label: "All" },
  { value: "true", label: "Live" },
  { value: "false", label: "Hidden" },
];

export default function AdminProducts() {
  const { toast, confirm } = useToast();
  const [products, setProducts] = useState(null);
  const [active, setActive] = useState("");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = () => client.get("/admin/products", { params: active ? { active } : {} })
    .then((res) => { setProducts(res.data); setError(""); })
    .catch(() => setError("Couldn't load products."));
  useEffect(() => { load(); }, [active]);

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
      await load();
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't save changes", { type: "error" });
    } finally {
      setBusy(false);
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
      await load();
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't update the product", { type: "error" });
    }
  }

  return (
    <div className="page page--wide">
      <h1>Admin</h1>
      <DashboardTabs base="/admin" tabs={ADMIN_TABS} />

      <div className="chip-row" style={{ marginTop: "1.25rem" }}>
        {FILTERS.map((f) => (
          <button key={f.value || "all"} className={`chip${active === f.value ? " chip--active" : ""}`}
            onClick={() => setActive(f.value)}>
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="error-text" style={{ marginTop: "1rem" }}>{error}</p>}
      {products?.length === 0 && <p className="muted" style={{ marginTop: "1.5rem" }}>No products.</p>}

      <div className="stack" style={{ marginTop: "1rem" }}>
        {products?.map((p) => (
          <div key={p.id} className="card" style={{ padding: "0.9rem 1.1rem" }}>
            <div className="order-card" style={{ padding: 0 }}>
              <div className="cart-item__thumb" style={{ width: 48, height: 48 }}>
                {p.image_url ? <img src={imageUrl(p.image_url)} alt="" loading="lazy" /> : "📦"}
              </div>
              <div className="order-card__main">
                <strong>{p.name}</strong>
                <span className="muted">
                  {p.vendor?.name} · {p.category || "Uncategorised"} · {kes(p.price)} · {p.stock} in stock
                </span>
              </div>
              {!p.vendor?.is_active && <span className="badge badge--review">vendor disabled</span>}
              <span className={`badge ${p.is_active ? "badge--paid" : "badge--cancelled"}`}>
                {p.is_active ? "live" : "hidden"}
              </span>
              <div className="order-card__actions">
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
              <form style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "0.75rem", alignItems: "flex-end" }}
                onSubmit={save}>
                <div className="field" style={{ flex: 2, minWidth: 160 }}>
                  <label>Name</label>
                  <input className="input" value={form.name} required
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="field" style={{ flex: 1, minWidth: 110 }}>
                  <label>Price (KES)</label>
                  <input className="input" type="number" min="0" step="0.01" value={form.price} required
                    onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="field" style={{ flex: 1, minWidth: 90 }}>
                  <label>Stock</label>
                  <input className="input" type="number" min="0" step="1" value={form.stock} required
                    onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                </div>
                <div className="field" style={{ flex: 1, minWidth: 120 }}>
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
    </div>
  );
}
