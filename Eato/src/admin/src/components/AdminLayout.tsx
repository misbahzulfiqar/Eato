import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/restaurants', label: 'Restaurants' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/security', label: 'Security' },
] as const;

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-stone-100">
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="Close menu"
          onClick={closeSidebar}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,15rem)] shrink-0 flex-col bg-stone-900 text-white transition-transform duration-200 sm:w-56 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="border-b border-stone-700 p-4">
          <div className="text-lg font-bold text-eato-orange">Eato Admin</div>
          <div className="mt-1 truncate text-xs text-stone-400">{user?.email}</div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={'end' in item ? item.end : undefined}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-eato-orange text-white' : 'text-stone-300 hover:bg-stone-800'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-stone-700 p-2">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-stone-400 transition hover:bg-stone-800 hover:text-white"
            aria-label="Log out"
          >
            <span>Log out</span>
            <svg className="ml-auto h-5 w-5 shrink-0 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:min-h-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-stone-200 bg-stone-100 px-4 py-3 lg:hidden">
          <button
            type="button"
            className="rounded-lg border border-stone-300 bg-white p-2 text-stone-800 shadow-sm"
            aria-expanded={sidebarOpen}
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <span className="min-w-0 truncate text-sm font-bold text-stone-900">Admin</span>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
