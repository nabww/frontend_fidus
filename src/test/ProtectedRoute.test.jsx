import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

// Auth comes from a real API call in production — stub the hook per case
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
const { useAuth } = await import("../context/AuthContext");

function renderAt(path, element) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<div>home page</div>} />
        <Route path="/login" element={<div>login page</div>} />
        <Route path="/vendor/status" element={<div>vendor status page</div>} />
        <Route path={path} element={element} />
      </Routes>
    </MemoryRouter>
  );
}

const secret = (
  <ProtectedRoute role="vendor">
    <div>vendor area</div>
  </ProtectedRoute>
);
const approvedVendor = { role: "vendor", vendor_status: "approved" };

describe("ProtectedRoute", () => {
  it("sends guests to login", () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    renderAt("/vendor", secret);
    expect(screen.getByText("login page")).toBeInTheDocument();
    expect(screen.queryByText("vendor area")).not.toBeInTheDocument();
  });

  it("renders nothing while the session is still loading", () => {
    useAuth.mockReturnValue({ user: null, loading: true });
    const { container } = renderAt("/vendor", secret);
    expect(container).toBeEmptyDOMElement();
  });

  it("sends a customer to their vendor status page when an application exists", () => {
    useAuth.mockReturnValue({
      user: { role: "customer", vendor_status: "pending" },
      loading: false,
    });
    renderAt("/vendor", secret);
    expect(screen.getByText("vendor status page")).toBeInTheDocument();
  });

  it("sends a customer without an application back home", () => {
    useAuth.mockReturnValue({ user: { role: "customer", vendor_status: null }, loading: false });
    renderAt("/vendor", secret);
    expect(screen.getByText("home page")).toBeInTheDocument();
  });

  it("sends an unapproved vendor to the status page", () => {
    useAuth.mockReturnValue({ user: { role: "vendor", vendor_status: "pending" }, loading: false });
    renderAt("/vendor", secret);
    expect(screen.getByText("vendor status page")).toBeInTheDocument();
  });

  it("lets an approved vendor through", () => {
    useAuth.mockReturnValue({ user: approvedVendor, loading: false });
    renderAt("/vendor", secret);
    expect(screen.getByText("vendor area")).toBeInTheDocument();
  });
});
