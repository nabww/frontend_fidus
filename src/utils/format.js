export const kes = (n) => `KES ${Number(n || 0).toLocaleString()}`;

export const shortDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

// Case-insensitive "does any field contain every word of the query"
export function matches(query, ...fields) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = fields.filter(Boolean).join(" ").toLowerCase();
  return words.every((w) => hay.includes(w));
}
