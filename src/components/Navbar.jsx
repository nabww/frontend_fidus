import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { CartIcon, PowerIcon } from "./Icons";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { items } = useCart();
  const { toast } = useToast();
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  function signOut() {
    logout();
    toast("You've been signed out", { type: "info" });
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__brand">Fidus<span>.</span></Link>
      <div className="navbar__links">
        {user?.role === "customer" && <NavLink to="/orders">Orders</NavLink>}
        {user?.role === "vendor" && <NavLink to="/vendor">Dashboard</NavLink>}
        {user?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
        {!user && (
          <>
            <NavLink to="/login" className="hide-sm">Login</NavLink>
            <Link to="/register" className="btn btn--primary btn--sm">Register</Link>
          </>
        )}
        <Link to="/cart" className="icon-btn cart-link" aria-label={`Cart, ${count} items`} title="Cart">
          <CartIcon />
          {count > 0 && <span className="cart-badge">{count > 99 ? "99+" : count}</span>}
        </Link>
        <button
          className="icon-btn"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "☀" : "☾"}
        </button>
        {user && (
          <button className="icon-btn" onClick={signOut} title="Sign out" aria-label="Sign out">
            <PowerIcon />
          </button>
        )}
      </div>
    </nav>
  );
}
