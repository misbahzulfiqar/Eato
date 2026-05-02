import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { MenuItem } from '../types/eato';

export type CartLine = { menuItemId: string; name: string; price: number; quantity: number; imageUrl?: string };

const CART_PREFIX = 'eato_cart_';
const META_KEY = 'eato_cart_active';

function storageKey(restaurantId: string) {
  return `${CART_PREFIX}${restaurantId}`;
}

function loadLines(restaurantId: string): CartLine[] {
  try {
    const raw = localStorage.getItem(storageKey(restaurantId));
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function saveLines(restaurantId: string, lines: CartLine[]) {
  if (lines.length === 0) {
    localStorage.removeItem(storageKey(restaurantId));
  } else {
    localStorage.setItem(storageKey(restaurantId), JSON.stringify(lines));
  }
}

type CartMeta = { restaurantId: string; restaurantName: string };

function readMeta(): CartMeta | null {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p?.restaurantId && p?.restaurantName) return { restaurantId: p.restaurantId, restaurantName: p.restaurantName };
  } catch {
    /* ignore */
  }
  return null;
}

function writeMeta(meta: CartMeta | null) {
  if (!meta) localStorage.removeItem(META_KEY);
  else localStorage.setItem(META_KEY, JSON.stringify(meta));
}

/** Migrate: first non-empty legacy cart without meta */
function discoverMetaFromLegacy(): CartMeta | null {
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith(CART_PREFIX)) continue;
    const rid = k.slice(CART_PREFIX.length);
    if (rid === 'active') continue;
    const lines = loadLines(rid);
    if (lines.length) return { restaurantId: rid, restaurantName: 'Restaurant' };
  }
  return null;
}

export function loadPersistedCartLines(restaurantId: string): CartLine[] {
  return loadLines(restaurantId);
}

export type CartContextValue = {
  restaurantId: string | null;
  restaurantName: string | null;
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  refresh: () => void;
  addFromMenuItem: (restaurantId: string, restaurantName: string, menuItem: MenuItem) => void;
  /** Replace cart for checkout page (same storage + meta) */
  syncRestaurantCart: (restaurantId: string, restaurantName: string, lines: CartLine[]) => void;
  setQuantity: (menuItemId: string, quantity: number) => void;
  removeLine: (menuItemId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const { meta, lines } = useMemo(() => {
    let m = readMeta();
    if (!m) {
      const d = discoverMetaFromLegacy();
      if (d) {
        writeMeta(d);
        m = d;
      }
    }
    if (!m) return { meta: null as CartMeta | null, lines: [] as CartLine[] };
    return { meta: m, lines: loadLines(m.restaurantId) };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tick triggers re-read
  }, [tick]);

  const syncRestaurantCart = useCallback(
    (restaurantId: string, restaurantName: string, nextLines: CartLine[]) => {
      const currentMeta = readMeta();
      if (currentMeta && currentMeta.restaurantId !== restaurantId && loadLines(currentMeta.restaurantId).length > 0) {
        saveLines(currentMeta.restaurantId, []);
      }
      saveLines(restaurantId, nextLines);
      writeMeta(nextLines.length ? { restaurantId, restaurantName } : null);
      refresh();
    },
    [refresh],
  );

  const addFromMenuItem = useCallback(
    (restaurantId: string, restaurantName: string, menuItem: MenuItem) => {
      const currentMeta = readMeta();
      if (currentMeta && currentMeta.restaurantId !== restaurantId && loadLines(currentMeta.restaurantId).length > 0) {
        saveLines(currentMeta.restaurantId, []);
      }

      const cur = loadLines(restaurantId);
      const existing = cur.find((p) => p.menuItemId === menuItem._id);
      const next = existing
        ? cur.map((p) =>
            p.menuItemId === menuItem._id ? { ...p, quantity: Number(p.quantity || 0) + 1 } : p,
          )
        : [...cur, { menuItemId: menuItem._id, name: menuItem.name, price: menuItem.price, quantity: 1, imageUrl: menuItem.imageUrl || '' }];
      saveLines(restaurantId, next);
      writeMeta({ restaurantId, restaurantName });
      refresh();
    },
    [refresh],
  );

  const setQuantity = useCallback(
    (menuItemId: string, quantity: number) => {
      const m = readMeta();
      if (!m) return;
      const qty = Math.max(0, Math.floor(quantity));
      const cur = loadLines(m.restaurantId);
      const next =
        qty <= 0 ? cur.filter((p) => p.menuItemId !== menuItemId) : cur.map((p) => (p.menuItemId === menuItemId ? { ...p, quantity: qty } : p));
      saveLines(m.restaurantId, next);
      if (next.length === 0) writeMeta(null);
      refresh();
    },
    [refresh],
  );

  const removeLine = useCallback(
    (menuItemId: string) => {
      const m = readMeta();
      if (!m) return;
      const next = loadLines(m.restaurantId).filter((p) => p.menuItemId !== menuItemId);
      saveLines(m.restaurantId, next);
      if (next.length === 0) writeMeta(null);
      refresh();
    },
    [refresh],
  );

  const clearCart = useCallback(() => {
    const m = readMeta();
    if (m) saveLines(m.restaurantId, []);
    writeMeta(null);
    refresh();
  }, [refresh]);

  const itemCount = lines.reduce((s, i) => s + Number(i.quantity || 0), 0);
  const subtotal = lines.reduce((s, i) => s + i.price * Number(i.quantity || 0), 0);

  const value = useMemo(
    () => ({
      restaurantId: meta?.restaurantId ?? null,
      restaurantName: meta?.restaurantName ?? null,
      lines,
      itemCount,
      subtotal,
      refresh,
      addFromMenuItem,
      syncRestaurantCart,
      setQuantity,
      removeLine,
      clearCart,
    }),
    [meta, lines, itemCount, subtotal, refresh, addFromMenuItem, syncRestaurantCart, setQuantity, removeLine, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
