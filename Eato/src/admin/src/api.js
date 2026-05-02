const API = '/api';

function getToken() {
  return localStorage.getItem('eato_token');
}

export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(API + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export const auth = {
  registerCustomer: (body) => api('/auth/register/customer', { method: 'POST', body: JSON.stringify(body) }),
  registerRestaurant: (body) => api('/auth/register/restaurant', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => api('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => api('/auth/me'),
};

export const restaurants = {
  list: () => api('/restaurants'),
  get: (id) => api(`/restaurants/${id}`),
  updateProfile: (body) => api('/restaurants/profile', { method: 'PUT', body: JSON.stringify(body) }),
};

export const menu = {
  byRestaurant: (id) => api(`/menu/restaurant/${id}`),
  my: () => api('/menu/my'),
  add: (body) => api('/menu', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/menu/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => api(`/menu/${id}`, { method: 'DELETE' }),
};

export const orders = {
  place: (body) => api('/orders', { method: 'POST', body: JSON.stringify(body) }),
  my: () => api('/orders/my'),
  restaurant: () => api('/orders/restaurant'),
  updateStatus: (id, status) => api(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

function qs(params) {
  const q = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const admin = {
  customers: () => api('/admin/customers'),
  restaurants: () => api('/admin/restaurants'),
  metrics: () => api('/admin/metrics'),
  overviewCharts: () => api('/admin/overview-charts'),
  topItems: () => api('/admin/top-items'),
  reports: (period) => api(`/admin/reports${qs({ period })}`),
  orders: (params) => api(`/admin/orders${qs(params)}`),
  order: (id) => api(`/admin/orders/${id}`),
  patchOrder: (id, body) => api(`/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  updateCustomer: (id, body) => api(`/admin/customers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteCustomer: (id) => api(`/admin/customers/${id}`, { method: 'DELETE' }),
  updateRestaurant: (id, body) => api(`/admin/restaurants/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteRestaurant: (id) => api(`/admin/restaurants/${id}`, { method: 'DELETE' }),
  categories: () => api('/admin/categories'),
  createCategory: (body) => api('/admin/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id, body) => api(`/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteCategory: (id) => api(`/admin/categories/${id}`, { method: 'DELETE' }),
  reviews: () => api('/admin/reviews'),
  deleteReview: (id) => api(`/admin/reviews/${id}`, { method: 'DELETE' }),
};
