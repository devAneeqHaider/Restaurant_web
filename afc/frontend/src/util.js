// Change to "jpg" (or "png"/"webp") after you drop real photos into public/defaults/ with the same names.
export const DEFAULT_EXT = "jpg";
export const defaultPath = (key) => `/defaults/${key}.${key === "pizza" ? "png" : DEFAULT_EXT}`;

export const rs = (n) => `Rs. ${Number(n || 0).toLocaleString("en-US")}`;

// Pick a matching default photo from the item/category name. Real uploads always win.
const RULES = [
  [/pizza|pepperoni|tikka pizza|fajita pizza|margherita/, "pizza"],
  [/burger|zinger burger|patty/, "burger"],
  [/shawarma|wrap|roll|kebab|pita/, "shawarma"],
  [/cake|pastry|brownie|cupcake|dessert|ice ?cream/, "cake"],
  [/fries|nuggets|wings/, "fries"],
  [/deal|combo|feast|bundle/, "deal"],
];
export function defaultImage(item) {
  const name = `${item?.name || ""}`.toLowerCase();
  const cat = `${item?.category_name || item?.cat || ""}`.toLowerCase();
  for (const [re, key] of RULES) if (re.test(name)) return defaultPath(key);
  for (const [re, key] of RULES) if (re.test(cat)) return defaultPath(key);
  return defaultPath("generic");
}
export function categoryDefault(name) {
  return defaultImage({ name, category_name: name });
}

export function resolveMediaUrl(url) {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (url.startsWith("/media/")) {
    const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
    return base ? `${base}${url}` : url;
  }
  return url;
}

export const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" }) : "";
export const fmtDay = (iso) => {
  if (!iso) return "";
  const d = new Date(iso), t = new Date();
  if (d.toDateString() === t.toDateString()) return "Today";
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
};
export const initials = (n = "") => n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
export const AVATARS = ["#e8590c", "#d8201a", "#2b8a3e", "#1971c2", "#7048e8", "#0c8599", "#c2255c"];
export const avatarColor = (n = "") => AVATARS[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATARS.length];
