import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Banknote, CreditCard, Copy, LocateFixed, MapPin, MessageCircle, Trash2, User, X } from "lucide-react";
import { api } from "../api";
import { useCart } from "../CartContext";
import { rs } from "../util";
import FoodImg from "../components/FoodImg";
import Tracker from "../components/Tracker";
import { PromoBox } from "../components/CartSummary";

const PkFlag = () => (
  <svg width="22" height="15" viewBox="0 0 22 15" aria-label="Pakistan"><rect width="22" height="15" fill="#01411c" /><rect width="5.5" height="15" fill="#fff" /><circle cx="14" cy="7.5" r="4" fill="#fff" /><circle cx="15.3" cy="6.6" r="3.4" fill="#01411c" /><path d="M16.6 4.6l.5 1.2 1.2.1-.9.8.3 1.3-1.1-.7-1.1.7.3-1.3-.9-.8 1.2-.1z" fill="#fff" /></svg>
);

const DEFAULT_MAP_CENTER = { la: 33.6844, lo: 73.0479 };

function mapEmbedUrl(pin) {
  const center = pin || DEFAULT_MAP_CENTER;
  const span = 0.012;
  const params = new URLSearchParams({
    bbox: `${center.lo - span},${center.la - span},${center.lo + span},${center.la + span}`,
    layer: "mapnik",
  });
  if (pin) params.set("marker", `${pin.la},${pin.lo}`);
  return `https://www.openstreetmap.org/export/embed.html?${params}`;
}

