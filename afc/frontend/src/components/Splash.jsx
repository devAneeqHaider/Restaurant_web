import { useEffect, useRef, useState } from "react";
import { LogoMark } from "./Logo";
import { useCart } from "../CartContext";

const DURATION = 3600; // ms – shown once per browser session

export default function Splash({ onDone }) {
  const { cfg } = useCart();
  const [leaving, setLeaving] = useState(false);
  const root = useRef(null);
  const [run, setRun] = useState(typeof IntersectionObserver === "undefined");

  // Start the countdown only when the splash is really visible (tab in front + on screen),
  // so it can never finish unseen in a background tab / off-screen preview.
  useEffect(() => {
    if (run || !root.current) return;
    let inView = false;
    const check = () => { if (inView && document.visibilityState === "visible") setRun(true); };
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; check(); }, { threshold: 0.3 });
    io.observe(root.current);
    document.addEventListener("visibilitychange", check);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", check); };
  }, [run]);

  useEffect(() => {
    if (!run) return;
    const a = setTimeout(() => setLeaving(true), DURATION - 600);
    const b = setTimeout(onDone, DURATION);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [run, onDone]);

  const name = "M. Aneeq Haider".split("");
  // cream -> gold -> orange across the letters
  const shade = (i) => {
    const t = i / (name.length - 1), a = [255, 242, 196], b = [255, 110, 30];
    return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * t)).join(",")})`;
  };
  return (
    <div ref={root} className={`splash ${run ? "splash-run" : ""} ${leaving ? "splash-out" : ""}`} role="status" aria-label="Welcome">
      <div className="splash-glow" />
      <div className="splash-logo"><LogoMark size={80} logo={cfg.logo} /></div>
      <p className="splash-pre">Developed by Engineer</p>
      <h1 className="splash-name" aria-label="M. Aneeq Haider">
        {name.map((ch, i) => (
          <span key={i} style={{ animationDelay: `${0.75 + i * 0.08}s`, color: shade(i) }}>{ch === " " ? "\u00A0" : ch}</span>
        ))}
      </h1>
      <div className="splash-line" />
      <p className="splash-brand">AFC · AHMAD FOOD CENTER</p>
      <div className="splash-bar"><i style={{ animationDuration: `${DURATION}ms` }} /></div>
    </div>
  );
}
