import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "./CartContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Splash from "./components/Splash";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Checkout from "./pages/Checkout";
import Track from "./pages/Track";

function MobileCartBar() {
  const { pathname } = useLocation();
  const { count, total } = useCart();
  if (!count || pathname === "/checkout") return null;
  return (
    <Link to="/checkout" className="mcart">
      <span><ShoppingCart size={20} /> {count} {count === 1 ? "item" : "items"}</span>
      <b>Rs. {total.toLocaleString("en-US")}</b>
      <em>View Cart →</em>
    </Link>
  );
}

function Site() {
  const { pathname } = useLocation();
  return (
    <>
      <Navbar />
      <main key={pathname}><Outlet /></main>
      <Footer />
      <MobileCartBar />
    </>
  );
}

export default function App() {
  // Shows on every page load / refresh of the website.
  const [splash, setSplash] = useState(true);
  const done = useCallback(() => setSplash(false), []);
  useEffect(() => { // footer credit replays the intro
    const f = () => setSplash(true);
    window.addEventListener("afc:splash", f);
    return () => window.removeEventListener("afc:splash", f);
  }, []);
  return (
    <>
      {splash && <Splash onDone={done} />}
      <Routes>
        <Route element={<Site />}>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/deals" element={<Menu dealsOnly />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/track" element={<Track />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
