import { Link } from "react-router-dom";
import { imageUrl } from "../api/client";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { TrashIcon } from "./Icons";

// Shared cart row used by Cart and Checkout
export default function CartLine({ item, disabled = false }) {
  const { updateQuantity, removeFromCart } = useCart();
  const { toast } = useToast();

  function remove() {
    removeFromCart(item.productId);
    toast(`${item.name} removed`, { type: "info" });
  }
  const atMax = item.stock != null && item.quantity >= item.stock;

  return (
    <div className="card cart-item">
      <Link to={`/products/${item.productId}`} className="cart-item__thumb">
        {item.image_url ? <img src={imageUrl(item.image_url)} alt={item.name} loading="lazy" /> : "◆"}
      </Link>
      <div className="cart-item__info">
        <Link to={`/products/${item.productId}`} className="cart-item__name">{item.name}</Link>
        <span className="muted">KES {Number(item.price).toLocaleString()}</span>
      </div>
      <div className="cart-item__stepper">
        <button type="button" className="icon-btn" disabled={disabled} aria-label="Decrease quantity"
          onClick={() => updateQuantity(item.productId, item.quantity - 1)}>−</button>
        <span aria-live="polite">{item.quantity}</span>
        <button type="button" className="icon-btn" disabled={disabled || atMax} aria-label="Increase quantity"
          onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
      </div>
      <span className="cart-item__total">KES {(item.price * item.quantity).toLocaleString()}</span>
      <button type="button" className="delete-btn cart-item__delete" title="Remove item"
        aria-label={`Remove ${item.name}`} disabled={disabled}
        onClick={remove}>
        <TrashIcon />
      </button>
    </div>
  );
}
