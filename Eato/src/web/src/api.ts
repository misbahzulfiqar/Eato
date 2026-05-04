import { getTokenForPath } from './authTokens';
import type { Customer, MenuItem, Order, OrderStatus, Review, Restaurant, Role } from './types/eato';

/** Dev: Vite proxy uses `/api`. Production: set `VITE_API_ORIGIN` in Vercel (e.g. `https://your-api.example.com`, no trailing slash). */
const API = (() => {
  const origin = import.meta.env.VITE_API_ORIGIN?.trim().replace(/\/$/, '');
  return origin ? `${origin}/api` : '/api';
})();

/** Login/register must not send an existing session token (wrong role could confuse the API). */
function isPublicAuthPath(path: string) {
  return path === '/auth/login' || path.startsWith('/auth/register');
}

export async function api<T = any>(
  path: string,
  options: RequestInit & { _authToken?: string | null } = {},
): Promise<T> {
  const { _authToken, ...rest } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(rest.headers as Record<string, string> | undefined) };
  let token: string | null;
  if (_authToken !== undefined) {
    token = _authToken;
  } else if (isPublicAuthPath(path)) {
    token = null;
  } else {
    token = typeof window !== 'undefined' ? getTokenForPath(window.location.pathname) : null;
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(API + path, { ...rest, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data as T;
}

type AuthRegisterPayload = { user: any; token: string };

export const auth = {
  registerCustomer: (body: { name: string; email: string; password: string; phone?: string; address?: string }) =>
    api<AuthRegisterPayload>('/auth/register/customer', { method: 'POST', body: JSON.stringify(body) }),

  registerRestaurant: (body: {
    name: string;
    email: string;
    password: string;
    restaurantName: string;
    description?: string;
    address?: string;
    phone?: string;
    cuisine?: string;
    imageUrl?: string;
    city?: string;
    status?: Restaurant['status'];
  }) => api<AuthRegisterPayload>('/auth/register/restaurant', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string; role: Role }) => api<AuthRegisterPayload>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  me: () => api<Customer | Restaurant | any>('/auth/me'),

  updateProfile: (body: { name?: string; email?: string; phone?: string; address?: string }) =>
    api<Customer>('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
};

export const restaurants = {
  list: (params: { q?: string; location?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.location) qs.set('location', params.location);
    const query = qs.toString();
    return api<Restaurant[]>(`/restaurants${query ? `?${query}` : ''}`);
  },
  get: (id: string) => api<Restaurant>(`/restaurants/${id}`),
  updateProfile: (body: Partial<Restaurant>) => api<Restaurant>('/restaurants/profile', { method: 'PUT', body: JSON.stringify(body) }),
};

export const menu = {
  byRestaurant: (id: string) => api<MenuItem[]>(`/menu/restaurant/${id}`),
  my: () => api<MenuItem[]>('/menu/my'),
  add: (body: Partial<MenuItem> & { name: string; price: number }) => api<MenuItem>('/menu', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<MenuItem>) => api<MenuItem>(`/menu/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => api<{ message: string }>(`/menu/${id}`, { method: 'DELETE' }),
};

export const orders = {
  place: (body: {
    restaurantId: string;
    items: Array<{ menuItemId: string; quantity: number }>;
    deliveryAddress: string;
    customerPhone?: string;
  }) => api<Order>('/orders', { method: 'POST', body: JSON.stringify(body) }),

  my: () => api<Order[]>('/orders/my'),
  restaurant: () => api<Order[]>('/orders/restaurant'),

  cancel: (id: string) => api<Order>(`/orders/${id}/cancel`, { method: 'PATCH' }),
  reports: (period: string = 'daily') => api<any>(`/orders/reports?period=${encodeURIComponent(period)}`),

  updateStatus: (id: string, status: OrderStatus) => api<Order>(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
};

export const reviews = {
  create: (body: { orderId: string; restaurantId: string; menuItemId?: string | null; rating: number; comment?: string }) =>
    api<Review>('/reviews', { method: 'POST', body: JSON.stringify(body) }),

  my: () => api<Review[]>('/reviews/my'),

  restaurantSummary: (restaurantId: string, menuItemId?: string | null) => {
    const qs = new URLSearchParams();
    if (menuItemId) qs.set('menuItemId', menuItemId);
    const query = qs.toString();
    return api<{ avgRating: number | null; count: number }>(`/reviews/restaurant/${restaurantId}/summary${query ? `?${query}` : ''}`);
  },
};

