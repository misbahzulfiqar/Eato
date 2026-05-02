/**
Shared full-screen shell for restaurant partner tools (no SiteHeader / SiteFooter).
 */
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { ApiUserBase, Restaurant } from '../../types/eato';

export const PARTNER_NAV = [
  { to: '/restaurant/dashboard', label: 'Dashboard', icon: 'M4 6h16M4 12h16M4 18h7', end: true },
  { to: '/restaurant/items/add', label: 'Add Item', icon: 'M12 4v16m8-8H4', end: true },
  { to: '/restaurant/items', label: 'All Items', icon: 'M4 6h16M4 10h16M4 14h16M4 18h7', end: true },
  { to: '/restaurant/menu', label: 'Menu', icon: 'M4 6h16M4 12h10M4 18h16', end: false },
  { to: '/restaurant/orders', label: 'Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', end: false },
  { to: '/restaurant/reports', label: 'Analytics', icon: 'M18 20V10M12 20V4M6 20v-6', end: false },
  { to: '/restaurant/profile', label: 'Setting', icon: 'M12 15a3 3 0 100-6 3 3 0 000 6z', end: false },
] as const;

const NAV_ACTIVE = 'bg-fresh-green/10 text-fresh-green font-semibold';

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type RestaurantPartnerShellProps = {
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
  children: ReactNode;
};

export default function RestaurantPartnerShell({ title, subtitle, headerRight, children }: RestaurantPartnerShellProps) {
  const { user, logout } = useAuth();
  const restaurant = user as Restaurant | ApiUserBase;
  const businessName = restaurant?.restaurantName || (restaurant as ApiUserBase)?.name || 'Restaurant';
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  const closeNav = () => setNavOpen(false);

  return (
    <div className="flex min-h-screen bg-surface-canvas font-sans text-stone-800">
      {navOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close menu"
          onClick={closeNav}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-56 shrink-0 flex-col border-r border-stone-200/80 bg-white transition-transform duration-200 lg:static lg:w-64 lg:translate-x-0 ${
          navOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="border-b border-stone-100 px-5 py-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-fresh-lime">Eato</p>
          <p className="mt-1 truncate text-sm font-bold text-fresh-green">{businessName}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {PARTNER_NAV.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={closeNav}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive ? NAV_ACTIVE : 'text-stone-600 hover:bg-surface-muted'
                }`
              }
            >
              <NavIcon d={icon} />
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => {
              closeNav();
              logout();
            }}
            className="mt-auto flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-stone-500 hover:bg-surface-muted"
          >
            <NavIcon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
            Log out
          </button>
        </nav>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-stone-200 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            className="rounded-lg border border-stone-200 bg-surface-muted p-2 text-stone-800"
            aria-expanded={navOpen}
            aria-label="Open menu"
            onClick={() => setNavOpen(true)}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <span className="min-w-0 truncate text-sm font-bold text-fresh-green">{businessName}</span>
        </header>
        <main className="min-h-0 flex-1 overflow-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-fresh-green">{title}</h1>
            {subtitle ? <p className="text-sm text-stone-500">{subtitle}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {headerRight}
            <NavLink
              to="/restaurant/home"
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-fresh-green shadow-sm hover:bg-fresh-muted"
            >
              ← Back to home
            </NavLink>
          </div>
        </div>
        {children}
      </main>
      </div>
    </div>
  );
}
