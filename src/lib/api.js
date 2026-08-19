const API_BASE = "/api";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("auth_token");
  const headers = {
    "Content-Type": "application/json",
    ...token ? { "Authorization": `Bearer ${token}` } : {},
    ...options.headers
  };
  
  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
  } catch (err) {
    console.error(`Network error on ${endpoint}:`, err);
    throw new Error(`Network error connecting to API: ${err.message || 'Failed to fetch'}`);
  }

  if (!response.ok) {
    let errorMsg = `HTTP error! status: ${response.status}`;
    try {
      const textData = await response.text();
      if (textData) {
        try {
          const errorData = JSON.parse(textData);
          errorMsg = errorData.error || textData;
        } catch {
          errorMsg = textData;
        }
      }
    } catch {
    }
    throw new Error(errorMsg);
  }
  return response.json();
}
export const api = {
  auth: {
    me: () => request("/auth/me"),
    updateProfile: (data) => request("/auth/profile", { method: "PATCH", body: JSON.stringify(data) }),
    resetPassword: (email, password) => request("/auth/reset-password", { method: "POST", body: JSON.stringify({ email, password }) }),
    login: (email, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    register: (data) => request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    forgotPassword: (email, redirectTo) => request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email, redirectTo }) })
  },
  tickets: {
    list: () => request("/tickets"),
    get: (id) => request(`/tickets/${id}`),
    create: (data) => request("/tickets", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) => request(`/tickets/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id) => request(`/tickets/${id}`, { method: "DELETE" })
  },
  announcements: {
    list: () => request("/announcements"),
    create: (data) => request("/announcements", { method: "POST", body: JSON.stringify(data) }),
    delete: (id) => request(`/announcements/${id}`, { method: "DELETE" })
  },
  settings: {
    get: (key) => request(`/settings/${key}`),
    set: (key, value) => request(`/settings/${key}`, { method: "POST", body: JSON.stringify({ value }) })
  },
  users: {
    list: () => request("/users"),
    create: (data) => request("/users", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) => request(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id) => request(`/users/${id}`, { method: "DELETE" })
  },
  backend: {
    status: () => request("/backend-status")
  },
  inquiries: {
    list: () => request("/inquiries"),
    listMy: () => request("/my-inquiries"),
    create: (data) => request("/inquiries", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) => request(`/inquiries/${id}`, { method: "PATCH", body: JSON.stringify(data) })
  }
};
