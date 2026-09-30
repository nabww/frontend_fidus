import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const { items, removeFromCart, subtotal } = useCart();

  if (items.length === 0) return <div className="page"><p>Your cart is empty.</p></div>;

  return (
    <div className="page">
      <h1>Cart</h1>
      {items.map((item) => (
        <div key={item.productId} className="cart-row">
          <span>{item.name} × {item.quantity}</span>
          <span>KES {(item.price * item.quantity).toLocaleString()}</span>
          <button onClick={() => removeFromCart(item.productId)}>Remove</button>
        </div>
      ))}
      <p><strong>Subtotal: KES {subtotal.toLocaleString()}</strong></p>
      <Link to="/checkout"><button>Proceed to checkout</button></Link>
    </div>
  );
}
