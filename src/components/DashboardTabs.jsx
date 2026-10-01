import { NavLink } from "react-router-dom";

// Sub-navigation inside the vendor/admin areas
// Usage: <DashboardTabs base="/vendor" tabs={[{ to: "", label: "Overview" }, ...]} />
export default function DashboardTabs({ base, tabs }) {
  return (
    <nav className="tabs" aria-label="Section navigation">
      {tabs.map((t) => (
        <NavLink key={t.to} to={`${base}${t.to}`} end={t.to === ""}
          className={({ isActive }) => `tab${isActive ? " tab--active" : ""}`}>
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
