import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, Clock, Banknote } from "lucide-react";
import { api } from "../api";
import PageHead from "./PageHead";
import LiveOrders from "./LiveOrders";

const Trend = ({ v, label }) => <p className={`trend ${v < 0 ? "dn" : "up"}`}>{v >= 0 ? "+" : ""}{v}% <span>{label}</span></p>;

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [q, setQ] = useState("");
  const load = useCallback(() => api.stats().then(setS).catch(() => {}), []);
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]);
  const n = (v) => (v ?? 0).toLocaleString("en-US");
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return (
    <>
      <PageHead title="Dashboard" subtitle={`Welcome back, here is your business overview for today • ${today}`} search={q} onSearch={setQ} />
      <div className="stats">
        <div className="stat s-red"><span className="s-ic"><ClipboardList size={22} /></span><p>Total Orders</p><b>{n(s?.total_orders)}</b><Trend v={s?.total_orders_change ?? 0} label="vs last month" /></div>
        <div className="stat s-yellow"><span className="s-ic"><Banknote size={22} /></span><p>Today Revenue (PKR)</p><b>₨ {n(s?.today_revenue)}</b><Trend v={s?.today_revenue_change ?? 0} label="vs yesterday" /></div>
        <div className="stat s-orange"><span className="s-ic"><Clock size={22} /></span><p>Pending Orders</p><b>{n(s?.pending_orders)}</b><p className="need">Requires action</p></div>
        <div className="stat s-green"><span className="s-ic"><CheckCircle2 size={24} /></span><p>Delivered Orders</p><b>{n(s?.delivered_orders)}</b><Trend v={s?.delivered_change ?? 0} label="vs last month" /></div>
      </div>
      <LiveOrders pageSize={5} q={q} onChanged={load} />
    </>
  );
}
