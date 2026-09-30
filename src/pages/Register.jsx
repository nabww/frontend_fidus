import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "customer" });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const user = await register(form);
      navigate(user.role === "vendor" ? "/vendor/dashboard" : "/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  }

  return (
    <div className="page">
      <h1>Create an account</h1>
      <form onSubmit={handleSubmit}>
        <input placeholder="Full name" required value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Email" type="email" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Phone" required value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input placeholder="Password" type="password" required value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <label>
          <input type="checkbox" checked={form.role === "vendor"}
            onChange={(e) => setForm({ ...form, role: e.target.checked ? "vendor" : "customer" })} />
          Register as a vendor
        </label>
        <button type="submit">Register</button>
        {error && <p>{error}</p>}
      </form>
    </div>
  );
}
