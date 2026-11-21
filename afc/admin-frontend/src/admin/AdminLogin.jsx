import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User } from "lucide-react";
import { api, setToken } from "../api";
import { LogoMark } from "../components/Logo";
import PasswordInput from "../components/PasswordInput";

export default function AdminLogin() {
  const nav = useNavigate();
  const [u, setU] = useState(""), [p, setP] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false), [logo, setLogo] = useState(null);
  useEffect(() => { api.publicSettings().then((settings) => setLogo(settings.logo || null)).catch(() => {}); }, []);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { const r = await api.login(u, p); setToken(r.token); nav("/admin"); }
    catch (x) { setErr(x.detail || "Login failed"); }
    finally { setBusy(false); }
  };
  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <LogoMark size={74} logo={logo} />
        <h1>AFC Admin Panel</h1>
        <p>Sign in to manage orders, menu and settings</p>
        <label><User size={18} /><input value={u} onChange={(e) => setU(e.target.value)} placeholder="Username" autoComplete="username" required /></label>
        <div className="login-password-field"><Lock size={18} /><PasswordInput label="password" value={p} onChange={(e) => setP(e.target.value)} placeholder="Password" autoComplete="current-password" required /></div>
        {err && <p className="alert-err" role="alert">{err}</p>}
        <button className="btn btn-grad btn-block btn-lg" disabled={busy}>{busy ? "Signing in…" : "Login"}</button>
      </form>
    </div>
  );
}
