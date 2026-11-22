import { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet } from "react-router-dom";
import { ExternalLink, HelpCircle, LayoutDashboard, ClipboardList, UtensilsCrossed, Tag, Users, Settings as Cog, User, Percent } from "lucide-react";
import { api, getToken } from "../api";
import { LogoMark } from "../components/Logo";

const SITE_URL = import.meta.env.VITE_SITE_URL || "https://ahmad-food-center.netlify.app/";

const NAV = [
  ["/admin", "Dashboard", LayoutDashboard, true], ["/admin/profile", "Profile", User],
  ["/admin/orders", "Orders", ClipboardList],
  ["/admin/menu", "Menu", UtensilsCrossed], ["/admin/deals", "Menu Deals", Tag],
  ["/admin/promos", "Promo Codes", Percent], ["/admin/customers", "Customers", Users],
  ["/admin/settings", "Store Settings", Cog],
];

export default function AdminLayout() {
  const [logo, setLogo] = useState();
  useEffect(() => {
    const refreshLogo = (event) => {
      if (!getToken()) return;
      if (event?.detail && "logo" in event.detail) {
        setLogo(event.detail.logo || null);
        return;
      }
      api.getSettings().then((settings) => setLogo(settings.logo || null)).catch(() => setLogo(null));
    };
    refreshLogo();
    window.addEventListener("afc-site-logo-updated", refreshLogo);
    return () => window.removeEventListener("afc-site-logo-updated", refreshLogo);
  }, []);
  if (!getToken()) return <Navigate to="/admin/login" replace />;
  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-brand"><LogoMark size={52} logo={logo} /><span><b>AFC</b><small>Ahmad Food Center</small></span></div>
        <nav>
          {NAV.map(([to, label, Ic, end]) => (
            <NavLink key={to} to={to} end={end}><Ic size={20} /> {label}</NavLink>
          ))}
        </nav>
        <div className="adm-bottom">
          {SITE_URL && <a href={SITE_URL} className="help-link" target="_blank" rel="noreferrer"><ExternalLink size={20} /> View Website</a>}
          <NavLink to="/admin/help" className="help-link"><HelpCircle size={20} /> Help &amp; Support</NavLink>
        </div>
      </aside>
      <section className="adm-main"><Outlet /></section>
    </div>
  );
}
