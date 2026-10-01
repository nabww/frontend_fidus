import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { CartIcon, MoonIcon, PowerIcon, SunIcon } from "./Icons";

const ROLE_LINK = {
  customer: { to: "/orders", label: "Orders" },
  vendor: { to: "/vendor", label: "Dashboard" },
  admin: { to: "/admin", label: "Admin" },
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { items, bump } = useCart();
  const { toast } = useToast();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const roleLink = user && ROLE_LINK[user.role];
  const initial = (user?.name || user?.email || "?").trim().charAt(0).toUpperCase();

  // Solid background + faint shadow once the page scrolls under the bar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the account menu on navigation, outside click or Esc
  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function signOut() {
    setMenuOpen(false);
    logout();
    toast("You've been signed out", { type: "info" });
  }

  const themeLabel = theme === "dark" ? "Light mode" : "Dark mode";
  const ThemeIcon = theme === "dark" ? SunIcon : MoonIcon;

  return (
    <nav className={`navbar${scrolled ? " is-scrolled" : ""}`}>
      <div className="navbar__inner">
        <Link to="/" className="navbar__brand">Fidus<span>.</span></Link>

        <div className="navbar__links">
          {roleLink && <NavLink to={roleLink.to} className="nav-link hide-sm">{roleLink.label}</NavLink>}
          {!user && <NavLink to="/login" className="nav-link hide-sm">Login</NavLink>}

          <Link to="/cart" className="nav-icon cart-link" aria-label={`Cart, ${count} items`} title="Cart">
            {/* Re-keying on each add remounts the wrapper, replaying the bob */}
            <span key={bump} className={`cart-icon${bump ? " is-bobbing" : ""}`}>
              <CartIcon />
            </span>
            {count > 0 && (
              <span key={`b${bump}`} className={`cart-badge${bump ? " is-popping" : ""}`}>
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>

          {!user && (
            <>
              <button className="nav-icon" onClick={toggleTheme} title={themeLabel} aria-label={themeLabel}>
                <ThemeIcon />
              </button>
              <Link to="/register" className="btn btn--primary btn--sm">Register</Link>
            </>
          )}

          {user && (
            <div className="account" ref={menuRef}>
              <button
                className={`account__trigger${menuOpen ? " is-open" : ""}`}
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Account menu"
              >
                {initial}
              </button>
              {menuOpen && (
                <div className="account__menu" role="menu">
                  <div className="account__who">
                    <strong className="truncate">{user.name || "Your account"}</strong>
                    <span className="muted truncate">{user.email}</span>
                  </div>
                  {roleLink && (
                    <Link to={roleLink.to} className="account__item" role="menuitem">{roleLink.label}</Link>
                  )}
                  <button className="account__item" role="menuitem" onClick={toggleTheme}>
                    <ThemeIcon /> {themeLabel}
                  </button>
                  <button className="account__item account__item--danger" role="menuitem" onClick={signOut}>
                    <PowerIcon /> Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
