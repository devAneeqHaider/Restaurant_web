import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";

const Ctx = createContext(null);
export const useCart = () => useContext(Ctx);

export function CartProvider({ children }) {
  const [lines, setLines] = useState(() => {
    try { return JSON.parse(localStorage.getItem("afc_cart")) || []; } catch { return []; }
  });
  const [promo, setPromo] = useState(null); // {code, percent}
  const [cfg, setCfg] = useState({ delivery_fee: 100 });
  const [toast, setToast] = useState("");
  const timer = useRef();

  useEffect(() => { localStorage.setItem("afc_cart", JSON.stringify(lines)); }, [lines]);
  useEffect(() => { api.settings().then(setCfg).catch(() => {}); }, []);

  const add = (item, qty = 1) => {
    clearTimeout(timer.current);
    setToast(`${qty > 1 ? qty + " × " : ""}${item.name} added to cart`);
    timer.current = setTimeout(() => setToast(""), 1800);
    return setLines((ls) => {
      const f = ls.find((l) => l.id === item.id);
      if (f) return ls.map((l) => (l.id === item.id ? { ...l, qty: l.qty + qty, price: item.price } : l));
      return [...ls, { id: item.id, name: item.name, price: item.price, image: item.image, category_name: item.category_name, qty }];
    });
  };
  const setQty = (id, qty) => setLines((ls) => (qty < 1 ? ls.filter((l) => l.id !== id) : ls.map((l) => (l.id === id ? { ...l, qty } : l))));
  const remove = (id) => setLines((ls) => ls.filter((l) => l.id !== id));
  const clear = () => { setLines([]); setPromo(null); };

  const value = useMemo(() => {
    const count = lines.reduce((a, l) => a + l.qty, 0);
    const subtotal = lines.reduce((a, l) => a + l.qty * l.price, 0);
    const discount = promo ? Math.floor((subtotal * promo.percent) / 100) : 0;
    const delivery = lines.length ? Number(cfg.delivery_fee) : 0;
    return { lines, count, subtotal, discount, delivery, total: subtotal - discount + delivery, promo, setPromo, add, setQty, remove, clear, cfg };
  }, [lines, promo, cfg]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">✓ {toast}</div>
    </Ctx.Provider>
  );
}
