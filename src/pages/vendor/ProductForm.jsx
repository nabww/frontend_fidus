import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../../api/client";
import { useToast } from "../../context/ToastContext";
import ImageManager, { existingEntries } from "../../components/ImageManager";

export default function ProductForm() {
  const { id } = useParams(); // present when editing
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "", description: "", category: "", price: "", stock: "", one_of_a_kind: false,
    discount_percent: "", discount_start: "", discount_end: "",
  });
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customCategory, setCustomCategory] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    client.get("/products/categories").then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    if (id) {
      client.get(`/products/vendor/${id}`).then(({ data }) => {
        const { name, description, category, price, stock, one_of_a_kind,
          discount_percent, discount_start, discount_end } = data;
        setForm({
          name, description, category, price, stock, one_of_a_kind: !!one_of_a_kind,
          discount_percent: discount_percent ?? "",
          discount_start: discount_start ? discount_start.slice(0, 16) : "",
          discount_end: discount_end ? discount_end.slice(0, 16) : "",
        });
        const urls = data.images?.length ? data.images.map((i) => i.url) : data.image_url ? [data.image_url] : [];
        setImages(existingEntries(urls));
      });
    }
  }, [id]);

  // Editing a product whose category isn't in the list → show the free-text input
  useEffect(() => {
    if (id && form.category && categories.length && !categories.includes(form.category)) {
      setCustomCategory(true);
    }
  }, [categories, id, form.category]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      // One multipart request: fields + new files + the final order of all images
      const payload = new FormData();
      const discountKeys = new Set(["discount_percent", "discount_start", "discount_end"]);
      Object.entries({ ...form, price: Number(form.price), stock: Number(form.stock) })
        .forEach(([k, v]) => {
          // Discount fields must be sent even when empty (so the backend can clear them)
          if (discountKeys.has(k)) {
            payload.append(k, v ?? "");
          } else if (v != null && v !== "") {
            payload.append(k, v);
          }
        });

      let fileIndex = 0;
      const order = images.map((entry) => {
        if (entry.kind === "existing") return entry.url;
        payload.append("images", entry.file);
        return `new:${fileIndex++}`;
      });
      payload.append("image_order", JSON.stringify(order));

      const headers = { "Content-Type": "multipart/form-data" };
      if (id) {
        await client.put(`/products/${id}`, payload, { headers });
      } else {
        await client.post("/products", payload, { headers });
      }
      toast(id ? "Changes saved" : "Product added");
      navigate("/vendor/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save the product.");
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <h1>{id ? "Edit product" : "Add product"}</h1>
      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" className="input" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea id="description" className="input" rows={3} value={form.description || ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="category">Category</label>
          {customCategory ? (
            <input id="category" className="input" placeholder="New category" value={form.category || ""}
              onChange={(e) => setForm({ ...form, category: e.target.value })} />
          ) : (
            <select id="category" className="input" value={form.category || ""}
              onChange={(e) => {
                if (e.target.value === "__custom__") {
                  setCustomCategory(true);
                  setForm({ ...form, category: "" });
                } else {
                  setForm({ ...form, category: e.target.value });
                }
              }}>
              <option value="">Select a category</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value="__custom__">+ New category</option>
            </select>
          )}
          {customCategory && categories.length > 0 && (
            <button type="button" className="link-btn"
              onClick={() => { setCustomCategory(false); setForm({ ...form, category: "" }); }}>
              Pick from existing categories
            </button>
          )}
        </div>
        <div className="field">
          <label htmlFor="price">Price (KES)</label>
          <input id="price" className="input" type="number" min="0" step="0.01" required value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="stock">Stock quantity</label>
          <input id="stock" className="input" type="number" min="0" required value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        </div>
        <fieldset className="discount-fieldset">
          <legend>Discount</legend>
          <div className="field">
            <label htmlFor="discount_percent">Discount (%)</label>
            <input id="discount_percent" className="input" type="number" min="0" max="99" step="1"
              placeholder="e.g. 10" value={form.discount_percent}
              onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} />
          </div>
          {form.discount_percent > 0 && (
            <div className="discount-dates">
              <div className="field">
                <label htmlFor="discount_start">Starts (optional)</label>
                <input id="discount_start" className="input" type="datetime-local"
                  value={form.discount_start}
                  onChange={(e) => setForm({ ...form, discount_start: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="discount_end">Ends (optional)</label>
                <input id="discount_end" className="input" type="datetime-local"
                  value={form.discount_end}
                  onChange={(e) => setForm({ ...form, discount_end: e.target.value })} />
              </div>
            </div>
          )}
          {form.discount_percent > 0 && form.price > 0 && (
            <p className="muted" style={{ fontSize: "0.85rem", margin: "0.35rem 0 0" }}>
              Sale price: <strong>KES {Math.round(Number(form.price) * (1 - form.discount_percent / 100)).toLocaleString()}</strong>
              {" "}(was KES {Number(form.price).toLocaleString()})
            </p>
          )}
        </fieldset>

        <div className="field">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={form.one_of_a_kind}
              onChange={(e) => setForm({ ...form, one_of_a_kind: e.target.checked })}
            />
            <span>One-of-a-kind item</span>
          </label>
          <p className="muted" style={{ fontSize: "0.8rem", margin: "0.25rem 0 0" }}>
            Unique or used items disappear from the shop when sold out instead of showing "out of stock."
          </p>
        </div>
        <div className="field">
          <label>Images</label>
          <ImageManager value={images} onChange={setImages} />
        </div>
        <button className="btn btn--primary" type="submit" disabled={busy}>
          {busy ? "Saving..." : id ? "Save changes" : "Add product"}
        </button>
        {error && <p className="error-text">{error}</p>}
      </form>
    </div>
  );
}
