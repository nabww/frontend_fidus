// Landing page for a user right after they sign in
export function homeFor(user) {
  if (user?.role === "vendor") return "/vendor";
  if (user?.role === "admin") return "/admin";
  return "/";
}
