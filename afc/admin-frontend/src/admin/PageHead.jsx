import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, LogOut, Search } from "lucide-react";
import { api, setToken } from "../api";

export default function PageHead({ title, subtitle, search, onSearch }) {
  const nav = useNavigate();
  const [pending, setPending] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    const load = () => api.stats().then((s) => setPending(s.pending_orders)).catch(() => {});
    const loadProfile = () => api.profile().then(setProfile).catch(() => {});
    load();
    loadProfile();
    window.addEventListener("afc-profile-updated", loadProfile);
    const t = setInterval(load, 15000);
    return () => {
      clearInterval(t);
      window.removeEventListener("afc-profile-updated", loadProfile);
    };
  }, []);
  const logout = () => { setToken(null); nav("/admin/login"); };
  const name = profile?.full_name || profile?.username || "Loading account…";
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
  return (
    <header className="adm-head">
      <div><h1>{title}</h1><p>{subtitle}</p></div>
      <div className="adm-tools">
        {onSearch && (
          <label className="adm-search"><Search size={18} /><input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search orders, customers..." aria-label="Search" /></label>
        )}
        <div className="notification-wrap">
          <button type="button" className="bell" aria-label={`${pending} pending orders`} aria-expanded={notificationsOpen} aria-controls="admin-notifications" onClick={() => setNotificationsOpen((open) => !open)} title="Notifications">
            <Bell size={21} />{pending > 0 && <em>{pending > 99 ? "99+" : pending}</em>}
          </button>
          {notificationsOpen && (
            <div className="notification-popover" id="admin-notifications" role="status">
              <b>Notifications</b>
              <p>{pending ? `${pending} pending ${pending === 1 ? "order needs" : "orders need"} attention.` : "There are no pending orders."}</p>
              <Link to="/admin/orders" onClick={() => setNotificationsOpen(false)}>View orders</Link>
            </div>
          )}
        </div>
        <Link to="/admin/profile" className="profile profile-link" aria-label="Open admin profile">
          <span className="av" style={{ background: "#1f2d4d" }}>{initials}</span>
          <div><b>{name}</b><small>{profile ? (profile.email || profile.username) : ""}</small></div>
        </Link>
        <button className="icon-btn" onClick={logout} aria-label="Log out" title="Log out"><LogOut size={20} /></button>
      </div>
    </header>
  );
}
