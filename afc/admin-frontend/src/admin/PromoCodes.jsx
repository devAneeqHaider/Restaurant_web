import { useEffect, useState } from "react";
import { Percent, Trash2 } from "lucide-react";
import { api } from "../api";
import PageHead from "./PageHead";

export default function PromoCodes() {
  const [promos, setPromos] = useState([]);
  const [form, setForm] = useState({ code: "", percent: 10 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState({ ok: true, text: "" });

  const loadPromos = () => api.promos().then(setPromos).finally(() => setLoading(false));
  useEffect(() => { loadPromos().catch(() => setMessage({ ok: false, text: "Could not load promo codes" })); }, []);

  const addPromo = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage({ ok: true, text: "" });
    try {
      await api.addPromo({ code: form.code.trim().toUpperCase(), percent: Number(form.percent), is_active: true });
      setForm({ code: "", percent: 10 });
      await loadPromos();
      setMessage({ ok: true, text: "Promo code added" });
    } catch (error) {
      setMessage({ ok: false, text: error.detail || Object.values(error)[0] || "Could not add promo code" });
    } finally {
      setBusy(false);
    }
  };

  const deletePromo = async (promo) => {
    setDeleting(promo.id);
    setMessage({ ok: true, text: "" });
    try {
      await api.deletePromo(promo.id);
      await loadPromos();
      setMessage({ ok: true, text: `${promo.code} deleted` });
    } catch (error) {
      setMessage({ ok: false, text: error.detail || "Could not delete promo code" });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="promo-page">
      <PageHead title="Promo Codes" subtitle="Manage discount codes customers can use at checkout" />
      <section className="card promo-admin">
        <h3><Percent size={20} /> Existing promo codes</h3>
        {loading ? <p className="muted">Loading promo codes…</p> : promos.length ? (
          <ul className="promo-code-list">
            {promos.map((promo) => (
              <li key={promo.id}>
                <b>{promo.code}</b><span>{promo.percent}% off</span>
                <em className={promo.is_active ? "promo-active" : "promo-inactive"}>{promo.is_active ? "Active" : "Inactive"}</em>
                <button className="icon-btn" aria-label={`Delete ${promo.code}`} title={`Delete ${promo.code}`} disabled={deleting === promo.id} onClick={() => deletePromo(promo)}><Trash2 size={16} /></button>
              </li>
            ))}
          </ul>
        ) : <p className="muted">No promo codes yet. Add one below.</p>}
      </section>

      <section className="card promo-create">
        <h3>Create a promo code</h3>
        <form className="promo-add" onSubmit={addPromo}>
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Code, e.g. AFC20" aria-label="Promo code" maxLength={30} required />
          <label>Discount %<input type="number" min="1" max="90" value={form.percent} onChange={(e) => setForm({ ...form, percent: e.target.value })} aria-label="Discount percentage" required /></label>
          <button className="btn btn-orange" disabled={busy}>{busy ? "Adding…" : "Add promo code"}</button>
        </form>
        <p className="muted">Discount must be between 1% and 90%. Codes are case-insensitive at checkout.</p>
        {message.text && <p className={message.ok ? "ok" : "alert-err"} role="status">{message.text}</p>}
      </section>
    </div>
  );
}
