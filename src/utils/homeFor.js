// A vendor can only sell once an admin has approved their application
export const isApprovedVendor = (user) => user?.role === "vendor" && user.vendor_status === "approved";

// Landing page for a user right after they sign in
export function homeFor(user) {
  if (user?.role === "vendor") return isApprovedVendor(user) ? "/vendor" : "/vendor/status";
  if (user?.role === "admin") return "/admin";
  return "/";
}
