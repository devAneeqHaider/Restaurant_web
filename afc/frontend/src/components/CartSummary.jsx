import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Trash2, Lock } from "lucide-react";
import { api } from "../api";
import { useCart } from "../CartContext";
import { rs } from "../util";
import FoodImg from "./FoodImg";

export function PromoBox() {
  const { promo, setPromo } = useCart();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const apply = async () => {
    if (!code.trim()) return;
    try {
      const r = await api.validatePromo(code);
      setPromo({ code: code.trim().toUpperCase(), percent: r.percent });
      setMsg(`${r.percent}% discount applied`);
    } catch (e) { setPromo(null); setMsg(e.detail || "Invalid promo code"); }
  };
  return (
    <div className="promo">
      <div className="promo-row">
        <input placeholder="Enter promo code" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && apply()} aria-label="Promo code" />
        <button type="button" onClick={apply}>Apply</button>
      </div>
      {msg && <small className={promo ? "ok" : "err"}>{msg}</small>}
    </div>
  );
}

export default function CartSummary() {
  const c = useCart();
  return (
    <aside className="card cart-summary">
      <h3>Cart Summary <ShoppingCart size={22} className="c-red" /></h3>
      <p className="muted">{c.count} {c.count === 1 ? "Item" : "Items"}</p>
      {c.lines.length === 0 ? (
        <p className="empty">Your cart is empty. Add something delicious!</p>
      ) : (
        <ul className="cart-lines">
          {c.lines.map((l) => (
            <li key={l.id}>
              <FoodImg item={l} className="thumb" />
              <div>
                <b>{l.name}</b>
                <small>Qty: {l.qty} × {l.price}</small>
                <div className="mini-qty">
                  <button aria-label="Decrease" onClick={() => c.setQty(l.id, l.qty - 1)}>−</button>
                  <span>{l.qty}</span>
                  <button aria-label="Increase" onClick={() => c.setQty(l.id, l.qty + 1)}>+</button>
                </div>
              </div>
              <button className="icon-btn" aria-label={`Remove ${l.name}`} onClick={() => c.remove(l.id)}><Trash2 size={18} /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="sum-rows">
        <p><span>Subtotal</span><b>{rs(c.subtotal)}</b></p>
        {c.discount > 0 && <p className="disc"><span>Promo ({c.promo.code})</span><b>− {rs(c.discount)}</b></p>}
        <p><span>Delivery Fee</span><b>{c.delivery === 0 && c.lines.length ? "Free" : rs(c.delivery)}</b></p>
        <p className="grand"><span>Total</span><b>{rs(c.total)}</b></p>
      </div>
      <Link to={c.lines.length ? "/checkout" : "/menu"} className={`btn btn-grad btn-block ${c.lines.length ? "" : "disabled"}`}>
        {c.lines.length ? "Proceed to Checkout" : "Browse Menu"}
      </Link>
      <p className="secure"><Lock size={13} /> Secure checkout • Estimated delivery: 30-40 min</p>
      <PromoBox />
    </aside>
  );
}
