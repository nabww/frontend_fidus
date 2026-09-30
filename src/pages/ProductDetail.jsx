import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import client from "../api/client";
import { useCart } from "../context/CartContext";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    client.get(`/products/${id}`).then((res) => setProduct(res.data));
  }, [id]);

  if (!product) return <p>Loading...</p>;

  return (
    <div className="page">
      <div className="product-card__image-placeholder" style={{ height: 240 }} />
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p className="product-card__price">KES {Number(product.price).toLocaleString()}</p>
      <p>{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</p>
      <button disabled={product.stock === 0} onClick={() => addToCart(product)}>
        Add to cart
      </button>
    </div>
  );
}
