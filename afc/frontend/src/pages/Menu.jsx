import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";
import { api } from "../api";
import { useCart } from "../CartContext";
import { rs } from "../util";
import FoodImg from "../components/FoodImg";
import CartSummary from "../components/CartSummary";

function FoodCard({ item }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const onAdd = () => { add(item, qty); setQty(1); setAdded(true); setTimeout(() => setAdded(false), 1200); };
  return (
    <article className="card food-card">
      <div className="img-wrap">
        <FoodImg item={item} className="food-img" />
        <span className="tag">{item.category_name}</span>
        <span className="rate"><Star size={13} fill="currentColor" /> {item.rating} <small>({item.reviews})</small></span>
      </div>
      <div className="food-body">
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        <div className="price-row">
          <b className="price">{rs(item.price)}</b>
          <div className="qty" aria-label="Quantity">
            <button aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
            <span>{qty}</span>
            <button aria-label="Increase quantity" onClick={() => setQty(qty + 1)}>+</button>
          </div>
        </div>
        <button className="btn btn-grad btn-block add-btn" onClick={onAdd}>{added ? "Added ✓" : <>Add to Cart <ShoppingCart size={16} /></>}</button>
      </div>
    </article>
  );
}

export default function Menu({ dealsOnly = false }) {
  const [sp, setSp] = useSearchParams();
  const [cats, setCats] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const search = sp.get("search") || "";
  let cat = sp.get("cat") || "";

  useEffect(() => { api.categories().then(setCats).catch(() => {}); }, []);
  if (dealsOnly) cat = cats.find((c) => /deal/i.test(c.name))?.slug || "__none__";

  useEffect(() => {
    if (dealsOnly && !cats.length) return;
    setLoading(true);
    const p = {};
    if (cat) p.category = cat;
    if (search) p.search = search;
    api.menu(p).then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }, [cat, search, dealsOnly, cats.length]);

  const setFilter = (slug) => { const n = new URLSearchParams(); if (slug) n.set("cat", slug); setSp(n); };

  return (
    <div className="wrap menu-page">
      <div className="menu-layout">
        <div>
          <h1 className="page-title">{dealsOnly ? "Deals" : "Menu"}</h1>
          <p className="subtitle">{dealsOnly ? "Save more with our combo deals" : "Fresh & delicious meals delivered to your door"}</p>
          {!dealsOnly && (
            <div className="filters">
              <button className={!cat ? "on" : ""} onClick={() => setFilter("")}>All Items</button>
              {cats.map((c) => <button key={c.id} className={cat === c.slug ? "on" : ""} onClick={() => setFilter(c.slug)}>{c.name}</button>)}
            </div>
          )}
          {search && <p className="muted">Showing results for “{search}” · <button className="link-btn" onClick={() => setFilter(cat)}>Clear</button></p>}
          {loading ? <p className="muted">Loading menu…</p> : items.length === 0 ? (
            <div className="card empty-state"><b>No items found</b><p>Try another search or pick a different category.</p></div>
          ) : (
            <div className="food-grid">{items.map((i) => <FoodCard key={i.id} item={i} />)}</div>
          )}
        </div>
        <CartSummary />
      </div>
    </div>
  );
}
