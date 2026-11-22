import { useEffect, useState } from "react";
import { Save, Truck } from "lucide-react";
import { api } from "../api";
import PageHead from "./PageHead";

export default function DeliverySettings() {
  const [deliveryFee, setDeliveryFee] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ ok: true, text: "" });

  useEffect(() => {
    api.getSettings()
      .then((settings) => setDeliveryFee(settings.delivery_fee ?? ""))
      .catch(() => setMessage({ ok: false, text: "Could not load delivery settings" }))
      .finally(() => setLoading(false));
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage({ ok: true, text: "" });
    try {
      const settings = await api.saveSettings({ delivery_fee: Number(deliveryFee) });
      setDeliveryFee(settings.delivery_fee ?? "");
      setMessage({ ok: true, text: "Delivery fee updated" });
    } catch (error) {
      setMessage({ ok: false, text: error.detail || "Could not update delivery fee" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHead title="Delivery Fee" subtitle="Manage the delivery charge shown to customers at checkout" />
      <form className="settings" onSubmit={save}>
        <section className="card">
          <h3><Truck size={20} /> Delivery fee</h3>
          <label htmlFor="delivery-fee">Delivery fee (PKR)
            <input id="delivery-fee" type="number" min="0" inputMode="numeric" value={deliveryFee} onChange={(event) => setDeliveryFee(event.target.value)} required />
          </label>
          <p className="muted">This charge is applied to each customer order at checkout.</p>
          <div className="save-row">
            <button className="btn btn-grad" disabled={loading || busy}><Save size={18} /> {busy ? "Saving…" : "Save delivery fee"}</button>
            {message.text && <span className={message.ok ? "ok" : "alert-err"} role="status">{message.text}</span>}
          </div>
        </section>
      </form>
    </>
  );
}
