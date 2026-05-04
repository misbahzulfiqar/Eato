import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { admin as adminApi } from '../../api';
import type { OverviewChartData } from '../../components/OverviewDashboardCharts';

const OverviewDashboardCharts = lazy(() => import('../../components/OverviewDashboardCharts'));

const NOTIF_KEY = 'eato_admin_overview_notifications_v1';
const SEEN_RESTAURANTS_KEY = 'eato_admin_seen_restaurants_v1';
const SEEN_ORDERS_KEY = 'eato_admin_seen_orders_v1';
const BOOTSTRAPPED_KEY = 'eato_admin_notifications_bootstrapped_v1';

type AdminNotification = {
  id: string;
  type: 'restaurant' | 'order';
  entityId: string;
  title: string;
  body?: string;
  createdAt: number;
  unread: boolean;
};

type Metrics = Record<string, number | undefined>;

type TopItem = { name?: string; quantitySold?: number };

type ReportsWeek = { summary?: Record<string, number | undefined> };

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export default function AdminOverview() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [reportsWeek, setReportsWeek] = useState<ReportsWeek | null>(null);
  const [chartsData, setChartsData] = useState<OverviewChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState<AdminNotification[]>(() => readJson(NOTIF_KEY, [] as AdminNotification[]));
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      setLoading(true);
      try {
        const [m, t, r, charts] = await Promise.all([
          adminApi.metrics(),
          adminApi.topItems(),
          adminApi.reports('week'),
          adminApi.overviewCharts().catch(() => null),
        ]);
        if (!cancelled) {
          setMetrics(m as Metrics);
          setTopItems((t as { topItems?: TopItem[] }).topItems || []);
          setReportsWeek(r as ReportsWeek);
          setChartsData(charts as OverviewChartData | null);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const pollNotifications = async () => {
      try {
        const [restaurantList, orders, charts] = await Promise.all([
          adminApi.restaurants(),
          adminApi.orders(),
          adminApi.overviewCharts().catch(() => null),
        ]);
        if (cancelled) return;

        if (charts) setChartsData(charts as OverviewChartData);

        type RRow = { _id: string; restaurantName?: string; name?: string };
        type ORow = { _id: string; restaurantId?: { restaurantName?: string } };
        const rlist = restaurantList as RRow[];
        const olist = orders as ORow[];

        const restaurantIds = rlist.map((r) => String(r._id));
        const orderIds = olist.map((o) => String(o._id));
        const bootstrapped = localStorage.getItem(BOOTSTRAPPED_KEY) === '1';

        if (!bootstrapped) {
          writeJson(SEEN_RESTAURANTS_KEY, restaurantIds);
          writeJson(SEEN_ORDERS_KEY, orderIds);
          localStorage.setItem(BOOTSTRAPPED_KEY, '1');
          return;
        }

        const seenRestaurants = new Set(readJson<string[]>(SEEN_RESTAURANTS_KEY, []));
        const seenOrders = new Set(readJson<string[]>(SEEN_ORDERS_KEY, []));
        const nextNotifications: AdminNotification[] = [];

        for (const r of rlist) {
          const id = String(r._id);
          if (!seenRestaurants.has(id)) {
            nextNotifications.push({
              id: `rest-${id}`,
              type: 'restaurant',
              entityId: id,
              title: 'New restaurant signup request',
              body: `${r.restaurantName || r.name || 'Restaurant'} created an account.`,
              createdAt: Date.now(),
              unread: true,
            });
          }
        }

        for (const o of olist) {
          const id = String(o._id);
          if (!seenOrders.has(id)) {
            const restName = o.restaurantId?.restaurantName || 'Restaurant';
            nextNotifications.push({
              id: `order-${id}`,
              type: 'order',
              entityId: id,
              title: 'New order placed',
              body: `A new order was placed for ${restName}.`,
              createdAt: Date.now(),
              unread: true,
            });
          }
        }

        if (nextNotifications.length) {
          setNotifications((prev) => {
            const merged = [...nextNotifications, ...prev];
            writeJson(NOTIF_KEY, merged.slice(0, 80));
            return merged.slice(0, 80);
          });
        }

        writeJson(SEEN_RESTAURANTS_KEY, restaurantIds);
        writeJson(SEEN_ORDERS_KEY, orderIds);
      } catch {
        // Keep dashboard usable even if notification polling fails.
      }
    };

    pollNotifications();
    const t = window.setInterval(pollNotifications, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => n.unread).length, [notifications]);

  const onNotificationClick = (n: AdminNotification) => {
    setNotifications((prev) => {
      const next = prev.map((it) => (it.id === n.id ? { ...it, unread: false } : it));
      writeJson(NOTIF_KEY, next);
      return next;
    });
    setNotifOpen(false);
    if (n.type === 'restaurant') navigate('/admin/restaurants');
    else navigate('/admin/orders');
  };

  if (loading) return <p className="text-stone-600">Loading dashboard…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  const s: Record<string, number | undefined> = reportsWeek?.summary ?? {};

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="min-w-0 text-xl font-bold text-stone-900 sm:text-2xl">Platform overview</h1>
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white shadow-sm hover:bg-stone-50"
            aria-label="Notifications"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-stone-700" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .53-.21 1.04-.59 1.41L4 17h5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 17a3 3 0 006 0" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 justify-center rounded-full bg-pink-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </button>

          {notifOpen ? (
            <div className="absolute right-0 z-20 mt-2 w-[min(90vw,24rem)] rounded-xl border border-stone-200 bg-white p-3 shadow-xl">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Notifications</div>
              {!notifications.length ? (
                <div className="py-6 text-center text-sm text-stone-500">No notifications</div>
              ) : (
                <ul className="max-h-72 space-y-2 overflow-auto">
                  {notifications.slice(0, 20).map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => onNotificationClick(n)}
                        className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                          n.unread ? 'border-pink-200 bg-pink-50 hover:bg-pink-100' : 'border-stone-100 bg-white hover:bg-stone-50'
                        }`}
                      >
                        <div className="text-sm font-semibold text-stone-900">{n.title}</div>
                        {n.body ? <div className="mt-0.5 text-xs text-stone-600">{n.body}</div> : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </div>
      <p className="mb-6 text-sm text-stone-600">Key metrics and charts update from the API (no static demo numbers).</p>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/admin/customers"
          className="group relative block overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 via-sky-500 to-blue-700 px-4 pb-3 pt-3.5 text-white shadow-lg ring-1 ring-black/5 transition hover:brightness-105"
        >
          <span className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/15" aria-hidden />
          <div className="relative flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 shadow-inner">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" strokeLinecap="round" />
                <path d="M19 8v6M22 11h-6" strokeLinecap="round" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white/90">Customers</div>
              <div className="mt-0.5 text-2xl font-bold tracking-tight">{metrics?.customersActive ?? 0}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-white/80">
                {metrics?.customersBlocked ?? 0} blocked · {metrics?.customersTotal ?? 0} total
              </div>
            </div>
          </div>
          <span className="relative mt-2 inline-block text-[11px] font-bold text-white/95 underline-offset-4 group-hover:underline">Manage →</span>
        </Link>

        <Link
          to="/admin/restaurants"
          className="group relative block overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-rose-700 px-4 pb-3 pt-3.5 text-white shadow-lg ring-1 ring-black/5 transition hover:brightness-105"
        >
          <span className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/15" aria-hidden />
          <div className="relative flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 shadow-inner">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeLinejoin="round" />
                <path d="M9 22V12h6v10" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white/90">Active restaurants</div>
              <div className="mt-0.5 text-2xl font-bold tracking-tight">{metrics?.restaurantsApproved ?? 0}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-white/80">
                {metrics?.restaurantsPending ?? 0} pending · {metrics?.restaurantsRejected ?? 0} rejected
              </div>
            </div>
          </div>
          <span className="relative mt-2 inline-block text-[11px] font-bold text-white/95 underline-offset-4 group-hover:underline">Manage →</span>
        </Link>

        <Link
          to="/admin/orders"
          className="group relative block overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 px-4 pb-3 pt-3.5 text-white shadow-lg ring-1 ring-black/5 transition hover:brightness-105"
        >
          <span className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/15" aria-hidden />
          <div className="relative flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 shadow-inner">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" strokeLinejoin="round" />
                <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white/90">Orders (all time)</div>
              <div className="mt-0.5 text-2xl font-bold tracking-tight">{metrics?.totalOrders ?? 0}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-white/80">{metrics?.activeOrders ?? 0} active (in progress)</div>
            </div>
          </div>
          <span className="relative mt-2 inline-block text-[11px] font-bold text-white/95 underline-offset-4 group-hover:underline">View orders →</span>
        </Link>

        <Link
          to="/admin/reports"
          className="group relative block overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-700 px-4 pb-3 pt-3.5 text-white shadow-lg ring-1 ring-black/5 transition hover:brightness-105"
        >
          <span className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/15" aria-hidden />
          <div className="relative flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 shadow-inner">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20M7 5v14" strokeLinecap="round" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white/90">Last 7 days</div>
              <div className="mt-0.5 text-2xl font-bold tracking-tight">${Number(s.revenue || 0).toFixed(0)}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-white/80">
                {s.orders ?? 0} orders · {s.delivered ?? 0} delivered
              </div>
            </div>
          </div>
          <span className="relative mt-2 inline-block text-[11px] font-bold text-white/95 underline-offset-4 group-hover:underline">Reports →</span>
        </Link>
      </div>

      {chartsData ? (
        <Suspense
          fallback={<div className="mb-6 h-72 animate-pulse rounded-2xl bg-stone-200/80" aria-hidden />}
        >
          <OverviewDashboardCharts chartData={chartsData} topItems={topItems} />
        </Suspense>
      ) : (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Charts could not be loaded (is the API running with the latest <code className="rounded bg-white/80 px-1">/admin/overview-charts</code> route?). Metric cards above still use live data.
        </div>
      )}
    </div>
  );
}
