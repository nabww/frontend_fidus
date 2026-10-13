import { useEffect, useState } from "react";
import client from "../../api/client";
import DashboardShell from "../../components/DashboardShell";
import { useToast } from "../../context/ToastContext";

// M-Pesa configuration fields the admin can edit at runtime.
// Plain fields are shown as-is; secret fields are masked on load.
const FIELDS = [
  { key: "mpesa_env", label: "Environment", type: "select", options: ["sandbox", "production"], group: "general" },
  { key: "mpesa_shortcode", label: "STK Shortcode", placeholder: "174379", group: "general" },
  { key: "mpesa_transaction_type", label: "Collection Type", type: "select", options: ["CustomerPayBillOnline", "CustomerBuyGoodsOnline"], group: "general" },
  { key: "mpesa_till_number", label: "Till Number", placeholder: "Only for Buy Goods collections", group: "general" },
  { key: "mpesa_b2c_shortcode", label: "B2C Shortcode", placeholder: "600992", group: "general" },
  { key: "mpesa_consumer_key", label: "Consumer Key", secret: true, group: "auth" },
  { key: "mpesa_consumer_secret", label: "Consumer Secret", secret: true, group: "auth" },
  { key: "mpesa_passkey", label: "STK Passkey", secret: true, group: "auth" },
  { key: "mpesa_initiator_name", label: "Initiator Name", placeholder: "testapi", group: "b2c" },
  { key: "mpesa_stk_callback_url", label: "STK Callback URL", placeholder: "https://your-domain/api/payments/stk-callback", group: "callbacks" },
  { key: "mpesa_b2c_callback_url", label: "B2C Callback URL", placeholder: "https://your-domain/api/payments/b2c-callback", group: "callbacks" },
  { key: "mpesa_b2c_timeout_url", label: "B2C Timeout URL", placeholder: "auto-derived if empty", group: "callbacks" },
  { key: "mpesa_callback_secret", label: "Callback Secret", secret: true, placeholder: "Required in production", group: "callbacks" },
];

const GROUPS = [
  { id: "general", label: "General" },
  { id: "auth", label: "API Credentials" },
  { id: "b2c", label: "B2C / Payouts" },
  { id: "callbacks", label: "Callback URLs" },
];

