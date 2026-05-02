import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { SHOP_NAV_CATEGORIES, shopPath } from '../data/shopNav';

type IconProps = { className?: string };

const LOGO_SRC = '/LOGO.png';

function IconHeart({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function IconCart({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function IconChevronDown({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconChevronRight({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function IconMenu({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconClose({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function HeaderCart() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { lines, itemCount, subtotal, restaurantName, restaurantId } = useCart();

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="relative flex items-center gap-1 rounded-md p-1.5 hover:bg-stone-50 hover:text-fresh-green"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Cart, ${itemCount} items`}
        onClick={() => setOpen((v) => !v)}
      >
        <IconCart className="h-5 w-5" />
        {itemCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[1.125rem] justify-center rounded-full bg-fresh-green px-1 text-[10px] font-bold text-white">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        ) : null}
        <span className="hidden text-sm font-semibold text-fresh-green sm:inline">
          {itemCount > 0 ? `$${subtotal.toFixed(2)}` : '$0.00'}
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-[200] mt-2 w-[min(100vw-1.5rem,20rem)] rounded-xl border border-stone-200 bg-white py-3 shadow-xl">
          <div className="border-b border-stone-100 px-3 pb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Cart</p>
            {restaurantName ? (
              <p className="truncate text-sm font-medium text-fresh-green">{restaurantName}</p>
            ) : null}
          </div>
          {lines.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-stone-500">Your cart is empty.</p>
          ) : (
            <ul className="max-h-64 overflow-y-auto px-2 py-2">
              {lines.map((line) => (
                <li key={line.menuItemId} className="flex items-center justify-between gap-2 border-b border-stone-50 py-2 text-sm last:border-0">
                  <div className="flex min-w-0 items-center gap-2">
                    {line.imageUrl ? (
                      <img src={line.imageUrl} alt="" className="h-8 w-8 rounded-full border border-stone-200 object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-full border border-stone-200 bg-stone-100" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-stone-800">
                      {line.name} × {line.quantity}
                    </span>
                  </div>
                  <span className="shrink-0 font-medium text-stone-700">${(line.price * line.quantity).toFixed(2)}</span>
                </li>
              ))}
              <li className="flex justify-between border-t border-stone-100 pt-2 text-sm font-bold text-stone-900">
                <span>Subtotal</span>
                <span className="text-fresh-green">${subtotal.toFixed(2)}</span>
              </li>
            </ul>
          )}
          <div className="mt-1 space-y-2 border-t border-stone-100 px-3 pt-3">
            <Link
              to="/customer/cart"
              className="block w-full rounded-lg bg-fresh-green py-2.5 text-center text-sm font-bold text-white hover:bg-brand-greenHover"
              onClick={() => setOpen(false)}
            >
              Expand cart
            </Link>
            {restaurantId && lines.length > 0 ? (
              <Link
                to={`/restaurants/${restaurantId}/order`}
                className="block w-full rounded-lg border border-fresh-green py-2 text-center text-sm font-semibold text-fresh-green hover:bg-fresh-muted"
                onClick={() => setOpen(false)}
              >
                Checkout
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function SiteHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const homeHref = user?.role === 'restaurant' ? '/restaurant/home' : '/';

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);
  const restaurantNavClass = (path: string) =>
    location.pathname === path ? 'text-fresh-lime' : 'text-white/80 hover:text-fresh-lime';
  const restaurantLabel =
    user?.role === 'restaurant'
      ? ((user as { restaurantName?: string; name?: string }).restaurantName || (user as { name?: string }).name || '').trim()
      : '';

  const showCustomerCart = user?.role !== 'restaurant';

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
          {user?.role !== 'restaurant' ? (
            <button
              type="button"
              className="rounded-lg p-2 text-stone-700 hover:bg-stone-100 lg:hidden"
              aria-expanded={mobileNavOpen}
              aria-label="Open menu"
              onClick={() => setMobileNavOpen(true)}
            >
              <IconMenu className="h-6 w-6" />
            </button>
          ) : null}
          <Link to={homeHref} className="flex min-w-0 items-center py-0.5">
            <img
              src={LOGO_SRC}
              alt="Eato"
              className="h-8 w-auto max-w-[min(200px,46vw)] object-contain object-left sm:h-11 sm:max-w-[280px] md:max-w-[300px]"
            />
          </Link>
        </div>
        <div className="order-3 flex min-w-0 w-full gap-0 md:order-none md:mx-6 md:w-auto md:max-w-xl md:flex-1 lg:mx-8">
          <input
            type="search"
            placeholder="Search products..."
            className="min-w-0 flex-1 rounded-l-md border border-stone-300 px-3 py-2.5 text-sm sm:px-4 focus:border-fresh-lime focus:outline-none focus:ring-2 focus:ring-fresh-lime/40"
          />
          <button
            type="button"
            className="shrink-0 rounded-r-md bg-fresh-green px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-greenHover sm:px-6"
          >
            Search
          </button>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden text-right sm:block">
            <p className="text-[11px] uppercase tracking-wider text-stone-500">Call Us</p>
            <p className="text-sm font-semibold text-fresh-green">1-800-555-0199</p>
          </div>
          <div className="flex items-center gap-3 text-stone-600">
            {user ? (
              <div className="flex flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                {restaurantLabel ? (
                  <span className="hidden max-w-[160px] truncate text-xs font-semibold text-stone-700 sm:inline" title={restaurantLabel}>
                    {restaurantLabel}
                  </span>
                ) : null}
                <span className="hidden max-w-[100px] truncate text-xs text-stone-500 sm:inline">{user.email}</span>
                <button type="button" onClick={logout} className="text-xs font-semibold text-fresh-green hover:underline">
                  Log out
                </button>
              </div>
            ) : null}
            <button type="button" className="relative p-1.5 hover:text-fresh-green" aria-label="Wishlist">
              <IconHeart className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-fresh-lime text-[10px] font-bold text-white">
                2
              </span>
            </button>
            {showCustomerCart ? <HeaderCart /> : null}
          </div>
        </div>
      </div>

      <div className="bg-fresh-green text-white">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          {user?.role === 'restaurant' ? (
            <nav className="flex w-full min-w-0 items-center gap-5 overflow-x-auto py-2.5 text-sm font-medium [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:justify-center sm:overflow-visible sm:py-2 [&::-webkit-scrollbar]:hidden">
              <Link to="/restaurant/home" className={`shrink-0 ${restaurantNavClass('/restaurant/home')}`}>
                Home
              </Link>
              <Link to="/restaurant/profile" className={`shrink-0 ${restaurantNavClass('/restaurant/profile')}`}>
                Profile
              </Link>
              <Link to="/restaurant/menu" className={`shrink-0 ${restaurantNavClass('/restaurant/menu')}`}>
                Menu
              </Link>
              <Link to="/restaurant/orders" className={`shrink-0 ${restaurantNavClass('/restaurant/orders')}`}>
                Orders
              </Link>
              <Link to="/restaurant/reports" className={`shrink-0 ${restaurantNavClass('/restaurant/reports')}`}>
                Reports
              </Link>
            </nav>
          ) : (
            <div className="hidden flex-wrap items-center gap-x-4 gap-y-2 py-2 lg:flex">
              <div className="group relative">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded bg-black/15 px-4 py-2 text-sm font-medium hover:bg-black/25"
                >
                  Shop by Department
                  <IconChevronDown className="h-4 w-4 opacity-90" />
                </button>
                <div className="invisible absolute left-0 top-full z-50 w-64 pt-1 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                  <ul className="max-h-80 overflow-y-auto rounded-md border border-stone-200 bg-white py-2 text-stone-800 shadow-xl">
                    {SHOP_NAV_CATEGORIES.map(({ slug, label }) => (
                      <li key={slug}>
                        <Link
                          to={shopPath(slug)}
                          className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-fresh-muted hover:text-fresh-green"
                        >
                          {label}
                          <IconChevronRight className="h-4 w-4 text-stone-400" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <nav className="flex min-w-0 flex-1 flex-wrap items-center gap-6 text-sm font-medium">
                <Link to="/" className="hover:text-fresh-lime">
                  Home
                </Link>
                <Link to={shopPath(SHOP_NAV_CATEGORIES[0].slug)} className="hover:text-fresh-lime">
                  Shop
                </Link>
                <Link to="/pages" className="hover:text-fresh-lime">
                  Pages
                </Link>
                <Link to="/blog" className="hover:text-fresh-lime">
                  Blog
                </Link>
                <Link to="/#contact" className="hover:text-fresh-lime">
                  Contact
                </Link>
                {user?.role === 'customer' && (
                  <>
                    <Link to="/restaurants" className="text-fresh-lime">
                      Restaurants
                    </Link>
                    <Link to="/customer/orders" className="text-white/80 hover:text-fresh-lime">
                      My Orders
                    </Link>
                    <Link to="/customer/profile" className="text-white/80 hover:text-fresh-lime">
                      Profile
                    </Link>
                  </>
                )}
              </nav>
              {!user ? (
                <Link
                  to="/signup"
                  className="ml-auto shrink-0 rounded-md bg-promo-orange px-4 py-2 text-sm font-bold text-white shadow-md transition hover:brightness-110"
                >
                  Sign up
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {mobileNavOpen && user?.role !== 'restaurant' ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[280] bg-black/50 lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <div
            className="fixed inset-y-0 left-0 z-[290] flex w-[min(100vw-2.5rem,18rem)] flex-col bg-fresh-green shadow-2xl lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
          >
            <div className="flex items-center justify-between border-b border-white/20 px-4 py-3">
              <span className="text-sm font-bold uppercase tracking-wide text-white/90">Menu</span>
              <button
                type="button"
                className="rounded-lg p-2 text-white hover:bg-white/10"
                aria-label="Close menu"
                onClick={() => setMobileNavOpen(false)}
              >
                <IconClose className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-4 text-sm font-semibold">
              <p className="mb-1 px-2 text-[11px] font-bold uppercase tracking-wide text-white/60">Shop</p>
              {SHOP_NAV_CATEGORIES.map(({ slug, label }) => (
                <Link
                  key={slug}
                  to={shopPath(slug)}
                  className="rounded-lg px-3 py-2.5 text-white hover:bg-white/10"
                  onClick={() => setMobileNavOpen(false)}
                >
                  {label}
                </Link>
              ))}
              <div className="my-3 border-t border-white/20" />
              <Link to="/" className="rounded-lg px-3 py-2.5 text-white hover:bg-white/10" onClick={() => setMobileNavOpen(false)}>
                Home
              </Link>
              <Link
                to={shopPath(SHOP_NAV_CATEGORIES[0].slug)}
                className="rounded-lg px-3 py-2.5 text-white hover:bg-white/10"
                onClick={() => setMobileNavOpen(false)}
              >
                Shop
              </Link>
              <Link to="/pages" className="rounded-lg px-3 py-2.5 text-white hover:bg-white/10" onClick={() => setMobileNavOpen(false)}>
                Pages
              </Link>
              <Link to="/blog" className="rounded-lg px-3 py-2.5 text-white hover:bg-white/10" onClick={() => setMobileNavOpen(false)}>
                Blog
              </Link>
              <Link to="/#contact" className="rounded-lg px-3 py-2.5 text-white hover:bg-white/10" onClick={() => setMobileNavOpen(false)}>
                Contact
              </Link>
              {user?.role === 'customer' ? (
                <>
                  <div className="my-3 border-t border-white/20" />
                  <Link to="/restaurants" className="rounded-lg px-3 py-2.5 text-fresh-lime hover:bg-white/10" onClick={() => setMobileNavOpen(false)}>
                    Restaurants
                  </Link>
                  <Link to="/customer/orders" className="rounded-lg px-3 py-2.5 text-white hover:bg-white/10" onClick={() => setMobileNavOpen(false)}>
                    My Orders
                  </Link>
                  <Link to="/customer/profile" className="rounded-lg px-3 py-2.5 text-white hover:bg-white/10" onClick={() => setMobileNavOpen(false)}>
                    Profile
                  </Link>
                </>
              ) : null}
              {!user ? (
                <>
                  <div className="mt-auto border-t border-white/20 pt-4">
                    <Link
                      to="/signup"
                      className="block rounded-lg bg-promo-orange px-4 py-3 text-center text-sm font-bold text-white shadow-md"
                      onClick={() => setMobileNavOpen(false)}
                    >
                      Sign up
                    </Link>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className="mt-4 rounded-lg border border-white/30 px-3 py-2.5 text-left text-white hover:bg-white/10"
                  onClick={() => {
                    setMobileNavOpen(false);
                    logout();
                  }}
                >
                  Log out
                </button>
              )}
            </nav>
          </div>
        </>
      ) : null}
    </header>
  );
}

