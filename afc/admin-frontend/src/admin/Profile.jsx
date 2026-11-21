import { useEffect, useState } from "react";
import { ImagePlus, KeyRound, Save, UserRound } from "lucide-react";
import { api, setToken } from "../api";
import PasswordInput from "../components/PasswordInput";
import PageHead from "./PageHead";

export default function Profile() {
  const [account, setAccount] = useState(null);
  const [username, setUsername] = useState({ currentPassword: "", next: "" });
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
      setSiteSettings(await api.saveSettings(body));
      setLogoFile(null);
      setLogoInputKey((key) => key + 1);
      setLogoMessage({ ok: true, text: "Website logo updated" });
      window.dispatchEvent(new Event("afc-site-logo-updated"));
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

  return (
    <div className="profile-page">
      <PageHead title="Profile" subtitle="Your admin account, security and website branding" />
      <section className="card">
        <h3><UserRound size={20} /> Account details</h3>
        {account ? (
          <dl className="profile-info-grid">
            {[["Full name", account.full_name], ["Username", account.username], ["Email", account.email]]
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
              {(logoPreview || siteSettings?.logo) ? <img src={logoPreview || siteSettings.logo} alt="Website logo preview" /> : <ImagePlus size={28} />}
            </div>
            <label>Choose logo image<input key={logoInputKey} type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} /></label>
          </div>
          <div className="save-row">
            <button className="btn btn-grad" disabled={!logoFile}><Save size={18} /> Save logo</button>
            {logoMessage.text && <span className={logoMessage.ok ? "ok" : "alert-err"} role="status">{logoMessage.text}</span>}
          </div>
        </form>
      </section>

      <section className="card">
        <h3><UserRound size={20} /> Change username</h3>
        <form onSubmit={changeUsername} className="settings">
          <div className="two">
            <label htmlFor="profile-new-username">New username<input id="profile-new-username" value={username.next} onChange={(e) => setUsername({ ...username, next: e.target.value })} autoComplete="off" maxLength={150} required /></label>
            <div className="password-field">
              <label htmlFor="profile-username-current-password">Confirm with current password</label>
              <PasswordInput id="profile-username-current-password" label="current password" value={username.currentPassword} onChange={(e) => setUsername({ ...username, currentPassword: e.target.value })} autoComplete="current-password" required />
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
