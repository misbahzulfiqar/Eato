export type AppNotification = {
  id: string;
  createdAt: number;
  title: string;
  body?: string;
  meta?: Record<string, any>;
  read?: boolean;
};

const ADMIN_KEY = 'eato_admin_notifications';
const RESTAURANT_PREFIX = 'eato_restaurant_notifications_';

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function uid() {
  return `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function pushAdminNotification(n: Omit<AppNotification, 'id' | 'createdAt'>) {
  const list = safeParse<AppNotification[]>(localStorage.getItem(ADMIN_KEY), []);
  const next: AppNotification = { ...n, id: uid(), createdAt: Date.now(), read: false };
  localStorage.setItem(ADMIN_KEY, JSON.stringify([next, ...list].slice(0, 50)));
  return next;
}

export function readAdminNotifications() {
  return safeParse<AppNotification[]>(localStorage.getItem(ADMIN_KEY), []);
}

export function markAdminAllRead() {
  const list = readAdminNotifications().map((n) => ({ ...n, read: true }));
  localStorage.setItem(ADMIN_KEY, JSON.stringify(list));
}

export function pushRestaurantNotification(restaurantId: string, n: Omit<AppNotification, 'id' | 'createdAt'>) {
  const key = `${RESTAURANT_PREFIX}${restaurantId}`;
  const list = safeParse<AppNotification[]>(localStorage.getItem(key), []);
  const next: AppNotification = { ...n, id: uid(), createdAt: Date.now(), read: false };
  localStorage.setItem(key, JSON.stringify([next, ...list].slice(0, 50)));
  return next;
}

export function readRestaurantNotifications(restaurantId: string) {
  return safeParse<AppNotification[]>(localStorage.getItem(`${RESTAURANT_PREFIX}${restaurantId}`), []);
}

export function markRestaurantAllRead(restaurantId: string) {
  const key = `${RESTAURANT_PREFIX}${restaurantId}`;
  const list = readRestaurantNotifications(restaurantId).map((n) => ({ ...n, read: true }));
  localStorage.setItem(key, JSON.stringify(list));
}

export function markRestaurantNotificationRead(restaurantId: string, notificationId: string) {
  const key = `${RESTAURANT_PREFIX}${restaurantId}`;
  const list = readRestaurantNotifications(restaurantId);
  const next = list.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
  localStorage.setItem(key, JSON.stringify(next));
}

