import { useEffect, useState } from "react";
import { MessageCircle, Phone, Save, Truck } from "lucide-react";
import { api } from "../api";
import PageHead from "./PageHead";
import PasswordInput from "../components/PasswordInput";

export default function Settings() {
  const [s, setS] = useState(null);
  const [msg, setMsg] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [contactBusy, setContactBusy] = useState(false);
  useEffect(() => { api.getSettings().then(setS).catch(() => {}); }, []);
  if (!s) return <PageHead title="Store Settings" subtitle="Loading…" />;
  const up = (k, v) => setS({ ...s, [k]: v });

  const save = async (e) => {
    e.preventDefault();
    try { setS(await api.saveSettings(s)); setMsg("Settings saved"); } catch { setMsg("Could not save settings"); }
    setTimeout(() => setMsg(""), 2500);
  };
  const saveContact = async () => {
    const contactNumber = (s.contact_number || "").trim();
    if (!contactNumber) {
      setContactMsg("Enter a contact number first");
      return;
    }
    setContactBusy(true);
    setContactMsg("");
    try {
      const updated = await api.saveSettings({ contact_number: contactNumber });
      setS((current) => ({ ...current, ...updated }));
      setContactMsg("Contact number updated");
    } catch {
      setContactMsg("Could not update contact number");
    } finally {
      setContactBusy(false);
      setTimeout(() => setContactMsg(""), 2500);
    }
  };
  const testLink = `https://wa.me/${(s.whatsapp_number || "").replace(/\D/g, "").replace(/^0/, "92")}?text=${encodeURIComponent("✅ AFC test: WhatsApp notifications are set up.")}`;

  return (
    <>
      <PageHead title="Store Settings" subtitle="Contact details, delivery fee and WhatsApp notifications" />
      <form className="settings" onSubmit={save}>
        <section className="card">
          <h3><Phone size={20} /> Contact details</h3>
          <label>Customer support phone number<input value={s.contact_number || ""} onChange={(e) => up("contact_number", e.target.value)} placeholder="03357898714" inputMode="tel" maxLength={20} /></label>
          <p className="muted">This number appears on the website for customers who want to call.</p>
          <div className="save-row">
            <button type="button" className="btn btn-grad" onClick={saveContact} disabled={contactBusy}>
              <Save size={17} /> {contactBusy ? "Updating…" : "Update contact number"}
            </button>
            {contactMsg && <span className={contactMsg.startsWith("Could not") || contactMsg.startsWith("Enter") ? "alert-err" : "ok"} role="status">{contactMsg}</span>}
          </div>
        </section>
        <section className="card">
          <h3><Truck size={20} /> Delivery settings</h3>
          <label>Delivery fee (PKR)<input type="number" min="0" value={s.delivery_fee} onChange={(e) => up("delivery_fee", e.target.value)} /></label>
        </section>
        <section className="card">
          <h3><MessageCircle size={20} /> WhatsApp notifications</h3>
          <label>Admin WhatsApp number<input value={s.whatsapp_number} onChange={(e) => up("whatsapp_number", e.target.value)} placeholder="03454996160" inputMode="tel" /></label>
          <p className="muted">Every new order creates a ready WhatsApp message for this number (Order ID, items, total, customer, phone, address, Cash on Delivery).
            {s.whatsapp_number && <> <a href={testLink} target="_blank" rel="noreferrer" className="link-orange">Send a test message</a></>}</p>
          <h4>WhatsApp Business API (automatic sending)</h4>
          <label className="check"><input type="checkbox" checked={s.wa_api_enabled} onChange={(e) => up("wa_api_enabled", e.target.checked)} /> Send new-order messages automatically</label>
          <div className="two">
            <label>Phone Number ID<input value={s.wa_phone_number_id} onChange={(e) => up("wa_phone_number_id", e.target.value)} /></label>
            <label>Business Account ID<input value={s.wa_business_account_id} onChange={(e) => up("wa_business_account_id", e.target.value)} /></label>
          </div>
          <div className="password-field"><label htmlFor="wa-access-token">Access token</label><PasswordInput id="wa-access-token" label="access token" value={s.wa_access_token} onChange={(e) => up("wa_access_token", e.target.value)} autoComplete="off" /></div>
          <p className="muted">Leave this off to stay in demo mode. When on and filled in, the server sends the message through Meta’s WhatsApp Cloud API.</p>
        </section>
        <div className="save-row"><button className="btn btn-grad btn-lg"><Save size={18} /> Save settings</button>{msg && <span className="ok" role="status">{msg}</span>}</div>
      </form>
    </>
  );
}
