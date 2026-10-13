import { useEffect, useState } from "react";
import client, { imageUrl } from "../api/client";
import { kes, PAYOUT_STATUS_LABELS } from "../utils/format";

export default function PayoutDetailModal({ payoutId, onClose, onResolve }) {
  const [payout, setPayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!payoutId) return;
    setLoading(true);
    setError("");
    client
      .get(`/payouts/${payoutId}`)
      .then((res) => setPayout(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load payout details."))
      .finally(() => setLoading(false));
  }, [payoutId]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!payoutId) return null;

  return (
    <div className="feedback-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0 }}>Payout Details</h3>
            {payout && (
              <span className="muted" style={{ fontSize: "0.82rem" }}>
                ID: {payout.id}
              </span>
            )}
          </div>
          <button className="icon-btn" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading && (
          <p className="muted" style={{ padding: "1.5rem 0", textAlign: "center" }}>
            Loading details...
          </p>
        )}
        {error && (
          <p className="error-text" style={{ padding: "1rem 0" }}>
            {error}
          </p>
        )}

        {payout && !loading && (
          <div className="modal-body">
            <div className="modal-summary-grid">
              <div>
                <span className="muted" style={{ fontSize: "0.78rem" }}>
                  Status
                </span>
                <div>
                  <span className={`badge badge--${payout.status}`} style={{ marginTop: "0.2rem" }}>
                    {PAYOUT_STATUS_LABELS[payout.status] || payout.status}
                  </span>
                </div>
              </div>
              <div>
                <span className="muted" style={{ fontSize: "0.78rem" }}>
                  Vendor
                </span>
                <strong style={{ display: "block", marginTop: "0.2rem" }}>
                  {payout.vendor?.name}
                </strong>
              </div>
              <div>
                <span className="muted" style={{ fontSize: "0.78rem" }}>
                  Payout Phone
                </span>
                <strong style={{ display: "block", marginTop: "0.2rem" }}>
                  {payout.payout_phone || "—"}
                </strong>
              </div>
              <div>
                <span className="muted" style={{ fontSize: "0.78rem" }}>
                  Triggered By
                </span>
                <span
                  style={{ display: "block", textTransform: "capitalize", marginTop: "0.2rem" }}
                >
                  {payout.triggered_by}
                </span>
              </div>
            </div>

            <div
              className="card modal-calc-card"
              style={{ padding: "0.75rem 1rem", margin: "1rem 0" }}
            >
              <div className="row">
                <span className="muted">Gross Amount</span>
                <span>{kes(payout.gross_amount)}</span>
              </div>
              <div className="row">
                <span className="muted">Commission ({Number(payout.commission_rate)}%)</span>
                <span style={{ color: "var(--danger)" }}>−{kes(payout.commission_amount)}</span>
              </div>
              <div
                className="row"
                style={{ borderBottom: "none", fontWeight: 700, fontSize: "1.05rem" }}
              >
                <span>Net Transfer</span>
                <span style={{ color: "var(--accent)" }}>{kes(payout.net_amount)}</span>
              </div>
            </div>

            <div className="modal-section">
              <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem" }}>
                M-Pesa Gateway Information
              </h4>
              <div className="modal-gateway-info">
                <div className="meta-row">
                  <span className="muted">M-Pesa Receipt / Ref:</span>
                  <strong>{payout.mpesa_transaction_id || "Awaiting callback"}</strong>
                </div>
                <div className="meta-row">
                  <span className="muted">Conversation ID:</span>
                  <span className="mono-text">{payout.conversation_id || "—"}</span>
                </div>
                <div className="meta-row">
                  <span className="muted">Originator Conv ID:</span>
                  <span className="mono-text">{payout.originator_conversation_id || "—"}</span>
                </div>
                {payout.result_code !== null && payout.result_code !== undefined && (
                  <div className="meta-row">
                    <span className="muted">Result Code:</span>
                    <span>{payout.result_code}</span>
                  </div>
                )}
                {payout.result_desc && (
                  <div className="meta-row">
                    <span className="muted">Result Desc:</span>
                    <span className="muted">{payout.result_desc}</span>
                  </div>
                )}
                <div className="meta-row">
                  <span className="muted">Initiated At:</span>
                  <span>{new Date(payout.created_at || payout.createdAt).toLocaleString()}</span>
                </div>
                <div className="meta-row">
                  <span className="muted">Last Updated:</span>
                  <span>{new Date(payout.updated_at || payout.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="modal-section" style={{ marginTop: "1rem" }}>
              <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem" }}>
                Included Order Items ({payout.items?.length || 0})
              </h4>
              <div className="modal-items-list stack">
                {(!payout.items || payout.items.length === 0) && (
                  <p className="muted" style={{ fontSize: "0.85rem" }}>
                    No items linked.
                  </p>
                )}
                {payout.items?.map((item) => (
                  <div key={item.id} className="card modal-item-row">
                    <div className="thumb" style={{ width: 44, height: 44, flexShrink: 0 }}>
                      {item.product?.image_url ? (
                        <img src={imageUrl(item.product.image_url)} alt="" loading="lazy" />
                      ) : (
                        "📦"
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong
                        className="truncate"
                        style={{ display: "block", fontSize: "0.88rem" }}
                      >
                        {item.product?.name || "Product"}
                      </strong>
                      <span className="muted" style={{ fontSize: "0.78rem" }}>
                        Order #{item.Order?.order_no || "—"} · {item.quantity} ×{" "}
                        {kes(item.unit_price)}
                        {item.Order?.fulfillment_type && ` · ${item.Order.fulfillment_type}`}
                      </span>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                      {kes(Number(item.unit_price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {onResolve && payout.status === "review" && (
              <div
                className="modal-actions"
                style={{
                  marginTop: "1.25rem",
                  display: "flex",
                  gap: "0.6rem",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => onResolve(payout, "failed")}
                >
                  Mark Failed
                </button>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={() => onResolve(payout, "paid")}
                >
                  Mark Paid
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