function MapPreview({ pin, onOpen, disabled }) {
  const openOnKey = (e) => {
    if (!disabled && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <div className={`map map-preview ${disabled ? "is-disabled" : ""}`} role="button" tabIndex={disabled ? -1 : 0} aria-disabled={disabled} aria-label="Open delivery location map" onClick={() => !disabled && onOpen()} onKeyDown={openOnKey}>
      <iframe src={mapEmbedUrl(pin)} title="Delivery map preview" tabIndex={-1} aria-hidden="true" />
      {pin && <span className="pin pin-set"><MapPin size={34} fill="#d8201a" color="#8f0f0b" /></span>}
      <span className="map-preview-label"><MapPin size={16} /> {pin ? "Delivery location selected · Open map" : "Open map to choose your delivery location"}</span>
    </div>
  );
}

function LocationMap({ pin, locating, error, onLocate, onClose }) {
  const routeUrl = pin ? `https://www.google.com/maps/dir/?api=1&destination=${pin.la},${pin.lo}` : "";
  return (
    <div className="map-backdrop" onClick={onClose}>
      <section className="map-dialog" role="dialog" aria-modal="true" aria-labelledby="map-dialog-title" onClick={(e) => e.stopPropagation()}>
        <div className="map-dialog-head">
          <div><h2 id="map-dialog-title">Choose delivery location</h2><p>Use your current location so the rider can follow the map pin.</p></div>
          <button type="button" className="icon-btn" aria-label="Close map" onClick={onClose}><X size={22} /></button>
        </div>
        <iframe className="map-dialog-frame" src={mapEmbedUrl(pin)} title="OpenStreetMap delivery location" />
        {error && <p className="alert-err" role="alert">{error}</p>}
        <div className="map-dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onLocate} disabled={locating}><LocateFixed size={17} /> {locating ? "Finding location…" : "Use my current location"}</button>
          {pin && <a className="btn btn-ghost" href={routeUrl} target="_blank" rel="noreferrer">Open route in Google Maps</a>}
          <button type="button" className="btn btn-grad" onClick={onClose} disabled={!pin}>Use this location</button>
        </div>
      </section>
    </div>
  );
}

export default function Checkout() {
  const cart = useCart();
  const [f, setF] = useState({ customer_name: "", phone: "", address: "", landmark: "" });
  const [pin, setPin] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState(null); // {order, whatsapp, phone}
  const [track, setTrack] = useState(null);
  const [copied, setCopied] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const locate = () => {
    setMapOpen(true);
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Your browser does not support location access. You can still enter your address above.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition((p) => {
      const { latitude: la, longitude: lo } = p.coords;
      const mapUrl = `https://maps.google.com/?q=${la.toFixed(6)},${lo.toFixed(6)}`;
      setPin({ la, lo });
      setF((current) => {
        const notes = current.landmark.split("|").map((part) => part.trim()).filter((part) => part && !/^Delivery pin:/i.test(part));
        const pinNote = `Delivery pin: ${mapUrl}`;
        const noteLimit = Math.max(0, 200 - pinNote.length - (notes.length ? 3 : 0));
        const note = notes.join(" | ").slice(0, noteLimit).trim();
        return { ...current, landmark: [note, pinNote].filter(Boolean).join(" | ") };
      });
      setLocating(false);
    }, (error) => {
      const message = error.code === 1
        ? "Location access was denied. Allow location access in your browser and try again."
        : error.code === 2
          ? "Your current location is unavailable. Check your device location settings and try again."
          : "Location request timed out. Try again or enter your address above.";
      setLocationError(message);
      setLocating(false);
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 });
  };

  const place = async (e) => {
    e.preventDefault();
    const digits = f.phone.replace(/\D/g, "").replace(/^(92|0)/, "");
    const er = {};
    if (f.customer_name.trim().length < 2) er.customer_name = "Please enter your full name";
    if (digits.length < 10) er.phone = "Enter a valid 10-digit number, e.g. 300 1234567";
    if (!f.address.trim()) er.address = "Please enter your delivery address";
    setErrs(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      const phone = `+92${digits}`;
      const r = await api.placeOrder({ ...f, phone, items: cart.lines.map((l) => ({ id: l.id, qty: l.qty })), promo: cart.promo?.code });
      setPlaced({ ...r, phone });
      cart.clear();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (x) { setErrs({ form: x.detail || x.items || Object.values(x)[0] || "Could not place order" }); }
    finally { setBusy(false); }
  };

  // live tracking poll after order is placed
  useEffect(() => {
    if (!placed) return;
    const load = () => api.track(placed.order.order_id, placed.phone).then(setTrack).catch(() => {});
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [placed]);

  const o = placed?.order;
  const lines = o ? o.items.map((i) => ({ id: i.name, name: i.name, price: i.price, qty: i.qty })) : cart.lines;
  const sub = o ? o.subtotal : cart.subtotal, disc = o ? o.discount : cart.discount;
  const del = o ? o.delivery_fee : cart.delivery, tot = o ? o.total : cart.total;

  if (!o && cart.lines.length === 0)
    return (
      <div className="wrap"><div className="card empty-state big"><h2>Your cart is empty</h2><p>Add pizza, burgers or shawarma to place an order.</p><Link className="btn btn-grad" to="/menu">Browse Menu</Link></div></div>
    );

  return (
    <div className="wrap checkout">
      <h1 className="page-title">Checkout &amp; Live Order Tracking</h1>
      <p className="subtitle">Order ID: <b className="c-red">{o ? o.order_id : "assigned when you confirm"}</b> • Estimated delivery: 25–30 min</p>

      {o && (
        <section className="card success" role="status">
          <h2>🎉 Order placed! Your Order ID is <span className="oid">{o.order_id}</span></h2>
          <p>Track it live with your Order ID + phone number <b>{placed.phone}</b>. Pay <b>{rs(o.total)}</b> in cash when your order arrives.</p>
          <div className="wa-box">
            <h3><MessageCircle size={20} /> Admin WhatsApp notification</h3>
            <p className="muted">
              {placed.whatsapp.api_status === "sent" ? "✅ Sent automatically to admin via WhatsApp Business API."
                : placed.whatsapp.api_status === "failed" ? "⚠️ Automatic sending failed – use the button below."
                : "Demo mode: here is the ready message. Automatic sending turns on when WhatsApp Business API is connected in Admin → Settings."}
            </p>
            <pre>{placed.whatsapp.message}</pre>
            <div className="wa-actions">
              {placed.whatsapp.url
                ? <a className="btn btn-wa" href={placed.whatsapp.url} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Send to Admin on WhatsApp</a>
                : <span className="alert-err">Admin WhatsApp number is not set yet (Admin → Settings).</span>}
              <button className="btn btn-ghost" onClick={() => { navigator.clipboard?.writeText(placed.whatsapp.message); setCopied(true); setTimeout(() => setCopied(false), 1500); }}><Copy size={16} /> {copied ? "Copied" : "Copy message"}</button>
            </div>
          </div>
        </section>
      )}

      <div className="checkout-grid">
        <div className="col-left">
          <form className="card" onSubmit={place} noValidate>
            <h3 className="card-title"><User size={22} className="c-orange" /> Delivery Details</h3>
            <fieldset disabled={!!o} className="fs">
              <label>Full Name<input value={f.customer_name} onChange={set("customer_name")} placeholder="Ali Khan" autoComplete="name" />{errs.customer_name && <small className="err">{errs.customer_name}</small>}</label>
              <label>Phone Number
                <span className="phone"><span className="cc"><PkFlag /> +92</span><input value={f.phone} onChange={set("phone")} placeholder="300 1234567" inputMode="tel" autoComplete="tel-national" /></span>
                {errs.phone && <small className="err">{errs.phone}</small>}
              </label>
              <label>Full Address<input value={f.address} onChange={set("address")} placeholder="House 45, Street 12, Sector F-10, Islamabad, Pakistan" autoComplete="street-address" />{errs.address && <small className="err">{errs.address}</small>}</label>
              <label>Location / Landmark<input value={f.landmark} onChange={set("landmark")} placeholder="Near Jinnah Super Market (optional)" /></label>
              <div className="loc-head"><b>Location</b><button type="button" className="link-btn" onClick={locate}><LocateFixed size={15} /> Use my current location</button></div>
              <MapPreview pin={pin} onOpen={() => setMapOpen(true)} disabled={!!o} />
            </fieldset>

            <h3 className="card-title pay-title">Payment Method</h3>
            <label className="pay on"><input type="radio" checked readOnly /> <span><b><Banknote size={18} /> Cash on Delivery</b><small>Pay when your order arrives. No online payment required.</small></span></label>
            <label className="pay off"><input type="radio" disabled /> <span><b><CreditCard size={18} /> Card / Online Payment</b><small>Coming Soon</small></span><em className="soon">Coming Soon</em></label>

            {errs.form && <p className="alert-err" role="alert">{String(errs.form)}</p>}
            {!o && <button className="btn btn-grad btn-block btn-lg" disabled={busy}>{busy ? "Placing order…" : "Confirm & Place Order"}</button>}
            {o && <Link to="/menu" className="btn btn-ghost btn-block">Order something else</Link>}
          </form>
        </div>

        <aside className="card order-sum">
          <h3 className="card-title">Order Summary</h3>
          <ul className="sum-list">
            {lines.map((l) => (
              <li key={l.id}>
                <FoodImg item={l} className="thumb" />
                <div><b>{l.name}</b><small>Qty: {l.qty}</small></div>
                <b>{rs(l.price * l.qty)}</b>
                {!o && <button type="button" className="icon-btn" aria-label={`Remove ${l.name}`} onClick={() => cart.remove(l.id)}><Trash2 size={17} /></button>}
              </li>
            ))}
          </ul>
          <div className="sum-rows">
            <p><span>Subtotal</span><b>{rs(sub)}</b></p>
            {disc > 0 && <p className="disc"><span>Promo discount</span><b>− {rs(disc)}</b></p>}
            <p><span>Delivery Fee</span><b>{del === 0 ? "Free" : rs(del)}</b></p>
            <p className="grand"><span>Total</span><b>{tot.toLocaleString("en-US")} PKR</b></p>
          </div>
          {!o && <PromoBox />}
          <div className="cod-box">Cash on Delivery – Please keep {rs(tot)} ready for the rider.</div>
        </aside>
      </div>

      {mapOpen && <LocationMap pin={pin} locating={locating} error={locationError} onLocate={locate} onClose={() => setMapOpen(false)} />}

      <Tracker order={o ? track : null} />
    </div>
  );
}
