import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { api } from "../api";
import { rs } from "../util";
import Tracker from "../components/Tracker";

export default function Track() {
  const [sp] = useSearchParams();
  const [oid, setOid] = useState(sp.get("id") || "");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchOrder = async (silent) => {
    if (!silent) { setBusy(true); setErr(""); }
    try { setOrder(await api.track(oid, phone)); }
    catch (e) { if (!silent) { setOrder(null); setErr(e.detail || "Order not found"); } }
    finally { if (!silent) setBusy(false); }
  };
  useEffect(() => {
    if (!order || order.status === "delivered") return;
    const t = setInterval(() => fetchOrder(true), 8000);
    return () => clearInterval(t);
  }, [order?.order_id, order?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="wrap track-page">
      <h1 className="page-title">Track Your Order</h1>
      <p className="subtitle">Enter your Order ID and the phone number you ordered with</p>
      <form className="card track-form" onSubmit={(e) => { e.preventDefault(); fetchOrder(); }}>
        <label>Order ID<input value={oid} onChange={(e) => setOid(e.target.value)} placeholder="AFC-1234" required /></label>
        <label>Phone Number<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0300 1234567" inputMode="tel" required /></label>
        <button className="btn btn-grad" disabled={busy}><Search size={18} /> {busy ? "Checking…" : "Track Order"}</button>
      </form>
      {err && <p className="alert-err" role="alert">{err}</p>}
      {order && (
        <>
          <Tracker order={order} />
          <section className="card track-detail">
            <h3>Order {order.order_id}</h3>
            <ul>{order.items.map((i, k) => <li key={k}><span>{i.name} × {i.qty}</span><b>{rs(i.price * i.qty)}</b></li>)}</ul>
            <p className="grand"><span>Total (Cash on Delivery)</span><b>{rs(order.total)}</b></p>
          </section>
        </>
      )}
    </div>
  );
}
