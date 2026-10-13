import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isApprovedVendor } from "../utils/homeFor";

// Usage: <ProtectedRoute role="vendor"><VendorDashboard /></ProtectedRoute>
// `allowPending` lets unapproved vendors through (only the application status page uses it).
export default function ProtectedRoute({ children, role, allowPending = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  // Remember where the user was headed so login can send them back (e.g. /checkout)
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) {
    // A customer mid-application headed to a vendor page lands on their status instead
    const to = role === "vendor" && user.vendor_status ? "/vendor/status" : "/";
    return <Navigate to={to} replace />;
  }
  if (role === "vendor" && !allowPending && !isApprovedVendor(user)) {
    return <Navigate to="/vendor/status" replace />;
  }

  return children;
}
