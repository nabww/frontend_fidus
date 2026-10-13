import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SUPPORT } from "../config/support";

export default function Footer() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  // Mirror of the navbar: frosted and see-through until it scrolls into view,
  // then it settles to a solid surface with a hairline border and soft shadow
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return setInView(true);
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.intersectionRatio >= 0.5),
      { threshold: [0, 0.5, 1] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <footer ref={ref} className={`footer${inView ? " is-in-view" : ""}`}>
      <div className="footer__inner">
        <div className="footer__top">
          <div className="footer__brand">
            <Link to="/" className="navbar__brand">Fidus<span>.</span></Link>
            <p className="muted">Electronics, delivered across Kenya.</p>
          </div>
          <nav className="footer__links" aria-label="Footer">
            <Link to="/">Shop</Link>
            <Link to="/help">Help &amp; contact</Link>
            <Link to="/sell">Sell on Fidus</Link>
            <Link to="/cart">Cart</Link>
          </nav>
          <div className="footer__contact">
            <a href={`mailto:${SUPPORT.email}`}>{SUPPORT.email}</a>
            <a href={`tel:${SUPPORT.phone.replace(/\s/g, "")}`}>{SUPPORT.phone}</a>
            <span className="muted">{SUPPORT.hours}</span>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} Fidus</span>
          <span>Designed and Developed by <strong>Tezi</strong></span>
        </div>
      </div>
    </footer>
  );
}
