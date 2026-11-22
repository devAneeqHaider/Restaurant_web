import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../CartContext";
import { resolveMediaUrl } from "../util";

const DEFAULT_LOGO = "/media/branding/download.jfif";

export function LogoMark({ size = 46, logo }) {
  // `undefined` means settings are still loading. Keep the logo space empty
  // until its actual source is known so an old/default logo never flashes.
  const image = logo === undefined ? null : resolveMediaUrl(logo || DEFAULT_LOGO);
  const [readyImage, setReadyImage] = useState(null);

  useEffect(() => {
    if (!image) {
      setReadyImage(null);
      return undefined;
    }

    let active = true;
    const preload = new Image();
    preload.onload = () => { if (active) setReadyImage(image); };
    preload.onerror = () => { if (active) setReadyImage(image); };
    preload.src = image;
    return () => { active = false; };
  }, [image]);

  const visibleImage = readyImage === image ? image : null;
  useEffect(() => {
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon && visibleImage) favicon.href = visibleImage;
  }, [visibleImage]);
  return (
    <span className="logo-mark-frame" style={{ width: size, height: size }}>
      {visibleImage && <img className="logo-mark-image" src={visibleImage} alt="" />}
    </span>
  );
}

export default function Logo({ light = false, size = 46 }) {
  const { cfg } = useCart();
  return (
    <Link to="/" className={`logo ${light ? "logo-light" : ""}`} aria-label="AFC Ahmad Food Center home">
      <LogoMark size={size} logo={cfg.logo} />
      <span className="logo-text">
        <b>AFC</b>
        <small>Ahmad Food Center</small>
      </span>
    </Link>
  );
}
