import client from "../api/client";

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 120_000; // outlast the ~90s STK prompt lifetime

// Poll the payment status endpoint until terminal or timeout.
// Returns { status, payment, reason } from the last poll.
export async function pollPaymentStatus(orderId) {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const { data } = await client.get(`/payments/status/${orderId}`);
    if (data.status !== "pending" || data.payment === "failed") return data;
  }
  return { status: "pending", timedOut: true };
}
