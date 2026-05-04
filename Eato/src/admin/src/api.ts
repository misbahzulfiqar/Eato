const API = '/api';

function getToken(): string | null {
  return localStorage.getItem('eato_token');
}

export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string> | undefined) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(API + path, { ...options, headers });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data as T;
}

export const auth = {
  registerCustomer: (body: Record<string, unknown>) =>
    api('/auth/register/customer', { method: 'POST', body: JSON.stringify(body) }),
  registerRestaurant: (body: Record<string, unknown>) =>
    api('/auth/register/restaurant', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string; role: string }) =>
    api('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => api('/auth/me'),
};

export const restaurants = {
  list: () => api('/restaurants'),
  get: (id: string) => api(`/restaurants/${id}`),
  updateProfile: (body: Record<string, unknown>) => api('/restaurants/profile', { method: 'PUT', body: JSON.stringify(body) }),
};

export const menu = {
  byRestaurant: (id: string) => api(`/menu/restaurant/${id}`),
  my: () => api('/menu/my'),
  add: (body: Record<string, unknown>) => api('/menu', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Record<string, unknown>) => api(`/menu/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => api(`/menu/${id}`, { method: 'DELETE' }),
};

export const orders = {
  place: (body: Record<string, unknown>) => api('/orders', { method: 'POST', body: JSON.stringify(body) }),
  my: () => api('/orders/my'),
  restaurant: () => api('/orders/restaurant'),
  updateStatus: (id: string, status: string) => api(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

function qs(params: Record<string, string | number | boolean | undefined | null> | undefined): string {
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
  reports: (period: string) => api(`/admin/reports${qs({ period })}`),
  orders: (params?: Record<string, string>) => api(`/admin/orders${qs(params)}`),
  order: (id: string) => api(`/admin/orders/${id}`),
  patchOrder: (id: string, body: Record<string, unknown>) =>
    api(`/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  updateCustomer: (id: string, body: Record<string, unknown>) =>
    api(`/admin/customers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteCustomer: (id: string) => api(`/admin/customers/${id}`, { method: 'DELETE' }),
  updateRestaurant: (id: string, body: Record<string, unknown>) =>
    api(`/admin/restaurants/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteRestaurant: (id: string) => api(`/admin/restaurants/${id}`, { method: 'DELETE' }),
  categories: () => api('/admin/categories'),
  createCategory: (body: Record<string, unknown>) => api('/admin/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id: string, body: Record<string, unknown>) =>
    api(`/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteCategory: (id: string) => api(`/admin/categories/${id}`, { method: 'DELETE' }),
  reviews: () => api('/admin/reviews'),
  deleteReview: (id: string) => api(`/admin/reviews/${id}`, { method: 'DELETE' }),
};
