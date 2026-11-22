import { useEffect, useState } from "react";
import { ImagePlus, KeyRound, MessageCircle, Phone, Save, UserRound } from "lucide-react";
import { api, setToken } from "../api";
import PasswordInput from "../components/PasswordInput";
import PageHead from "./PageHead";
import { resolveMediaUrl } from "../util";

export default function Profile() {
  const [account, setAccount] = useState(null);
  const [username, setUsername] = useState({ currentPassword: "", next: "" });
  const [usernameFieldsUnlocked, setUsernameFieldsUnlocked] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState({ ok: true, text: "" });
  const [usernameBusy, setUsernameBusy] = useState(false);
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
  const [message, setMessage] = useState({ ok: true, text: "" });
  const [busy, setBusy] = useState(false);
  const [siteSettings, setSiteSettings] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [logoInputKey, setLogoInputKey] = useState(0);
  const [logoMessage, setLogoMessage] = useState({ ok: true, text: "" });
  const [contactMessage, setContactMessage] = useState({ ok: true, text: "" });
  const [contactBusy, setContactBusy] = useState(false);
  const [notificationsMessage, setNotificationsMessage] = useState({ ok: true, text: "" });
  const [notificationsBusy, setNotificationsBusy] = useState(false);

  useEffect(() => { api.profile().then(setAccount).catch(() => {}); }, []);
  useEffect(() => { api.getSettings().then(setSiteSettings).catch(() => {}); }, []);
  useEffect(() => {
    if (!logoFile) { setLogoPreview(""); return; }
    const preview = URL.createObjectURL(logoFile);
    setLogoPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [logoFile]);

  const saveLogo = async (e) => {
    e.preventDefault();
    if (!logoFile) return;
    const body = new FormData();
    body.append("logo", logoFile);
    setLogoMessage({ ok: true, text: "" });
    try {
      const updatedSettings = await api.saveSettings(body);
      setSiteSettings(updatedSettings);
      setLogoFile(null);
      setLogoInputKey((key) => key + 1);
      setLogoMessage({ ok: true, text: "Website logo updated" });
      window.dispatchEvent(new CustomEvent("afc-site-logo-updated", { detail: { logo: updatedSettings.logo || null } }));
    } catch (error) {
      setLogoMessage({ ok: false, text: error.detail || "Could not update website logo" });
    }
  };

  const changeUsername = async (e) => {
    e.preventDefault();
    setUsernameBusy(true);
    setUsernameMessage({ ok: true, text: "" });
    try {
      const result = await api.changeUsername(username.currentPassword, username.next.trim());
      setAccount((current) => ({ ...current, ...result }));
      setUsername({ currentPassword: "", next: "" });
      setUsernameFieldsUnlocked(false);
      setUsernameMessage({ ok: true, text: "Username changed successfully" });
      window.dispatchEvent(new Event("afc-profile-updated"));
    } catch (error) {
      setUsernameMessage({ ok: false, text: error.detail || "Could not change username" });
    } finally {
      setUsernameBusy(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (password.next !== password.confirm) {
      setMessage({ ok: false, text: "New passwords do not match" });
      return;
    }
    setBusy(true);
    setMessage({ ok: true, text: "" });
    try {
      const result = await api.changePassword(password.current, password.next);
      setToken(result.token);
      setPassword({ current: "", next: "", confirm: "" });
      setMessage({ ok: true, text: "Password changed successfully" });
    } catch (error) {
      setMessage({ ok: false, text: error.detail || "Could not change password" });
    } finally {
      setBusy(false);
    }
  };

  const updateSetting = (key, value) => setSiteSettings((current) => ({ ...current, [key]: value }));

  const saveContact = async (event) => {
    event.preventDefault();
    const contactNumber = (siteSettings?.contact_number || "").trim();
    if (!contactNumber) {
      setContactMessage({ ok: false, text: "Enter a contact number first" });
      return;
    }
    setContactBusy(true);
    setContactMessage({ ok: true, text: "" });
    try {
      const updatedSettings = await api.saveSettings({ contact_number: contactNumber });
      setSiteSettings(updatedSettings);
      setContactMessage({ ok: true, text: "Contact number updated" });
    } catch (error) {
      setContactMessage({ ok: false, text: error.detail || "Could not update contact number" });
    } finally {
      setContactBusy(false);
    }
  };

  const saveNotifications = async (event) => {
    event.preventDefault();
    if (!siteSettings) return;
    setNotificationsBusy(true);
    setNotificationsMessage({ ok: true, text: "" });
    try {
      const updatedSettings = await api.saveSettings({
        whatsapp_number: siteSettings.whatsapp_number || "",
        wa_api_enabled: Boolean(siteSettings.wa_api_enabled),
        wa_phone_number_id: siteSettings.wa_phone_number_id || "",
        wa_business_account_id: siteSettings.wa_business_account_id || "",
        wa_access_token: siteSettings.wa_access_token || "",
      });
      setSiteSettings(updatedSettings);
      setNotificationsMessage({ ok: true, text: "WhatsApp settings saved" });
    } catch (error) {
      setNotificationsMessage({ ok: false, text: error.detail || "Could not save WhatsApp settings" });
    } finally {
      setNotificationsBusy(false);
    }
  };

  const testLink = `https://wa.me/${(siteSettings?.whatsapp_number || "").replace(/\D/g, "").replace(/^0/, "92")}?text=${encodeURIComponent("✅ AFC test: WhatsApp notifications are set up.")}`;

  return (
    <div className="profile-page">
      <PageHead title="Profile" subtitle="Your admin account, security and website branding" />
      <section className="card">
        <h3><UserRound size={20} /> Account details</h3>
        {account ? (
          <dl className="profile-info-grid">
            {[["Full name", account.full_name], ["Username", account.username], ["Email", account.email], ["Password", "Set (hidden for security)"]]
              .filter(([, value]) => value?.trim())
              .map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        ) : <p className="muted">Loading account details…</p>}
      </section>

      <section className="card">
        <h3><ImagePlus size={20} /> Website logo</h3>
        <p className="muted">Upload a square logo image. It will appear across the website and admin panel, including the header, footer, splash screen, login and browser tab.</p>
        <form className="settings" onSubmit={saveLogo}>
          <div className="brand-logo-row">
            <div className="brand-logo-preview">
              {(logoPreview || siteSettings?.logo) ? <img src={resolveMediaUrl(logoPreview || siteSettings.logo)} alt="Website logo preview" /> : <ImagePlus size={28} />}
            </div>
            <label>Choose logo image<input key={logoInputKey} type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} /></label>
          </div>
          <div className="save-row">
            <button className="btn btn-grad" disabled={!logoFile}><Save size={18} /> Save logo</button>
            {logoMessage.text && <span className={logoMessage.ok ? "ok" : "alert-err"} role="status">{logoMessage.text}</span>}
          </div>
        </form>
      </section>

      {siteSettings ? <>
        <section className="card">
          <h3><Phone size={20} /> Store contact details</h3>
          <form className="settings" onSubmit={saveContact}>
            <label>Customer support phone number<input value={siteSettings.contact_number || ""} onChange={(event) => updateSetting("contact_number", event.target.value)} placeholder="03357898714" inputMode="tel" maxLength={20} /></label>
            <p className="muted">This number appears on the website for customers who want to call.</p>
            <div className="save-row">
              <button className="btn btn-grad" disabled={contactBusy}><Save size={17} /> {contactBusy ? "Updating…" : "Update contact number"}</button>
              {contactMessage.text && <span className={contactMessage.ok ? "ok" : "alert-err"} role="status">{contactMessage.text}</span>}
            </div>
          </form>
        </section>

        <section className="card">
          <h3><MessageCircle size={20} /> WhatsApp notifications</h3>
          <form className="settings" onSubmit={saveNotifications}>
            <label>Admin WhatsApp number<input value={siteSettings.whatsapp_number || ""} onChange={(event) => updateSetting("whatsapp_number", event.target.value)} placeholder="03454996160" inputMode="tel" /></label>
            <p className="muted">Every new order creates a ready WhatsApp message for this number (Order ID, items, total, customer, phone, address, Cash on Delivery).
              {siteSettings.whatsapp_number && <> <a href={testLink} target="_blank" rel="noreferrer" className="link-orange">Send a test message</a></>}</p>
            <h4>WhatsApp Business API (automatic sending)</h4>
            <label className="check"><input type="checkbox" checked={Boolean(siteSettings.wa_api_enabled)} onChange={(event) => updateSetting("wa_api_enabled", event.target.checked)} /> Send new-order messages automatically</label>
            <div className="two">
              <label>Phone Number ID<input value={siteSettings.wa_phone_number_id || ""} onChange={(event) => updateSetting("wa_phone_number_id", event.target.value)} /></label>
              <label>Business Account ID<input value={siteSettings.wa_business_account_id || ""} onChange={(event) => updateSetting("wa_business_account_id", event.target.value)} /></label>
            </div>
            <div className="password-field"><label htmlFor="profile-wa-access-token">Access token</label><PasswordInput id="profile-wa-access-token" label="access token" value={siteSettings.wa_access_token || ""} onChange={(event) => updateSetting("wa_access_token", event.target.value)} autoComplete="off" /></div>
            <p className="muted">Leave this off to stay in demo mode. When on and filled in, the server sends the message through Meta’s WhatsApp Cloud API.</p>
            <div className="save-row">
              <button className="btn btn-grad" disabled={notificationsBusy}><Save size={17} /> {notificationsBusy ? "Saving…" : "Save WhatsApp settings"}</button>
              {notificationsMessage.text && <span className={notificationsMessage.ok ? "ok" : "alert-err"} role="status">{notificationsMessage.text}</span>}
            </div>
          </form>
        </section>
      </> : <section className="card"><p className="muted">Loading store contact and WhatsApp settings…</p></section>}

      <section className="card">
        <h3><UserRound size={20} /> Change username</h3>
        <form onSubmit={changeUsername} className="settings">
          <div className="two">
            <label htmlFor="profile-new-username">New username<input id="profile-new-username" name="admin-new-username-change" value={username.next} onFocus={() => setUsernameFieldsUnlocked(true)} onChange={(e) => setUsername({ ...username, next: e.target.value })} autoComplete="off" readOnly={!usernameFieldsUnlocked} maxLength={150} required /></label>
            <div className="password-field">
              <label htmlFor="profile-username-current-password">Confirm with current password</label>
              <PasswordInput id="profile-username-current-password" name="admin-username-confirmation" label="current password" value={username.currentPassword} onFocus={() => setUsernameFieldsUnlocked(true)} onChange={(e) => setUsername({ ...username, currentPassword: e.target.value })} autoComplete="off" readOnly={!usernameFieldsUnlocked} required />
            </div>
          </div>
          <p className="muted">Your username is used to sign in. You’ll stay signed in after changing it.</p>
          <div className="save-row">
            <button className="btn btn-grad" disabled={usernameBusy}>{usernameBusy ? "Updating…" : "Update username"}</button>
            {usernameMessage.text && <span className={usernameMessage.ok ? "ok" : "alert-err"} role="status">{usernameMessage.text}</span>}
          </div>
        </form>
      </section>

      <section className="card">
        <h3><KeyRound size={20} /> Change password</h3>
        <form onSubmit={changePassword} className="settings">
          <div className="password-field">
            <label htmlFor="profile-current-password">Current password</label>
            <PasswordInput id="profile-current-password" label="current password" value={password.current} onChange={(e) => setPassword({ ...password, current: e.target.value })} autoComplete="current-password" required />
          </div>
          <div className="two">
            <div className="password-field">
              <label htmlFor="profile-new-password">New password</label>
              <PasswordInput id="profile-new-password" label="new password" value={password.next} onChange={(e) => setPassword({ ...password, next: e.target.value })} autoComplete="new-password" minLength={10} required />
            </div>
            <div className="password-field">
              <label htmlFor="profile-confirm-password">Confirm new password</label>
              <PasswordInput id="profile-confirm-password" label="confirm new password" value={password.confirm} onChange={(e) => setPassword({ ...password, confirm: e.target.value })} autoComplete="new-password" minLength={10} required />
            </div>
          </div>
          <p className="muted">At least 10 characters. Avoid your username, common passwords, or all-number passwords. Other logged-in devices will be signed out.</p>
          <div className="save-row">
            <button className="btn btn-grad" disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
            {message.text && <span className={message.ok ? "ok" : "alert-err"} role="status">{message.text}</span>}
          </div>
        </form>
      </section>
    </div>
  );
}
