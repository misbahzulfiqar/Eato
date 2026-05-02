/**
 * Restaurant partner dashboard landing (logged-in restaurants).
 * Route: `/restaurant/home` (protected). Separate from public `pages/Home.tsx` at `/`.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { ApiUserBase, Restaurant } from '../../types/eato';
import { readRestaurantNotifications, markRestaurantAllRead, markRestaurantNotificationRead } from '../../lib/notifications';

const HERO_IMG = '/mexican-dishes-pepper.jpg';
const PLACEHOLDER_LOGO = '/LOGO.png';
const SHOWCASE_VIDEO = '/video/12063842_3840_2160_30fps.mp4';

/** Content width above footer: 85% viewport, capped for large screens */
const CONTENT_WRAP = 'mx-auto w-[85vw] max-w-[1320px]';

type SignatureCategory = 'all' | 'burger' | 'pizza' | 'subway';

type SignatureDish = {
  id: string;
  name: string;
  image: string;
  category: Exclude<SignatureCategory, 'all'>;
};

const SIGNATURE_DISHES: SignatureDish[] = [
  { id: '1', name: 'Classic gourmet burger', image: '/burger1.webp', category: 'burger' },
  { id: '2', name: 'Stacked cheeseburger', image: '/burger2.png', category: 'burger' },
  { id: '3', name: 'Deluxe burger', image: '/burger3.png', category: 'burger' },
  { id: '4', name: 'Zinger burger platter', image: '/vecteezy_top-view-spicy-zinger-burger-isolated-on-transparent-background_55067669.png', category: 'burger' },
  { id: '5', name: 'Wood-fired pizza', image: '/pizza main.png', category: 'pizza' },
  { id: '6', name: 'House special pizza', image: '/pizz1.png', category: 'pizza' },
  { id: '7', name: 'Loaded pizza slice', image: '/card1.png', category: 'pizza' },
  { id: '8', name: 'Fresh baked pie', image: '/card2.png', category: 'pizza' },
  { id: '9', name: 'Signature wrap', image: '/fruit4.png', category: 'subway' },
  { id: '10', name: 'Grilled sub platter', image: '/dish.png', category: 'subway' },
  { id: '11', name: 'Steak wrap', image: '/pizza main.png', category: 'subway' },
  { id: '12', name: 'Loaded footlong', image: '/pizz1.png', category: 'subway' },
];

const FILTER_TABS: { key: SignatureCategory; label: string }[] = [
  { key: 'all', label: 'All Menu' },
  { key: 'burger', label: 'Burger' },
  { key: 'pizza', label: 'Pizza' },
  { key: 'subway', label: 'Subway' },
];

function IconChefHat({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3.5c-2.2 0-4.1 1.3-4.9 3.2C5.2 7.4 3.5 9.4 3.5 12c0 1.2.4 2.3 1 3.2V20c0 .83.67 1.5 1.5 1.5h13c.83 0 1.5-.67 1.5-1.5v-4.8c.6-.9 1-2 1-3.2 0-2.8-2-5.1-4.6-5.6-.9-2-2.9-3.4-5.4-3.4zm0 2c1.5 0 2.8.75 3.55 1.9l.35.6.68.1c1.9.3 3.42 1.95 3.42 3.9 0 .55-.12 1.08-.35 1.55l-.2.4V19h-13v-5.05l-.2-.4a3.4 3.4 0 01-.35-1.55c0-1.65 1.1-3.05 2.6-3.5l.68-.2.35-.58A4.1 4.1 0 0112 5.5z" />
    </svg>
  );
}

function IconCart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M6 6h15l-1.5 9h-12z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
      <path d="M6 6 5 3H2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function restaurantDisplayName(user: ApiUserBase | null): string {
  if (!user) return 'My restaurant';
  const rn = (user as { restaurantName?: string }).restaurantName;
  if (rn && rn.trim()) return rn.trim();
  if (user.name && user.name.trim()) return user.name.trim();
  return 'My restaurant';
}

function restaurantProfileImage(user: ApiUserBase | null): string {
  const url = (user as Restaurant | null)?.imageUrl?.trim();
  if (url) return url;
  return PLACEHOLDER_LOGO;
}

