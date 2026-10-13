import { useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    try {
      const { data } = await client.post("/auth/forgot-password", { email });
      setMessage(data.message);
      setStatus("sent");
    } catch (err) {
      setMessage(err.response?.status === 429
        ? "Too many attempts. Please wait a few minutes and try again."
        : "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Forgot your password?</h1>
        <p className="subtitle">Enter your email and we'll send you a reset link.</p>

        {status === "sent" ? (
          <p className="notice">{message}</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" className="input" type="email" required autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button className="btn btn--primary" type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending..." : "Send reset link"}
            </button>
            {status === "error" && <p className="error-text">{message}</p>}
          </form>
        )}

        <p className="auth-card__footer">
          Remembered it? <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
