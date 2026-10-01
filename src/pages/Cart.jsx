import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import CartLine from "../components/CartLine";

export default function Cart() {
  const { items, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="page empty-state">
        <h1>Your cart is empty</h1>
        <p className="muted">Browse the shop and add something you like.</p>
        <Link to="/" className="btn btn--primary">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Cart</h1>
      <div className="stack">
        {items.map((item) => <CartLine key={item.productId} item={item} />)}
      </div>
      <div className="cart-summary">
        <div>
          <span className="muted" style={{ fontSize: "0.85rem" }}>Subtotal</span>
          <div><strong>KES {subtotal.toLocaleString()}</strong></div>
        </div>
        <Link to="/checkout" className="btn btn--primary">Proceed to checkout</Link>
      </div>
    </div>
  );
}