export default function AdminSettings() {
  const { toast } = useToast();
  const [form, setForm] = useState({});
  const [meta, setMeta] = useState({});     // _set flags, _env_fallbacks
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const [initPassword, setInitPassword] = useState("");
  const [dirty, setDirty] = useState({});
  const [posRate, setPosRate] = useState("1.5");
  const [passShipping, setPassShipping] = useState(false);
  const [posSaving, setPosSaving] = useState(false);
  // SMTP
  const [smtp, setSmtp] = useState({ smtp_host: "", smtp_port: "587", smtp_user: "", smtp_pass: "", smtp_from: "" });
  const [smtpMeta, setSmtpMeta] = useState({});
  const [smtpDirty, setSmtpDirty] = useState({});
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testBusy, setTestBusy] = useState(false);

  async function load() {
    try {
      const [mpesaRes, posRes, smtpRes] = await Promise.all([
        client.get("/admin/settings/mpesa"),
        client.get("/admin/settings/pos"),
        client.get("/admin/settings/smtp"),
      ]);
      const f = {};
      for (const field of FIELDS) {
        f[field.key] = mpesaRes.data[field.key] || "";
      }
      setForm(f);
      setMeta(mpesaRes.data);
      setDirty({});
      setPosRate(String(posRes.data.pos_commission_rate ?? "1.5"));
      setPassShipping(Boolean(posRes.data.pass_shipping_to_vendor));
      setSmtp({
        smtp_host: smtpRes.data.smtp_host || "",
        smtp_port: smtpRes.data.smtp_port || "587",
        smtp_user: smtpRes.data.smtp_user || "",
        smtp_pass: smtpRes.data.smtp_pass || "",
        smtp_from: smtpRes.data.smtp_from || "",
      });
      setSmtpMeta(smtpRes.data);
      setSmtpDirty({});
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't load settings", { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty((d) => ({ ...d, [key]: true }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      // Only send changed fields
      const payload = {};
      for (const key of Object.keys(dirty)) {
        if (form[key] !== undefined) payload[key] = form[key];
      }
      if (initPassword) payload.mpesa_initiator_password = initPassword;

      if (Object.keys(payload).length === 0) {
        toast("No changes to save", { type: "info" });
        setSaving(false);
        return;
      }

      const { data } = await client.put("/admin/settings/mpesa", payload);
      toast(data.message || "Settings saved", { type: "success" });
      setInitPassword("");
      setDirty({});
      load(); // reload masked values
    } catch (err) {
      toast(err.response?.data?.message || "Save failed", { type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate() {
    if (!initPassword) {
      toast("Enter the initiator password first", { type: "error" });
      return;
    }
    setGenBusy(true);
    try {
      const { data } = await client.post("/admin/settings/mpesa/generate-credential", { password: initPassword });
      toast(data.message || "Credential generated", { type: "success" });
      setInitPassword("");
      load();
    } catch (err) {
      toast(err.response?.data?.message || "Generation failed", { type: "error" });
    } finally {
      setGenBusy(false);
    }
  }

  async function handleSavePOS(e) {
    e.preventDefault();
    setPosSaving(true);
    try {
      const { data } = await client.put("/admin/settings/pos", {
        pos_commission_rate: Number(posRate),
        pass_shipping_to_vendor: passShipping,
      });
      toast(data.message || "POS settings saved", { type: "success" });
    } catch (err) {
      toast(err.response?.data?.message || "Save failed", { type: "error" });
    } finally {
      setPosSaving(false);
    }
  }

  function handleSmtpChange(key, value) {
    setSmtp((s) => ({ ...s, [key]: value }));
    setSmtpDirty((d) => ({ ...d, [key]: true }));
  }

  async function handleSaveSmtp(e) {
    e.preventDefault();
    setSmtpSaving(true);
    try {
      const payload = {};
      for (const key of Object.keys(smtpDirty)) {
        if (smtp[key] !== undefined) payload[key] = smtp[key];
      }
      if (Object.keys(payload).length === 0) {
        toast("No changes to save", { type: "info" });
        setSmtpSaving(false);
        return;
      }
      const { data } = await client.put("/admin/settings/smtp", payload);
      toast(data.message || "SMTP settings saved", { type: "success" });
      setSmtpDirty({});
      load();
    } catch (err) {
      toast(err.response?.data?.message || "Save failed", { type: "error" });
    } finally {
      setSmtpSaving(false);
    }
  }

  async function handleTestSmtp() {
    if (!testEmail.trim()) return toast("Enter a recipient email", { type: "error" });
    setTestBusy(true);
    try {
      const { data } = await client.post("/admin/settings/smtp/test", { to: testEmail });
      toast(data.message || "Test email sent", { type: "success" });
    } catch (err) {
      toast(err.response?.data?.message || "Test failed", { type: "error" });
    } finally {
      setTestBusy(false);
    }
  }

  if (loading) {
    return (
      <DashboardShell area="admin">
        <p className="muted">Loading settings...</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell area="admin">
      <form onSubmit={handleSave}>
        <div className="settings-header">
          <h2 className="section-title">M-Pesa Configuration</h2>
          <p className="muted" style={{ margin: "0.25rem 0 1rem" }}>
            Update credentials and callback URLs without restarting the server.
            Secret values are encrypted at rest. Fields left blank fall back to <code>.env</code>.
          </p>
        </div>

        {GROUPS.map((group) => {
          const fields = FIELDS.filter((f) => f.group === group.id);
          if (fields.length === 0) return null;
          return (
            <div key={group.id} className="card settings-group" style={{ marginBottom: "1rem" }}>
              <h3 className="settings-group__title">{group.label}</h3>
              <div className="settings-fields">
                {fields.map((field) => (
                  <div key={field.key} className="field">
                    <label htmlFor={field.key}>
                      {field.label}
                      {meta[`${field.key}_set`] && <span className="badge badge--ok" style={{ marginLeft: 6 }}>set</span>}
                      {meta._env_fallbacks?.[field.key] && !meta[`${field.key}_set`] && (
                        <span className="badge" style={{ marginLeft: 6 }}>.env</span>
                      )}
                    </label>
                    {field.type === "select" ? (
                      <select
                        id={field.key}
                        className="input"
                        value={form[field.key] || ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                      >
                        {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        id={field.key}
                        className="input"
                        type={field.secret ? "password" : "text"}
                        autoComplete="off"
                        placeholder={field.placeholder || ""}
                        value={form[field.key] || ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>

              {group.id === "b2c" && (
                <div className="settings-credential">
                  <div className="field">
                    <label htmlFor="init_password">
                      Initiator Password
                      <span className="muted" style={{ fontWeight: "normal", marginLeft: 6 }}>
                        (generates SecurityCredential automatically)
                      </span>
                    </label>
                    <div className="inline-form" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
                      <input
                        id="init_password"
                        className="input"
                        type="password"
                        autoComplete="off"
                        placeholder="e.g. Safaricom999!*!"
                        value={initPassword}
                        onChange={(e) => setInitPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn--ghost"
                        disabled={genBusy || !initPassword}
                        onClick={handleGenerate}
                      >
                        {genBusy ? "Generating..." : "Generate Credential"}
                      </button>
                    </div>
                    {meta.mpesa_security_credential_set && (
                      <p className="muted" style={{ margin: "0.4rem 0 0", fontSize: "0.85rem" }}>
                        Security credential is configured ({meta.mpesa_security_credential}).
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="settings-actions">
          <button
            type="submit"
            className="btn btn--primary"
            disabled={saving || (Object.keys(dirty).length === 0 && !initPassword)}
          >
            {saving ? "Saving..." : "Save All Changes"}
          </button>
        </div>
      </form>

      <form onSubmit={handleSavePOS} style={{ marginTop: "2rem" }}>
        <div className="settings-header">
          <h2 className="section-title">Direct Sales</h2>
          <p className="muted" style={{ margin: "0.25rem 0 1rem" }}>
            Commission rate applied to vendor direct sale orders.
            Regular online commission is set per-vendor or via <code>PLATFORM_COMMISSION_RATE</code> in <code>.env</code>.
          </p>
        </div>
        <div className="card settings-group" style={{ marginBottom: "1rem" }}>
          <div className="settings-fields">
            <div className="field">
              <label htmlFor="pos_commission_rate">Direct Sale Commission Rate (%)</label>
              <input
                id="pos_commission_rate"
                className="input"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={posRate}
                onChange={(e) => setPosRate(e.target.value)}
              />
              <p className="muted" style={{ fontSize: "0.8rem", margin: "0.3rem 0 0" }}>
                Applied to all direct sales. Default is 1.5%.
              </p>
            </div>
            <div className="field">
              <label htmlFor="pass_shipping_to_vendor" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  id="pass_shipping_to_vendor"
                  type="checkbox"
                  checked={passShipping}
                  onChange={(e) => setPassShipping(e.target.checked)}
                />
                Pass delivery fees to vendors
              </label>
              <p className="muted" style={{ fontSize: "0.8rem", margin: "0.3rem 0 0" }}>
                When on, a delivered order whose items all belong to one vendor adds its delivery
                fee to that vendor's payout (no commission on it). Multi-vendor orders keep the fee.
              </p>
            </div>
          </div>
        </div>
        <div className="settings-actions">
          <button type="submit" className="btn btn--primary" disabled={posSaving}>
            {posSaving ? "Saving..." : "Save Direct Sale Settings"}
          </button>
        </div>
      </form>
      <form onSubmit={handleSaveSmtp} style={{ marginTop: "2rem" }}>
        <div className="settings-header">
          <h2 className="section-title">Email (SMTP)</h2>
          <p className="muted" style={{ margin: "0.25rem 0 1rem" }}>
            Configure outbound email so order confirmations, payout notifications, and password resets
            reach real inboxes. Without SMTP, emails are logged to the console (dev mode).
            Fields left blank fall back to <code>.env</code>.
          </p>
        </div>
        <div className="card settings-group" style={{ marginBottom: "1rem" }}>
          <h3 className="settings-group__title">SMTP Server</h3>
          <div className="settings-fields">
            <div className="field">
              <label htmlFor="smtp_host">
                Host
                {smtpMeta._env_fallbacks?.smtp_host && !smtpMeta.smtp_host && (
                  <span className="badge" style={{ marginLeft: 6 }}>.env</span>
                )}
              </label>
              <input id="smtp_host" className="input" placeholder="e.g. smtp.gmail.com"
                value={smtp.smtp_host} onChange={(e) => handleSmtpChange("smtp_host", e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="smtp_port">Port</label>
              <input id="smtp_port" className="input" type="number" min="1" max="65535"
                placeholder="587" value={smtp.smtp_port}
                onChange={(e) => handleSmtpChange("smtp_port", e.target.value)} />
              <p className="muted" style={{ fontSize: "0.8rem", margin: "0.2rem 0 0" }}>
                587 (STARTTLS) or 465 (SSL/TLS)
              </p>
            </div>
          </div>
        </div>
        <div className="card settings-group" style={{ marginBottom: "1rem" }}>
          <h3 className="settings-group__title">Authentication</h3>
          <div className="settings-fields">
            <div className="field">
              <label htmlFor="smtp_user">
                Username
                {smtpMeta._env_fallbacks?.smtp_user && !smtpMeta.smtp_user && (
                  <span className="badge" style={{ marginLeft: 6 }}>.env</span>
                )}
              </label>
              <input id="smtp_user" className="input" placeholder="e.g. you@gmail.com"
                value={smtp.smtp_user} onChange={(e) => handleSmtpChange("smtp_user", e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="smtp_pass">
                Password
                {smtpMeta.smtp_pass_set && <span className="badge badge--ok" style={{ marginLeft: 6 }}>set</span>}
                {smtpMeta._env_fallbacks?.smtp_pass && !smtpMeta.smtp_pass_set && (
                  <span className="badge" style={{ marginLeft: 6 }}>.env</span>
                )}
              </label>
              <input id="smtp_pass" className="input" type="password" autoComplete="off"
                placeholder="App password or SMTP password"
                value={smtp.smtp_pass} onChange={(e) => handleSmtpChange("smtp_pass", e.target.value)} />
            </div>
          </div>
        </div>
        <div className="card settings-group" style={{ marginBottom: "1rem" }}>
          <h3 className="settings-group__title">Sender</h3>
          <div className="settings-fields">
            <div className="field">
              <label htmlFor="smtp_from">
                From address
                {smtpMeta._env_fallbacks?.smtp_from && !smtpMeta.smtp_from && (
                  <span className="badge" style={{ marginLeft: 6 }}>.env</span>
                )}
              </label>
              <input id="smtp_from" className="input" placeholder='Fidus <no-reply@yourdomain.com>'
                value={smtp.smtp_from} onChange={(e) => handleSmtpChange("smtp_from", e.target.value)} />
            </div>
          </div>
        </div>
        <div className="settings-actions" style={{ gap: "0.75rem" }}>
          <button type="submit" className="btn btn--primary"
            disabled={smtpSaving || Object.keys(smtpDirty).length === 0}>
            {smtpSaving ? "Saving..." : "Save SMTP Settings"}
          </button>
        </div>
      </form>
      <div className="card settings-group" style={{ marginTop: "1rem" }}>
        <h3 className="settings-group__title">Test</h3>
        <p className="muted" style={{ fontSize: "0.85rem", margin: "0 0 0.75rem" }}>
          Send a test email to verify your SMTP configuration works. Save settings first.
        </p>
        <div className="inline-form" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
          <input className="input" type="email" placeholder="recipient@example.com"
            value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
          <button type="button" className="btn btn--ghost" disabled={testBusy || !testEmail.trim()}
            onClick={handleTestSmtp}>
            {testBusy ? "Sending..." : "Send Test"}
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
