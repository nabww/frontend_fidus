import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorOrders from "./pages/vendor/VendorOrders";
import VendorOrderDetail from "./pages/vendor/VendorOrderDetail";
import VendorProducts from "./pages/vendor/VendorProducts";
import ProductForm from "./pages/vendor/ProductForm";
import NotFound from "./pages/NotFound";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminVendors from "./pages/admin/AdminVendors";
import AdminVendorDetail from "./pages/admin/AdminVendorDetail";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminPayouts from "./pages/admin/AdminPayouts";
import AdminShipping from "./pages/admin/AdminShipping";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/vendor" element={
          <ProtectedRoute role="vendor"><VendorDashboard /></ProtectedRoute>
        } />
        <Route path="/vendor/dashboard" element={<Navigate to="/vendor" replace />} />
        <Route path="/vendor/orders" element={
          <ProtectedRoute role="vendor"><VendorOrders /></ProtectedRoute>
        } />
        <Route path="/vendor/orders/:id" element={
          <ProtectedRoute role="vendor"><VendorOrderDetail /></ProtectedRoute>
        } />
        <Route path="/vendor/products" element={
          <ProtectedRoute role="vendor"><VendorProducts /></ProtectedRoute>
        } />
        <Route path="/vendor/products/new" element={
          <ProtectedRoute role="vendor"><ProductForm /></ProtectedRoute>
        } />
        <Route path="/vendor/products/:id/edit" element={
          <ProtectedRoute role="vendor"><ProductForm /></ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute role="admin"><AdminOverview /></ProtectedRoute>
        } />
        <Route path="/admin/vendors" element={
          <ProtectedRoute role="admin"><AdminVendors /></ProtectedRoute>
        } />
        <Route path="/admin/vendors/:id" element={
          <ProtectedRoute role="admin"><AdminVendorDetail /></ProtectedRoute>
        } />
        <Route path="/admin/customers" element={
          <ProtectedRoute role="admin"><AdminCustomers /></ProtectedRoute>
        } />
        <Route path="/admin/orders" element={
          <ProtectedRoute role="admin"><AdminOrders /></ProtectedRoute>
        } />
        <Route path="/admin/products" element={
          <ProtectedRoute role="admin"><AdminProducts /></ProtectedRoute>
        } />
        <Route path="/admin/delivery" element={
          <ProtectedRoute role="admin"><AdminShipping /></ProtectedRoute>
        } />
        <Route path="/admin/payouts" element={
          <ProtectedRoute role="admin"><AdminPayouts /></ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
