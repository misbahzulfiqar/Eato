import type { Role } from './types/eato';

/** One storage key per role so customer + restaurant sessions do not clobber each other (e.g. two browser windows). */
export const TOKEN_STORAGE_KEY: Record<Role, string> = {
  customer: 'eato_token_customer',
  restaurant: 'eato_token_restaurant',
  admin: 'eato_token_admin',
};

const LEGACY_TOKEN_KEY = 'eato_token';

export function readToken(role: Role): string | null {
  if (typeof window === 'undefined') return null;
  const k = TOKEN_STORAGE_KEY[role];
  return localStorage.getItem(k) || sessionStorage.getItem(k);
}

export function writeToken(role: Role, token: string, persist: boolean): void {
  if (typeof window === 'undefined') return;
  const k = TOKEN_STORAGE_KEY[role];
  localStorage.removeItem(k);
  sessionStorage.removeItem(k);
  if (persist) localStorage.setItem(k, token);
  else sessionStorage.setItem(k, token);
}

/** Clear one role without touching other roles' sessions. */
export function clearToken(role: Role): void {
  if (typeof window === 'undefined') return;
  const k = TOKEN_STORAGE_KEY[role];
  localStorage.removeItem(k);
  sessionStorage.removeItem(k);
}

function isRestaurantPath(pathname: string): boolean {
  if (pathname.startsWith('/restaurant/dashboard') || pathname.startsWith('/restaurant/items')) return true;
  if (pathname === '/restaurant' || pathname.startsWith('/restaurant/')) return true;
  if (pathname.startsWith('/login/restaurant') || pathname.startsWith('/register/restaurant')) return true;
  return false;
}

function isCustomerPath(pathname: string): boolean {
  return pathname.startsWith('/customer') || pathname.startsWith('/restaurants');
}

/**
 * Which JWT to send for this URL. Each tab has its own pathname, so two windows stay independent
 * even when both roles have tokens in storage.
 */
export function getTokenForPath(pathname: string): string | null {
  if (typeof window === 'undefined') return null;
  if (isRestaurantPath(pathname)) return readToken('restaurant');
  if (isCustomerPath(pathname)) return readToken('customer');
  return readToken('customer') ?? readToken('restaurant');
}

type SessionMap<T> = { customer: T; restaurant: T };

/** Primary session for UI that still expects a single `user` (e.g. header, marketing). */
export function selectSessionUserForPath<T extends { role: Role }>(
  pathname: string,
  sessions: SessionMap<T | null>,
): T | null {
  if (isRestaurantPath(pathname)) return sessions.restaurant;
  if (isCustomerPath(pathname)) return sessions.customer;
  return sessions.customer ?? sessions.restaurant;
}

export function inferRoleToRefreshFromPath(pathname: string): Role | null {
  if (isRestaurantPath(pathname)) return 'restaurant';
  if (isCustomerPath(pathname)) return 'customer';
  return null;
}

/** Remove legacy single key after callers migrate tokens into per-role keys. */
export function clearLegacyToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  sessionStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function readLegacyToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LEGACY_TOKEN_KEY) || sessionStorage.getItem(LEGACY_TOKEN_KEY);
}

export function legacyTokenWasPersistent(): boolean {
  if (typeof window === 'undefined') return true;
  return !!localStorage.getItem(LEGACY_TOKEN_KEY);
}
