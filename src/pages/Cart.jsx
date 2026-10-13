import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import CartLine from "../components/CartLine";
import useStoreConfig from "../hooks/useStoreConfig";
import { kes } from "../utils/format";

export default function Cart() {
  const { items, subtotal } = useCart();
  const config = useStoreConfig();
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const freeMin = config?.freeMin || 0;
  const toFree = freeMin - subtotal;

  if (items.length === 0) {
    return (
      <div className="page empty-state">
        <h1>Your cart is empty</h1>
        <p className="muted">Browse the shop and add something you like.</p>
        <Link to="/" className="btn btn--primary">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>
        Cart{" "}
        <span className="muted" style={{ fontWeight: 400, fontSize: "1rem" }}>
          · {count} item{count === 1 ? "" : "s"}
        </span>
      </h1>
      <div className="stack">
        {items.map((item) => (
          <CartLine key={item.productId} item={item} />
        ))}
      </div>

      <div className="card cart-total">
        {freeMin > 0 && (
          <div className="free-progress">
            <p>
              {toFree > 0 ? (
                <>
                  Add <strong>{kes(toFree)}</strong> more for free delivery
                </>
              ) : (
                <>
                  <strong>You've unlocked free delivery</strong>
                </>
              )}
            </p>
            <div className="free-progress__bar">
              <span style={{ width: `${Math.min(100, (subtotal / freeMin) * 100)}%` }} />
            </div>
          </div>
        )}
        <div className="row">
          <span className="muted">Subtotal</span>
          <strong>{kes(subtotal)}</strong>
        </div>
        <p className="field__hint" style={{ margin: "0.1rem 0 0.9rem" }}>
          Delivery is calculated at checkout once you pick your town.
        </p>
        <Link to="/checkout" className="btn btn--primary btn--block">
          Proceed to checkout
        </Link>
        <Link to="/" className="link-btn cart-total__continue">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