export default function RestaurantHome() {
  const { user } = useAuth();
  const name = restaurantDisplayName(user as ApiUserBase | null);
  const profileImg = restaurantProfileImage(user as ApiUserBase | null);
  const [signatureFilter, setSignatureFilter] = useState<SignatureCategory>('all');

  const [actionToast, setActionToast] = useState<{
    noticeId?: string;
    title: string;
    body?: string;
    variant: 'pending' | 'success';
  } | null>(null);

  useEffect(() => {
    const rid = String((user as { _id?: string; id?: string } | null)?._id ?? (user as { id?: string } | null)?.id ?? '');
    if (!rid) return undefined;

    const pendingDismissKey = `eato_pending_dismissed_${rid}`;

    const check = () => {
      const list = readRestaurantNotifications(rid);
      const unread = list.filter((n) => !n.read);
      if (unread.length) {
        const approvalCandidate = unread.find(
          (n) => (n.meta as any)?.status === 'approved' || (n.meta as any)?.kind === 'approval_pending' || (n.meta as any)?.kind === 'approval_success',
        );
        const n = approvalCandidate ?? unread[0];
        const variant =
          (n.meta as any)?.status === 'approved' || (n.meta as any)?.kind === 'approval_success' ? 'success' : 'pending';
        setActionToast({
          noticeId: n.id,
          title: n.title || 'Notification',
          body: n.body,
          variant,
        });
        return;
      }

      const status = (user as Restaurant | null)?.status;
      if (status === 'pending' && localStorage.getItem(pendingDismissKey) !== '1') {
        setActionToast({
          title: 'Approval request sent',
          body: 'Your restaurant approval request has been sent to admin. Please wait for approval.',
          variant: 'pending',
        });
      } else {
        setActionToast(null);
      }
    };

    check();
    const t = window.setInterval(check, 3500);
    return () => window.clearInterval(t);
  }, [user]);

  const visibleDishes = useMemo(() => {
    if (signatureFilter === 'all') return SIGNATURE_DISHES;
    return SIGNATURE_DISHES.filter((d) => d.category === signatureFilter);
  }, [signatureFilter]);

  return (
    <div className="overflow-x-hidden bg-surface-canvas font-sans text-stone-800">
      {actionToast ? (
        <div className="pointer-events-auto fixed bottom-6 left-1/2 z-[350] flex w-[min(calc(100vw-2rem),26rem)] -translate-x-1/2 justify-center px-4">
          <div
            className={`w-full rounded-xl px-5 py-4 shadow-lg ${
              actionToast.variant === 'success' ? 'bg-fresh-green text-white' : 'bg-promo-orange text-white'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-semibold">{actionToast.title}</div>
                {actionToast.body ? <div className="mt-1 text-xs leading-relaxed opacity-95">{actionToast.body}</div> : null}
              </div>
              <button
                type="button"
                className={`shrink-0 rounded-lg ${actionToast.variant === 'success' ? 'bg-white/20' : 'bg-white/20'} px-3 py-1 text-xs font-bold text-white`}
                onClick={() => {
                  const rid = String((user as { _id?: string; id?: string } | null)?._id ?? (user as { id?: string } | null)?.id ?? '');
                  if (!rid) return;
                  // Mark only the current toast notification as read (keeps other notifications intact).
                  if (actionToast.noticeId) markRestaurantNotificationRead(rid, actionToast.noticeId);
                  else markRestaurantAllRead(rid);
                  const pendingDismissKey = `eato_pending_dismissed_${rid}`;
                  localStorage.setItem(pendingDismissKey, '1');
                  setActionToast(null);
                }}
              >
                Thank you
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <section className="relative w-full overflow-hidden">
        <div className="relative min-h-[380px] sm:min-h-[460px] lg:min-h-[490px]">
          <img
            src={HERO_IMG}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div
            className={`relative z-10 flex min-h-[280px] items-center px-0 py-10 sm:min-h-[360px] sm:py-12 lg:min-h-[420px] lg:py-14 ${CONTENT_WRAP}`}
          >
            <div className="ml-0 flex w-full flex-col items-center justify-center px-4 text-center sm:ml-auto sm:w-[60%] sm:px-6">
              <div className="mb-3 flex w-full justify-center sm:mb-4">
                <div className="flex max-w-full items-center gap-3 rounded-2xl border border-white/25 bg-black/25 px-3 py-2 backdrop-blur-sm sm:gap-4 sm:px-4 sm:py-2.5">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/40 bg-white p-1 sm:h-16 sm:w-16">
                    <img src={profileImg} alt="" className="h-full w-full object-contain" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80 sm:text-[11px]">Your restaurant</p>
                    <h1 className="truncate text-lg font-bold text-white drop-shadow-md sm:text-xl" title={name}>
                      {name}
                    </h1>
                  </div>
                </div>
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-fresh-lime drop-shadow-md">
                Partner dashboard
              </p>
              <p className="text-2xl font-extrabold leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:text-3xl md:text-4xl">
                Welcome back
              </p>
              <p className="mt-4 max-w-lg text-sm font-medium text-white/95 drop-shadow-md sm:text-base">
                Manage your menu, take orders, and grow sales — all from one place. Use the top bar to sign out when
                you&apos;re done.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  to="/restaurant/dashboard"
                  className="rounded-lg bg-fresh-green px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-brand-greenHover"
                >
                  Dashboard
                </Link>
                <Link
                  to="/restaurant/menu"
                  className="rounded-lg bg-fresh-green px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-brand-greenHover"
                >
                  Manage menu
                </Link>
                <Link
                  to="/restaurant/orders"
                  className="rounded-lg border-2 border-white bg-white/15 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-[2px] hover:bg-white/25"
                >
                  View orders
                </Link>
                <Link
                  to="/restaurant/reports"
                  className="rounded-lg border border-white/70 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
                >
                  Sales reports
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#faf6f0] py-14 sm:py-16">
        <div className={`${CONTENT_WRAP} px-0`}>
          <h2 className="text-center text-3xl font-bold tracking-tight text-fresh-green sm:text-4xl">Our Signature Dishes</h2>
          <p className="mx-auto mt-4 max-w-3xl text-center text-sm leading-relaxed text-stone-600 sm:text-base">
            From classic favorites to modern culinary creations, our menu is designed to tantalize your taste buds. Every
            dish is made with the freshest ingredients and an extra dash of love.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {FILTER_TABS.map(({ key, label }) => {
              const active = signatureFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSignatureFilter(key)}
                  className={[
                    'inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors',
                    active
                      ? 'border-[#2c1810] bg-fresh-green  text-white'
                      : 'border-[#2c1810]/40 bg-white text-fresh-green  hover:border-[#2c1810]/60',
                  ].join(' ')}
                >
                  {label}
                  {active && key === 'all' ? <IconChefHat className="h-4 w-4 opacity-95" /> : null}
                </button>
              );
            })}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-8 sm:gap-10 md:gap-12 lg:gap-14">
            {visibleDishes.map((dish) => (
              <div
                key={dish.id}
                className="relative w-full max-w-[200px] shrink-0 overflow-hidden rounded-2xl border border-[#2c1810]/10 bg-white shadow-sm sm:max-w-[220px]"
              >
                <div className="flex min-h-[160px] items-center justify-center bg-stone-50/80 px-3 py-4 sm:min-h-[170px]">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="max-h-[160px] w-auto max-w-full object-contain"
                    loading="lazy"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#2c1810] shadow-md ring-1 ring-black/5 transition hover:bg-stone-50"
                    aria-label={`Add ${dish.name} to cart`}
                  >
                    <IconCart className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full">
        <div className={`py-6 sm:py-8 ${CONTENT_WRAP}`}>
          <div className="h-[480px] w-full overflow-hidden rounded-2xl bg-black sm:h-[500px]">
            <video
              className="h-full w-full object-cover"
              src={SHOWCASE_VIDEO}
              autoPlay
              muted
              loop
              playsInline
            />
          </div>
        </div>
      </section>

      <section className={`py-12 ${CONTENT_WRAP} px-0`}>
        <h2 className="text-xl font-bold text-[#1a4225] sm:text-2xl">Welcome back</h2>
        <p className="mt-2 max-w-2xl text-sm text-stone-600 sm:text-base">
          Your customers and sales tools are one click away. Update your business profile or logo anytime from{' '}
          <Link to="/restaurant/profile" className="font-semibold text-fresh-green hover:underline">
            Restaurant profile
          </Link>
          .
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { to: '/restaurant/profile', title: 'Profile & logo', desc: 'Name, address, contact, branding' },
            { to: '/restaurant/menu', title: 'Menu', desc: 'Add, edit, or remove dishes' },
            { to: '/restaurant/orders', title: 'Orders', desc: 'Accept, reject, mark delivered' },
            { to: '/restaurant/reports', title: 'Reports', desc: 'Daily, weekly, monthly insights' },
          ].map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="font-semibold text-stone-900">{card.title}</h3>
              <p className="mt-2 text-sm text-stone-600">{card.desc}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-fresh-green">Open →</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
