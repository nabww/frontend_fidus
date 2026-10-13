import { Link } from "react-router-dom";
import { ChatIcon, MailIcon, PhoneIcon } from "../components/Icons";
import { SUPPORT } from "../config/support";

const FAQ = [
  {
    q: "How do I pay?",
    a: "At checkout, enter your M-Pesa number and tap Pay. You'll get a prompt on your phone — enter your M-Pesa PIN to complete the payment. Your order page updates by itself once M-Pesa confirms.",
  },
  {
    q: "I paid but my order still says “Awaiting payment”",
    a: "Confirmations from M-Pesa can take a minute or two. Leave the order page open, or come back later — we keep checking with M-Pesa automatically. Tapping “Check payment status” on the order asks M-Pesa again without charging you twice.",
  },
  {
    q: "The M-Pesa prompt never arrived",
    a: "Make sure the number at checkout is your M-Pesa line and your phone is on. If the prompt expired or you cancelled it, your order is saved — open it from My orders and tap Pay to get a new prompt.",
  },
  {
    q: "How much is delivery?",
    a: "Delivery is priced by town, and you'll see the fee as soon as you pick your town at checkout. Larger orders may qualify for free delivery — checkout tells you how close you are.",
  },
  {
    q: "How do I track my order?",
    a: "Open the order from My orders. Once the seller ships it, you'll see the courier and tracking number there, and we'll email you too.",
  },
  {
    q: "My order arrived — what now?",
    a: "Open the order and tap “Yes, I received my order”. This tells us the delivery went well and releases payment to the seller. If you don't confirm, orders are marked delivered automatically 7 days after shipping.",
  },
  {
    q: "Can I cancel an order?",
    a: "Yes, while it's awaiting payment or paid but not yet shipped — use Cancel order on the order page. If you'd already paid, our team will contact you about the refund.",
  },
  {
    q: "How do I sell on Fidus?",
    a: "Apply on the Sell on Fidus page (linked in the footer) with your business details. Our team reviews every seller before they go live, and we'll email you once you're approved.",
  },
];

export default function Help() {
  return (
    <div className="page">
      <h1>Help &amp; contact</h1>
      <p className="muted" style={{ marginTop: "-0.75rem" }}>
        Answers to common questions, and how to reach us if you need a hand.
      </p>

      <h2 className="section-title" style={{ marginTop: "1.75rem" }}>
        Contact us
      </h2>
      <div className="contact-grid">
        <a className="card contact-card" href={`mailto:${SUPPORT.email}`} aria-label="Email us">
          <span className="contact-card__icon">
            <MailIcon />
          </span>
          <strong>{SUPPORT.email}</strong>
        </a>
        <a
          className="card contact-card"
          href={`tel:${SUPPORT.phone.replace(/\s/g, "")}`}
          aria-label="Call us"
        >
          <span className="contact-card__icon">
            <PhoneIcon />
          </span>
          <strong>{SUPPORT.phone}</strong>
        </a>
        <a
          className="card contact-card"
          href={`https://wa.me/${SUPPORT.whatsapp}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat with us on WhatsApp"
        >
          <span className="contact-card__icon">
            <ChatIcon />
          </span>
          <strong>Chat with us</strong>
        </a>
      </div>
      <p className="muted" style={{ fontSize: "0.85rem", margin: "0.75rem 0 0" }}>
        We're available {SUPPORT.hours}. For an order, include its number (e.g. Order #12) so we can
        help faster.
      </p>

      <h2 className="section-title" style={{ marginTop: "2rem" }}>
        Frequently asked questions
      </h2>
      <div className="faq">
        {FAQ.map(({ q, a }) => (
          <details key={q} className="faq__item">
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>

      <p className="muted" style={{ marginTop: "1.5rem", fontSize: "0.9rem" }}>
        Looking for an order?{" "}
        <Link to="/orders" style={{ color: "var(--accent)" }}>
          Go to My orders
        </Link>
      </p>
    </div>
  );
}
