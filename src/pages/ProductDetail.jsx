import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import client from "../api/client";
import ImageGallery from "../components/ImageGallery";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import useStoreConfig from "../hooks/useStoreConfig";
import { kes } from "../utils/format";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const config = useStoreConfig();
  const [product, setProduct] = useState(null);
  // Opened from a shared link? "Back" would leave the site — go to the shop instead
  const goBack = () => (location.key === "default" ? navigate("/") : navigate(-1));
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const { addToCart, updateQuantity, items } = useCart();

  useEffect(() => {
    setProduct(null);
    setQty(1);
    client
      .get(`/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch(() => setError("Product not found."));
  }, [id]);

  if (error) {
    return (
      <div className="page empty-state">
        <h1>Product not found</h1>
        <Link to="/" className="btn btn--primary">
          Back to shop
        </Link>
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
            <div
              className="shimmer"
              style={{ height: 14, width: "90%", borderRadius: 4, marginTop: 16 }}
            />
            <div
              className="shimmer"
              style={{ height: 14, width: "60%", borderRadius: 4, marginTop: 8 }}
            />
          </div>
        </div>
      </div>
    );
  }

  const inCart = items.find((i) => i.productId === product.id);
  const soldOut = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= 5;
  const isOwnProduct = user?.role === "vendor" && product.vendor_id === user.id;

  const stepper = inCart ? (
    <div className="cart-item__stepper">
      <button
        className="icon-btn"
        aria-label="Decrease quantity"
        onClick={() => updateQuantity(product.id, inCart.quantity - 1)}
      >
        −
      </button>
      <span aria-live="polite">{inCart.quantity}</span>
      <button
        className="icon-btn"
        aria-label="Increase quantity"
        disabled={inCart.quantity >= product.stock}
        onClick={() => updateQuantity(product.id, inCart.quantity + 1)}
      >
        +
      </button>
    </div>
  ) : (
    <div className="cart-item__stepper">
      <button
        className="icon-btn"
        aria-label="Decrease quantity"
        disabled={qty <= 1}
        onClick={() => setQty(qty - 1)}
      >
        −
      </button>
      <span aria-live="polite">{qty}</span>
      <button
        className="icon-btn"
        aria-label="Increase quantity"
        disabled={qty >= product.stock}
        onClick={() => setQty(qty + 1)}
      >
        +
      </button>
    </div>
  );

  const action = inCart ? (
    <Link to="/cart" className="btn btn--ghost">
      In cart · View cart
    </Link>
  ) : (
    <button className="btn btn--primary" onClick={() => addToCart(product, qty)}>
      Add to cart
    </button>
  );

  return (
    <div className="page page--wide">
      <button className="link-btn back-link" onClick={goBack}>
        ← Back
      </button>

      <div className="pd-grid">
        <ImageGallery
          alt={product.name}
          images={
            product.images?.length
              ? product.images.map((i) => i.url)
              : product.image_url
                ? [product.image_url]
                : []
          }
        />

        <div className="pd-info">
          {product.category && (
            <p className="product-card__cat" style={{ marginTop: 0 }}>
              {product.category}
            </p>
          )}
          <h1 className="pd-title">{product.name}</h1>
          {product.discount_active ? (
            <p className="pd-price">
              <span className="price--old">{kes(product.price)}</span>{" "}
              {kes(product.effective_price)}
              <span className="discount-badge" style={{ marginLeft: "0.5rem" }}>
                -{product.discount_percent}%
              </span>
            </p>
          ) : (
            <p className="pd-price">{kes(product.price)}</p>
          )}
          <p
            className={soldOut || lowStock ? "stock-hint" : "muted"}
            style={{ fontSize: "0.88rem", margin: 0 }}
          >
            {soldOut ? "Out of stock" : lowStock ? `Only ${product.stock} left` : "In stock"}
          </p>

          {isOwnProduct && !soldOut && (
            <div className="pd-vendor-actions">
              <Link to={`/vendor/pos?product=${product.id}`} className="btn btn--primary">
                Direct sale
              </Link>
              <Link to={`/vendor/products/${product.id}/edit`} className="btn btn--ghost">
                Edit listing
              </Link>
            </div>
          )}

          {!soldOut && !isOwnProduct && (
            <div className="pd-actions">
              {stepper}
              {action}
            </div>
          )}

          <ul className="pd-perks">
            <li>
              <strong>Delivery</strong>
              <span>
                {config?.minFee != null
                  ? config.minFee === 0
                    ? "Free to selected towns"
                    : `From ${kes(config.minFee)}, priced by town`
                  : "Countrywide, priced by town"}
                {config?.freeMin > 0 && ` · free over ${kes(config.freeMin)}`}
              </span>
            </li>
            <li>
              <strong>Pay with M-Pesa</strong>
              <span>Approve on your phone, no card needed</span>
            </li>
            <li>
              <strong>Track your order</strong>
              <span>Courier details as soon as it ships</span>
            </li>
          </ul>

          {product.description && (
            <div className="pd-desc">
              <h2 className="section-title">Details</h2>
              <p className="muted">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: keep the purchase action reachable without scrolling */}
      {!soldOut && !isOwnProduct && (
        <div className="pd-sticky">
          <div>
            <div style={{ fontWeight: 600 }}>
              {product.discount_active ? (
                <>
                  <span className="price--old">{kes(product.price)}</span>{" "}
                  {kes(product.effective_price)}
                </>
              ) : (
                kes(product.price)
              )}
            </div>
            <div className="muted" style={{ fontSize: "0.78rem" }}>
              {product.name}
            </div>
          </div>
          {stepper}
          {action}
        </div>
      )}
      {!soldOut && isOwnProduct && (
        <div className="pd-sticky">
          <div>
            <div style={{ fontWeight: 600 }}>
              {product.discount_active ? (
                <>
                  <span className="price--old">{kes(product.price)}</span>{" "}
                  {kes(product.effective_price)}
                </>
              ) : (
                kes(product.price)
              )}
            </div>
            <div className="muted" style={{ fontSize: "0.78rem" }}>
              {product.name}
            </div>
          </div>
          <Link to={`/vendor/pos?product=${product.id}`} className="btn btn--primary">
            Sell
          </Link>
        </div>
      )}
    </div>
  );
}
