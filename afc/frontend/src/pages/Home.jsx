import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Banknote, Clock, Leaf, Plus, Search, ShieldCheck, Star, Zap } from "lucide-react";
import { api } from "../api";
import { useCart } from "../CartContext";
import { defaultPath, rs } from "../util";
import FoodImg from "../components/FoodImg";
import { defaultPath, resolveMediaUrl, rs } from "../util";
const hero = (key) => resolveMediaUrl(all.find((i) => i.image && new RegExp(key, "i").test(`${i.name} ${i.category_name}`))?.image) || defaultPath(key);

const FEATURES = [
  [Leaf, "Fresh Ingredients", "Made to order with fresh, quality ingredients every day."],
  [Zap, "Fast Delivery", "Hot at your door in 30-40 minutes, tracked live."],
  [ShieldCheck, "Clean & Hygienic", "Prepared in a spotless kitchen with strict hygiene."],
  [Banknote, "Cash on Delivery", "No online payment needed. Pay when it arrives."],
];

export default function Home() {
  const nav = useNavigate();
  const { add } = useCart();
  const [cats, setCats] = useState([]);
  const [best, setBest] = useState([]);
  const [all, setAll] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.categories().then(setCats).catch(() => {});
    api.menu({ best: 1 }).then(setBest).catch(() => {});
    api.menu().then(setAll).catch(() => {});
  }, []);

  const hero = (key) => all.find((i) => i.image && new RegExp(key, "i").test(`${i.name} ${i.category_name}`))?.image || defaultPath(key);
  const submit = (e) => { e.preventDefault(); nav(`/menu${q.trim() ? `?search=${encodeURIComponent(q.trim())}` : ""}`); };

  return (
    <>
      <section className="hero">
        <div className="hero-in">
          <div className="hero-copy">
            <span className="eyebrow">🔥 Ahmad Food Center</span>
            <h1>Hungry?<br />Order <span className="hl">Fresh &amp; Hot</span></h1>
            <p>Delicious pizza, burgers &amp; shawarma delivered hot to your door in 30-40 minutes</p>
            <form className="hero-search" onSubmit={submit}>
              <Search size={20} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for pizza, burger, shawarma..." aria-label="Search for food" />
              <button type="submit" className="btn btn-red">Order Now</button>
            </form>
            <ul className="hero-stats">
              <li><Star size={18} fill="currentColor" /> <span><b>4.8</b> Rating</span></li>
              <li><Clock size={18} /> <span><b>30-40 min</b> Delivery</span></li>
              <li><Banknote size={18} /> <span><b>Cash on Delivery</b> Pay at your door</span></li>
            </ul>
          </div>
          <div className="hero-art" aria-hidden="true">
            <img className="h-pizza" src="/defaults/pizza.png" alt="" />
            <img className="h-burger" src={hero("burger")} alt="" />
            <img className="h-shawarma" src={hero("shawarma")} alt="" />
            <img className="h-cake" src="/defaults/hero-cake-full.jpg" alt="" />
            <div className="chip-float c1"><Star size={16} fill="currentColor" /> <b>4.8</b> <small>2.4k reviews</small></div>
            <div className="chip-float c2"><Clock size={16} /> <b>30-40</b> <small>min delivery</small></div>
          </div>
        </div>
      </section>

      <section className="section wrap">
        <h2 className="center">Browse by Category</h2>
        <div className="cat-grid">
          {cats.map((c) => (
            <Link key={c.id} to={`/menu?cat=${c.slug}`} className="cat-card">
              {/cake|dessert/i.test(c.name)
                ? <img src={defaultPath("cake")} className="cat-photo cat-photo-cake" alt={c.name} loading="lazy" />
                : /pizza/i.test(c.name)
                  ? <img src="/defaults/pizza.png" className="cat-photo cat-photo-pizza" alt={c.name} loading="lazy" />
                : <FoodImg item={all.find((i) => i.category_slug === c.slug) || { name: c.name, category_name: c.name }} className="cat-photo" alt={c.name} />}
              <b>{c.name}</b>
              <small>{c.tagline || `${c.item_count} Items`}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="wrap best">
        <div className="sec-head"><h2>Best Sellers</h2><Link to="/menu" className="link-orange">View All →</Link></div>
        <div className="best-grid">
          {best.map((i) => (
            <article key={i.id} className="card best-card">
              <div className="img-wrap">
                <span className="ribbon">🔥 Best Seller</span>
                <FoodImg item={i} className="best-img" />
              </div>
              <div className="best-body">
                <h3>{i.name}</h3>
                <p>{i.description}</p>
                <p className="rating"><Star size={13} fill="currentColor" /> {i.rating} <span>({i.reviews})</span></p>
                <div className="best-foot">
                  <b className="price">{rs(i.price)}</b>
                  <button className="add-circle" aria-label={`Add ${i.name} to cart`} onClick={() => add(i)}><Plus size={20} /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="why wrap">
        <h2 className="center">Why people love AFC</h2>
        <p className="center muted">Real food, made fresh, delivered fast.</p>
        <div className="why-grid">
          {FEATURES.map(([Ic, t, d]) => (
            <div key={t} className="why-card"><span><Ic size={24} /></span><b>{t}</b><p>{d}</p></div>
          ))}
        </div>
      </section>
    </>
  );
}
