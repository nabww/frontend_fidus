export const kes = (n) => `KES ${Number(n || 0).toLocaleString()}`;

export const shortDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export const shortDateTime = (d) =>
  `${shortDate(d)} ${new Date(d).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;

// Case-insensitive "does any field contain every word of the query"
export function matches(query, ...fields) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = fields.filter(Boolean).join(" ").toLowerCase();
  return words.every((w) => hay.includes(w));
}

// Order status steps — shared across customer/vendor/admin order detail pages
export const ORDER_STEPS = ["pending", "paid", "shipped", "delivered"];

// Payout status labels
export const PAYOUT_STATUS_LABELS = {
  processing: "Processing",
  paid: "Paid",
  failed: "Failed",
  review: "Under review",
};

// Vendor total for an order: sum of unit_price * quantity for a vendor's items
export function vendorTotal(order, vendorId) {
  return (order.items || [])
    .filter((i) => !vendorId || i.vendor_id === vendorId)
    .reduce((s, i) => s + i.unit_price * i.quantity, 0);
}

// Safe created_at accessor (handles both snake_case and camelCase)
export function createdAt(row) {
  return row.created_at || row.createdAt;
}
