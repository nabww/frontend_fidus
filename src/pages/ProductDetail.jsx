import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import client from "../api/client";
import ImageGallery from "../components/ImageGallery";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const { addToCart, updateQuantity, items } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    setProduct(null);
    setQty(1);
    client.get(`/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch(() => setError("Product not found."));
  }, [id]);

  if (error) {
    return (
      <div className="page empty-state">
        <h1>Product not found</h1>
        <Link to="/" className="btn btn--primary">Back to shop</Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page page--wide">
        <div className="pd-grid">
          <div className="pd-image shimmer" />
          <div>
            <div className="shimmer" style={{ height: 28, width: "70%", borderRadius: 6 }} />
            <div className="shimmer" style={{ height: 14, width: "90%", borderRadius: 4, marginTop: 16 }} />
            <div className="shimmer" style={{ height: 14, width: "60%", borderRadius: 4, marginTop: 8 }} />
          </div>
        </div>
      </div>
    );
  }

  const inCart = items.find((i) => i.productId === product.id);
  const soldOut = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  const stepper = inCart ? (
    <div className="cart-item__stepper">
      <button className="icon-btn" aria-label="Decrease quantity"
        onClick={() => updateQuantity(product.id, inCart.quantity - 1)}>−</button>
      <span aria-live="polite">{inCart.quantity}</span>
      <button className="icon-btn" aria-label="Increase quantity" disabled={inCart.quantity >= product.stock}
        onClick={() => updateQuantity(product.id, inCart.quantity + 1)}>+</button>
    </div>
  ) : (
    <div className="cart-item__stepper">
      <button className="icon-btn" aria-label="Decrease quantity" disabled={qty <= 1}
        onClick={() => setQty(qty - 1)}>−</button>
      <span aria-live="polite">{qty}</span>
      <button className="icon-btn" aria-label="Increase quantity" disabled={qty >= product.stock}
        onClick={() => setQty(qty + 1)}>+</button>
    </div>
  );

  const action = inCart ? (
    <Link to="/cart" className="btn btn--ghost">In cart · View cart</Link>
  ) : (
    <button className="btn btn--primary" onClick={() => {
      addToCart(product, qty);
      toast(`${qty > 1 ? `${qty} × ` : ""}${product.name} added to cart`);
    }}>
      Add to cart
    </button>
  );

  return (
    <div className="page page--wide">
      <button className="link-btn back-link" onClick={() => navigate(-1)}>← Back</button>

      <div className="pd-grid">
        <ImageGallery
          alt={product.name}
          images={product.images?.length
            ? product.images.map((i) => i.url)
            : product.image_url ? [product.image_url] : []}
        />

        <div className="pd-info">
          {product.category && <p className="product-card__cat" style={{ marginTop: 0 }}>{product.category}</p>}
          <h1 className="pd-title">{product.name}</h1>
          <p className="pd-price">KES {Number(product.price).toLocaleString()}</p>
          <p className={soldOut || lowStock ? "stock-hint" : "muted"} style={{ fontSize: "0.88rem", margin: 0 }}>
            {soldOut ? "Out of stock" : lowStock ? `Only ${product.stock} left` : "In stock"}
          </p>

          {!soldOut && (
            <div className="pd-actions">
              {stepper}
              {action}
            </div>
          )}

          {product.description && (
            <div className="pd-desc">
              <h2 className="section-title">Details</h2>
              <p className="muted">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: keep the purchase action reachable without scrolling */}
      {!soldOut && (
        <div className="pd-sticky">
          <div>
            <div style={{ fontWeight: 600 }}>KES {Number(product.price).toLocaleString()}</div>
            <div className="muted" style={{ fontSize: "0.78rem" }}>{product.name}</div>
          </div>
          {stepper}
          {action}
        </div>
      )}
    </div>
  );
}
