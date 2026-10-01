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
  const [error, setError] = useState("");

  const load = () => client.get("/admin/products", { params: active ? { active } : {} })
    .then((res) => { setProducts(res.data); setError(""); })
    .catch(() => setError("Couldn't load products."));
  useEffect(() => { load(); }, [active]);

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
          <div key={p.id} className="card order-card">
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
            <button className="btn btn--ghost btn--sm" onClick={() => toggle(p)}>
              {p.is_active ? "Hide" : "Restore"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
