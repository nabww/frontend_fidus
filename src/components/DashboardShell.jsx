import DashboardTabs from "./DashboardTabs";

const ADMIN_TABS = [
  { to: "", label: "Overview" },
  { to: "/vendors", label: "Vendors" },
  { to: "/customers", label: "Customers" },
  { to: "/orders", label: "Orders" },
  { to: "/products", label: "Products" },
  { to: "/delivery", label: "Delivery" },
  { to: "/payouts", label: "Payouts" },
  { to: "/audit", label: "Audit" },
  { to: "/settings", label: "Settings" },
];

const VENDOR_TABS = [
  { to: "", label: "Overview" },
  { to: "/pos", label: "Direct Sale" },
  { to: "/orders", label: "Orders" },
  { to: "/products", label: "Products" },
];

const AREAS = {
  admin: { base: "/admin", title: "Admin", tabs: ADMIN_TABS, wide: true },
  vendor: { base: "/vendor", title: "Selling on Fidus", tabs: VENDOR_TABS, wide: false },
};

// Page frame for every vendor/admin screen: title, tabs, then the content.
// `back` slots a link above the title for detail pages.
export default function DashboardShell({ area, back, children }) {
  const { base, title, tabs, wide } = AREAS[area];
  return (
    <div className={`page${wide ? " page--wide" : ""}`}>
      {back}
      <h1 className="dash-title">{title}</h1>
      <DashboardTabs base={base} tabs={tabs} />
      <div className="dash-body">{children}</div>
    </div>
  );
}
