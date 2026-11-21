import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Filter, MessageCircle, Trash2 } from "lucide-react";
import { api } from "../api";
import { avatarColor, initials, rs } from "../util";

const ST = [["pending", "Pending"], ["preparing", "Preparing"], ["out_for_delivery", "Out for Delivery"], ["delivered", "Delivered"]];

export default function LiveOrders({ pageSize = 5, q = "", onChanged }) {
  const [data, setData] = useState({ results: [], count: 0, pages: 1, page: 1 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [showF, setShowF] = useState(false);
  const [busy, setBusy] = useState(null);

  const load = useCallback(() =>
    api.orders({ page, page_size: pageSize, status, q }).then(setData).catch(() => {}),
  [page, pageSize, status, q]);
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]);
  useEffect(() => { setPage(1); }, [status, q]);

  const change = async (o, s) => {
    if (o.status === s) return;
    setBusy(o.id);
    try { await api.setStatus(o.id, s); await load(); onChanged?.(); } finally { setBusy(null); }
  };
  const remove = async (o) => {
    if (!window.confirm(`Delete order #${o.order_id}? This cannot be undone.`)) return;
    setBusy(o.id);
    try {
      await api.deleteOrder(o.id);
      onChanged?.();
      if (data.results.length === 1 && page > 1) setPage(page - 1);
      else await load();
    } catch (error) {
      window.alert(error.detail || "Could not delete this order.");
    } finally {
      setBusy(null);
    }
  };
  const exportCsv = async () => {
    const res = await api.exportCsv({ status, q });
    const url = URL.createObjectURL(await res.blob());
    Object.assign(document.createElement("a"), { href: url, download: "afc-orders.csv" }).click();
    URL.revokeObjectURL(url);
  };
  const wa = async (o) => { const r = await api.orderWhatsapp(o.id); window.open(r.url || "#", "_blank"); };

  const from = data.count ? (data.page - 1) * pageSize + 1 : 0;
  const to = Math.min(data.page * pageSize, data.count);
  const pages = [...Array(data.pages).keys()].map((i) => i + 1).filter((n) => n === 1 || n === data.pages || Math.abs(n - data.page) <= 1);

  return (
    <section className="live">
      <div className="live-head">
        <h2>Live Orders</h2>
        <div className="live-btns">
          <div className="filter-wrap">
            <button className="btn btn-ghost" onClick={() => setShowF(!showF)}><Filter size={17} /> Filter{status ? ": " + ST.find((s) => s[0] === status)[1] : ""}</button>
            {showF && (
              <div className="filter-menu">
                <button onClick={() => { setStatus(""); setShowF(false); }}>All orders</button>
                {ST.map(([k, l]) => <button key={k} onClick={() => { setStatus(k); setShowF(false); }}>{l}</button>)}
              </div>
            )}
          </div>
          <button className="btn btn-orange" onClick={exportCsv}><Download size={17} /> Export CSV</button>
        </div>
      </div>
      <div className="table-wrap">
        <table className="orders">
          <thead><tr><th>Order ID</th><th>Customer Name</th><th>Items</th><th>Total Price</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {data.results.map((o) => (
              <tr key={o.id} className={busy === o.id ? "busy" : ""}>
                <td className="oid-cell">#{o.order_id}</td>
                <td><span className="cust"><span className="av" style={{ background: avatarColor(o.customer_name) }}>{initials(o.customer_name)}</span><span><b>{o.customer_name}</b><small>{o.phone}</small></span></span></td>
                <td><span className="pills">{o.items.slice(0, 2).map((i, k) => <em key={k}>{i.name.split(" ").slice(-1)[0]}{i.qty > 1 ? ` ×${i.qty}` : ""}</em>)}{o.items.length > 2 && <em>+{o.items.length - 2}</em>}</span></td>
                <td className="tot">{rs(o.total)}</td>
                <td><span className={`st st-${o.status}`}>{o.status_label}</span></td>
                <td>
                  <span className="acts">
                    {ST.map(([k, l]) => <button key={k} className={`act act-${k} ${o.status === k ? "on" : ""}`} onClick={() => change(o, k)} aria-pressed={o.status === k} disabled={busy === o.id}>{l}</button>)}
                    <button className="act wa" title="WhatsApp message" aria-label="Open WhatsApp message" onClick={() => wa(o)}><MessageCircle size={14} /></button>
                    <button className="act delete" title="Delete order" aria-label={`Delete order ${o.order_id}`} onClick={() => remove(o)} disabled={busy === o.id}><Trash2 size={14} /></button>
                  </span>
                </td>
              </tr>
            ))}
            {data.results.length === 0 && <tr><td colSpan="6" className="empty-row">No orders found.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <span>Showing {from}-{to} of {data.count} orders</span>
        <div>
          <button disabled={data.page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={15} /> Previous</button>
          {pages.map((n) => <button key={n} className={n === data.page ? "on" : ""} onClick={() => setPage(n)}>{n}</button>)}
          <button disabled={data.page >= data.pages} onClick={() => setPage(page + 1)}>Next <ChevronRight size={15} /></button>
        </div>
      </div>
    </section>
  );
}
