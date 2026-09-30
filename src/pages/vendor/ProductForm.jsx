import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../../api/client";

export default function ProductForm() {
  const { id } = useParams(); // present when editing
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", description: "", category: "", price: "", stock: "", image_url: "",
  });

  useEffect(() => {
    if (id) client.get(`/products/${id}`).then((res) => setForm(res.data));
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (id) {
      await client.put(`/products/${id}`, form);
    } else {
      await client.post("/products", form);
    }
    navigate("/vendor/dashboard");
  }

  return (
    <div className="page">
      <h1>{id ? "Edit product" : "Add product"}</h1>
      <form onSubmit={handleSubmit}>
        <input placeholder="Name" required value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <textarea placeholder="Description" value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input placeholder="Category" value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <input placeholder="Price (KES)" type="number" required value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <input placeholder="Stock quantity" type="number" required value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        <input placeholder="Image URL" value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
        <button type="submit">{id ? "Save changes" : "Add product"}</button>
      </form>
    </div>
  );
}
