import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { resolveMediaUrl } from "../util";

const DEFAULT_LOGO = "/media/branding/download.jfif";

export function LogoMark({ size = 46, logo }) {
  // Do not paint a stale fallback while the current logo is being resolved.
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
    <span className="adm-logo-mark-frame" style={{ width: size, height: size }}>
      {visibleImage && <img className="adm-logo-mark-image" src={visibleImage} alt="AFC logo" />}
    </span>
  );
}

export default function Logo({ light = false, size = 46 }) {
  return (
    <Link to="/" className={`logo ${light ? "logo-light" : ""}`} aria-label="AFC Ahmad Food Center home">
      <LogoMark size={size} logo={null} />
      <span className="logo-text">
        <b>AFC</b>
        <small>Ahmad Food Center</small>
      </span>
    </Link>
  );
}
