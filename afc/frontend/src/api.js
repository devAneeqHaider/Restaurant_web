// All backend calls live here. Dev: Vite proxies /api -> Django (127.0.0.1:8000).
const BASE = import.meta.env.VITE_API_URL || "";

async function request(path, { method = "GET", body } = {}) {
  const headers = {};
  let payload = body;
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, { method, headers, body: payload });
  } catch {
    throw { detail: "Cannot reach the server. Please check your connection and try again." };
  }
  const data = res.status === 204 ? null : await res.json().catch(() => ({}));
  if (!res.ok) throw data || { detail: "Something went wrong" };
  return data;
}

export const api = {
  categories: () => request("/categories/"),
  menu: (params = {}) => request(`/menu/?${new URLSearchParams(params)}`),
  settings: () => request("/settings/"),
  validatePromo: (code) => request("/promo/validate/", { method: "POST", body: { code } }),
  placeOrder: (body) => request("/orders/", { method: "POST", body }),
  track: (order_id, phone) => request("/orders/track/", { method: "POST", body: { order_id, phone } }),

};
