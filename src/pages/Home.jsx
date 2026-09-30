import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    client.get("/products", { params: { search } }).then((res) => setProducts(res.data));
  }, [search]);

  return (
    <div className="page">
      <input
        placeholder="Search products"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="product-grid">
        {products.map((p) => (
          <Link key={p.id} to={`/products/${p.id}`} className="product-card">
            <div className="product-card__image-placeholder" />
            <p className="product-card__name">{p.name}</p>
            <p className="product-card__price">KES {Number(p.price).toLocaleString()}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
