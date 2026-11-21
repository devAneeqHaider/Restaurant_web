// All backend calls live here. Dev: Vite proxies /api -> Django (127.0.0.1:8000).
const BASE = import.meta.env.VITE_API_URL || "";

export const getToken = () => localStorage.getItem("afc_admin_token");
export const setToken = (t) => (t ? localStorage.setItem("afc_admin_token", t) : localStorage.removeItem("afc_admin_token"));

async function request(path, { method = "GET", body, auth = false, raw = false } = {}) {
  const headers = {};
  if (auth && getToken()) headers.Authorization = `Token ${getToken()}`;
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
  if (res.status === 401 && auth) {
    setToken(null);
    window.location.href = "/admin/login";
    throw { detail: "Session expired" };
  }
  if (raw) return res;
  const data = res.status === 204 ? null : await res.json().catch(() => ({}));
  if (!res.ok) throw data || { detail: "Something went wrong" };
  return data;
}

export const api = {
  login: (username, password) => request("/admin/login/", { method: "POST", body: { username, password } }),
  publicSettings: () => request("/settings/"),
  profile: () => request("/admin/profile/", { auth: true }),
  changeUsername: (current_password, new_username) => request("/admin/change-username/", { method: "POST", body: { current_password, new_username }, auth: true }),
  changePassword: (old_password, new_password) => request("/admin/change-password/", { method: "POST", body: { old_password, new_password }, auth: true }),
  stats: () => request("/admin/stats/", { auth: true }),
  orders: (params) => request(`/admin/orders/?${new URLSearchParams(params)}`, { auth: true }),
  deleteOrder: (id) => request(`/admin/orders/${id}/`, { method: "DELETE", auth: true }),
  setStatus: (id, status) => request(`/admin/orders/${id}/status/`, { method: "PATCH", body: { status }, auth: true }),
  orderWhatsapp: (id) => request(`/admin/orders/${id}/whatsapp/`, { auth: true }),
  exportCsv: (params) => request(`/admin/orders/export/?${new URLSearchParams(params)}`, { auth: true, raw: true }),
  customers: () => request("/admin/customers/", { auth: true }),
  deleteCustomer: (phone) => request(`/admin/customers/delete/?${new URLSearchParams({ phone })}`, { method: "DELETE", auth: true }),
  getSettings: () => request("/admin/settings/", { auth: true }),
  saveSettings: (body) => request("/admin/settings/", { method: "PUT", body, auth: true }),

  adminCategories: () => request("/admin/categories/", { auth: true }),
  saveCategory: (c) =>
    c.id
      ? request(`/admin/categories/${c.id}/`, { method: "PATCH", body: c, auth: true })
      : request("/admin/categories/", { method: "POST", body: c, auth: true }),
  deleteCategory: (id) => request(`/admin/categories/${id}/`, { method: "DELETE", auth: true }),
  adminItems: () => request("/admin/items/", { auth: true }),
  saveItem: (id, formData) =>
    id
      ? request(`/admin/items/${id}/`, { method: "PATCH", body: formData, auth: true })
      : request("/admin/items/", { method: "POST", body: formData, auth: true }),
  promos: () => request("/admin/promos/", { auth: true }),
  addPromo: (b) => request("/admin/promos/", { method: "POST", body: b, auth: true }),
  deletePromo: (id) => request(`/admin/promos/${id}/`, { method: "DELETE", auth: true }),
  deleteItem: (id) => request(`/admin/items/${id}/`, { method: "DELETE", auth: true }),
};
