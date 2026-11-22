import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu as MenuIcon, Search, ShoppingCart, User, X } from "lucide-react";
import { useCart } from "../CartContext";
import Logo from "./Logo";

export default function Navbar() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => { setOpen(false); }, [pathname]);

  const isMenu = pathname === "/menu";
  const isCheckout = pathname === "/checkout";
  const isHome = pathname === "/";
  const go = (e) => { e.preventDefault(); if (q.trim()) nav(`/menu?search=${encodeURIComponent(q.trim())}`); setSearching(false); setQ(""); };

  const cartBtn = (
    <Link to="/checkout" className={isMenu ? "cart-icon" : "cart-pill"} aria-label={`Cart, ${count} items`}>
      <ShoppingCart size={isMenu ? 24 : 20} />
      {!isMenu && <span>Cart</span>}
      {count > 0 && <em className="badge">{count}</em>}
    </Link>
  );

  return (
    <header className={`nav ${isMenu ? "nav-menu" : ""} ${isCheckout ? "nav-red" : ""} ${isHome ? "nav-over" : ""} ${searching ? "search-open" : ""}`}>
      <div className="nav-in">
          <Logo light={isCheckout} size={54} />

        {isCheckout ? (
          <nav className="links links-light">
            <NavLink to="/menu">Menu</NavLink><NavLink to="/track">My Orders</NavLink><a href="#footer">Support</a><a href="#footer">Help</a>
          </nav>
        ) : (
          <nav className="links">
            <NavLink to="/" end>Home</NavLink><NavLink to="/menu">Menu</NavLink><NavLink to="/deals">Deals</NavLink><NavLink to="/track">Track Order</NavLink>
          </nav>
        )}

        <div className="nav-right">
          {searching ? (
            <form onSubmit={go} className="nav-search">
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search food…" aria-label="Search food" />
              <button type="button" onClick={() => setSearching(false)} aria-label="Close search"><X size={16} /></button>
            </form>
          ) : (
            <button className="icon-btn nav-ic" aria-label="Search" onClick={() => setSearching(true)}><Search size={22} /></button>
          )}
          {(isMenu || isCheckout) && <Link to="/track" className="icon-btn nav-ic" aria-label="Track order"><User size={22} /></Link>}
          {cartBtn}
          <button className="icon-btn burger" aria-label="Menu" onClick={() => setOpen(!open)}>{open ? <X size={24} /> : <MenuIcon size={24} />}</button>
        </div>
      </div>
      {open && (
        <nav className="mobile-links">
          <NavLink to="/" end>Home</NavLink><NavLink to="/menu">Menu</NavLink><NavLink to="/deals">Deals</NavLink><NavLink to="/track">Track Order</NavLink>
        </nav>
      )}
    </header>
  );
}
