import { useEffect } from "react";
import { Link } from "react-router-dom";
import { resolveMediaUrl } from "../util";

const DEFAULT_LOGO = "/media/branding/download.jfif";

export function LogoMark({ size = 46, logo = null }) {
  const image = resolveMediaUrl(logo || DEFAULT_LOGO);
  useEffect(() => {
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) favicon.href = image;
  }, [image]);
  return (
    <span className="adm-logo-mark-frame" style={{ width: size, height: size }}>
      <img className="adm-logo-mark-image" src={image} alt="AFC logo" />
    </span>
  );
}

export default function Logo({ light = false, size = 46 }) {
  return (
    <Link to="/" className={`logo ${light ? "logo-light" : ""}`} aria-label="AFC Ahmad Food Center home">
      <LogoMark size={size} />
      <span className="logo-text">
        <b>AFC</b>
        <small>Ahmad Food Center</small>
      </span>
    </Link>
  );
}
