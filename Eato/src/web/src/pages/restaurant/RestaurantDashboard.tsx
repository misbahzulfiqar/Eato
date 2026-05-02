/**
 * Full-screen restaurant analytics UI (no SiteHeader / SiteFooter).
 * Route: `/restaurant/dashboard` — metrics and charts from live API data.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { menu as menuApi, orders as ordersApi } from '../../api';
import type { MenuItem, Order, OrderStatus } from '../../types/eato';
import RestaurantPartnerShell from './RestaurantPartnerShell';
import { partnerUi } from '../../config/partnerUi';
import { tokens } from '../../config/theme.js';

const STATUS_META: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: tokens.promo.yellow },
  processing: { label: 'Processing', color: tokens.promo.teal },
  packing: { label: 'Packing', color: '#5cb8a8' },
  shipping: { label: 'Shipping', color: tokens.promo.orange },
  delivered: { label: 'Delivered', color: tokens.brand.lime },
  cancelled: { label: 'Cancelled', color: '#94a3b8' },
};

function SidebarIcon({ d }: { d: string }) {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ICONS: Record<string, string> = {
  Dashboard: 'M4 6h16M4 12h16M4 18h7',
  Menu: 'M4 6h16M4 12h10M4 18h16',
  Orders: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  Customers: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  Analytics: 'M18 20V10M12 20V4M6 20v-6',
  Setting: 'M12 15a3 3 0 100-6 3 3 0 000 6z',
};

function customerKey(order: Order): string {
  const c = order.customerId;
  if (c && typeof c === 'object' && '_id' in c) return String((c as { _id: string })._id);
  if (c) return String(c);
  return '';
}

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: n >= 1000 ? 0 : 2 });
}

function formatCompact(n: number): string {
  return n.toLocaleString();
}

function normalizeHeights(values: number[], minH = 12, maxH = 100): number[] {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  return values.map((v) => minH + ((v - min) / span) * (maxH - minH));
}

function ordersLastDays(orders: Order[], days: number): Order[] {
  const cutoff = Date.now() - days * 86400000;
  return orders.filter((o) => {
    const t = o.createdAt ? new Date(o.createdAt).getTime() : 0;
    return t >= cutoff;
  });
}

function groupCountByDay(orders: Order[], days: number): number[] {
  const map = new Map<string, number>();
  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    if (!o.createdAt) continue;
    const key = new Date(o.createdAt).toISOString().slice(0, 10);
    map.set(key, (map.get(key) || 0) + 1);
  }
  const out: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push(map.get(key) || 0);
  }
  return out;
}

function revenueByDay(orders: Order[], days: number): number[] {
  const map = new Map<string, number>();
  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    if (!o.createdAt) continue;
    const key = new Date(o.createdAt).toISOString().slice(0, 10);
    map.set(key, (map.get(key) || 0) + (o.totalAmount || 0));
  }
  const out: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push(map.get(key) || 0);
  }
  return out;
}

function menuAddsByDay(items: MenuItem[], days: number, fallbackTotal: number): number[] {
  const map = new Map<string, number>();
  let anyDate = false;
  for (const m of items) {
    if (!m.createdAt) continue;
    anyDate = true;
    const key = new Date(m.createdAt).toISOString().slice(0, 10);
    map.set(key, (map.get(key) || 0) + 1);
  }
  const out: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push(map.get(key) || 0);
  }
  if (!anyDate && fallbackTotal > 0) {
    return out.map((_, i) => (i === out.length - 1 ? fallbackTotal : Math.max(0, Math.floor(fallbackTotal / 7))));
  }
  return out;
}

type ReportPayload = {
  period: string;
  timeline: Array<{ _id: string; totalSales: number; orderCount: number }>;
  topItems: Array<{ name: string; imageUrl?: string; quantitySold: number; revenue: number }>;
  totals: { totalSales: number; orderCount: number };
};

function MetricCard({
  title,
  value,
  iconPath,
  spark,
}: {
  title: string;
  value: string;
  iconPath: string;
  spark: number[];
}) {
  const heights = normalizeHeights(spark);
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-stone-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-fresh-green/15 text-fresh-green">
          <SidebarIcon d={iconPath} />
        </div>
      </div>
      <div className="mt-3 flex h-10 items-end gap-0.5 overflow-hidden rounded-md bg-gradient-to-t from-fresh-green/15 to-transparent px-1 pt-2">
        {heights.map((h, i) => (
          <div key={i} className="flex-1 rounded-t bg-fresh-lime/70" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

function SalesLineChart({
  timeline,
  loading,
}: {
  timeline: Array<{ _id: string; totalSales: number }>;
  loading: boolean;
}) {
  const { points, labels, ymax } = useMemo(() => {
    const sorted = [...timeline].sort((a, b) => a._id.localeCompare(b._id));
    const slice = sorted.slice(-12);
    const vals = slice.map((t) => t.totalSales || 0);
    const ymaxCalc = Math.max(...vals, 1);
    const lbls = slice.map((t) => {
      const id = t._id;
      if (id.length >= 7 && id.includes('-')) {
        const [y, m] = id.split('-');
        return m ? `${m}/${y?.slice(2)}` : id;
      }
      return id;
    });
    return { points: vals, labels: lbls, ymax: ymaxCalc };
  }, [timeline]);

  const w = 320;
  const h = 140;
  const pad = 8;
  const ptLen = points.length;
  const step = ptLen > 1 ? (w - pad * 2) / (ptLen - 1) : 0;
  const coords =
    ptLen === 0
      ? ''
      : points
          .map((v, i) => {
            const x = ptLen === 1 ? w / 2 : pad + i * step;
            const y = pad + (1 - v / ymax) * (h - pad * 2);
            return `${x},${y}`;
          })
          .join(' ');

  const yTicks = 4;
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => (ymax * (yTicks - i)) / yTicks);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-100">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-stone-900">Sales revenue</h3>
        <span className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600">By month</span>
      </div>
      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-stone-500">Loading chart…</div>
      ) : ptLen === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-stone-500">No revenue in this range yet</div>
      ) : (
        <>
          <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full" preserveAspectRatio="xMidYMid meet">
            {tickVals.map((t, i) => (
              <text key={i} x={4} y={h - 6 - i * ((h - 16) / yTicks)} className="fill-stone-400 text-[10px]">
                {t >= 1000 ? `${(t / 1000).toFixed(1)}k` : Math.round(t).toString()}
              </text>
            ))}
            {points.map((_, i) => (
              <line
                key={i}
                x1={ptLen === 1 ? w / 2 : pad + i * step}
                y1={pad}
                x2={ptLen === 1 ? w / 2 : pad + i * step}
                y2={h - pad}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            ))}
            <polyline
              fill="none"
              stroke={partnerUi.chartPrimary}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={coords}
            />
            {points.map((v, i) => {
              const x = ptLen === 1 ? w / 2 : pad + i * step;
              const y = pad + (1 - v / ymax) * (h - pad * 2);
              return (
                <circle key={i} cx={x} cy={y} r="4" fill="white" stroke={partnerUi.chartPrimary} strokeWidth="2" />
              );
            })}
          </svg>
          <div className="mt-2 flex justify-between gap-1 text-[10px] text-stone-500 sm:text-xs">
            {labels.map((m) => (
              <span key={m} className="max-w-[3rem] truncate text-center">
                {m}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RevenueDonut({
  topItems,
  loading,
}: {
  topItems: Array<{ name: string; revenue: number }>;
  loading: boolean;
}) {
  const size = 160;
  const r = 58;
  const c = 2 * Math.PI * r;
  const segs = useMemo(() => {
    const total = topItems.reduce((s, x) => s + (x.revenue || 0), 0);
    if (total <= 0) return [] as { p: number; color: string; name: string; pct: number }[];
    return topItems.slice(0, 6).map((x, i) => {
      const rev = x.revenue || 0;
      const p = rev / total;
      const palette = partnerUi.donutPalette;
      return { p, color: palette[i % palette.length], name: x.name, pct: Math.round(p * 100) };
    });
  }, [topItems]);

  let offset = 0;
  const periodLabel = 'Top items';
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-100">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-stone-900">Sales by item</h3>
        <span className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-[10px] font-medium text-stone-600">By revenue</span>
      </div>
      {loading ? (
        <div className="flex h-48 items-center justify-center text-sm text-stone-500">Loading…</div>
      ) : segs.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-center text-sm text-stone-500">No item sales in range — orders with menu items will appear here</div>
      ) : (
        <div className="flex flex-col items-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <g transform={`translate(${size / 2},${size / 2})`}>
              {segs.map((s, i) => {
                const dash = s.p * c;
                const circle = (
                  <circle
                    key={i}
                    r={r}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="20"
                    strokeDasharray={`${dash} ${c}`}
                    strokeDashoffset={-offset}
                    transform="rotate(-90)"
                  />
                );
                offset += dash;
                return circle;
              })}
            </g>
            <text x={size / 2} y={size / 2 - 4} textAnchor="middle" className="fill-stone-800 text-xs font-bold">
              {periodLabel}
            </text>
          </svg>
          <ul className="mt-2 w-full max-w-xs space-y-1 text-xs">
            {segs.map((s) => (
              <li key={s.name} className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="truncate">{s.name}</span>
                </span>
                <span className="shrink-0 text-stone-500">{s.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function OrderStatusPie({
  orders,
  loading,
}: {
  orders: Order[];
  loading: boolean;
}) {
  const { segments, total } = useMemo(() => {
    const counts: Record<OrderStatus, number> = {
      pending: 0,
      processing: 0,
      packing: 0,
      shipping: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const o of orders) {
      if (counts[o.status] !== undefined) counts[o.status]++;
    }
    const totalOrders = orders.length;
    const segs = (Object.entries(counts) as [OrderStatus, number][])
      .filter(([, n]) => n > 0)
      .map(([status, n]) => ({
        status,
        n,
        pct: totalOrders ? Math.round((n / totalOrders) * 100) : 0,
        color: STATUS_META[status].color,
        label: STATUS_META[status].label,
      }));
    return { segments: segs, total: totalOrders };
  }, [orders]);

  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const ir = 52;
  const or = 72;

  let start = -90;
  const paths: { d: string; color: string; key: string }[] = [];
  for (const s of segments) {
    const angle = Math.min(359.99, (s.n / Math.max(total, 1)) * 360);
    const end = start + angle;
    const x1 = cx + or * Math.cos((Math.PI * start) / 180);
    const y1 = cy + or * Math.sin((Math.PI * start) / 180);
    const x2 = cx + or * Math.cos((Math.PI * end) / 180);
    const y2 = cy + or * Math.sin((Math.PI * end) / 180);
    const x3 = cx + ir * Math.cos((Math.PI * end) / 180);
    const y3 = cy + ir * Math.sin((Math.PI * end) / 180);
    const x4 = cx + ir * Math.cos((Math.PI * start) / 180);
    const y4 = cy + ir * Math.sin((Math.PI * start) / 180);
    const large = angle > 180 ? 1 : 0;
    const d = `M ${x1} ${y1} A ${or} ${or} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${ir} ${ir} 0 ${large} 0 ${x4} ${y4} Z`;
    paths.push({ d, color: s.color, key: s.status });
    start = end;
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-100">
      <h3 className="mb-4 text-lg font-semibold text-stone-900">Orders by status</h3>
      {loading ? (
        <div className="flex h-52 items-center justify-center text-sm text-stone-500">Loading…</div>
      ) : total === 0 ? (
        <div className="flex h-52 items-center justify-center text-sm text-stone-500">No orders yet</div>
      ) : (
        <div className="flex flex-col items-center sm:flex-row sm:items-start sm:gap-6">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
            {paths.map((p) => (
              <path key={p.key} d={p.d} fill={p.color} stroke="white" strokeWidth="1" />
            ))}
            <text x={cx} y={cy} textAnchor="middle" className="fill-stone-800 text-2xl font-bold">
              {total}
            </text>
            <text x={cx} y={cy + 16} textAnchor="middle" className="fill-stone-500 text-[10px]">
              orders
            </text>
          </svg>
          <ul className="mt-4 w-full space-y-2 text-sm sm:mt-0">
            {segments.map((s) => (
              <li key={s.status} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: s.color }} />
                  {s.label}
                </span>
                <span className="text-stone-600">
                  {s.n} ({s.pct}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function FulfillmentGauge({ delivered, totalActive }: { delivered: number; totalActive: number }) {
  const pct = totalActive > 0 ? Math.round((delivered / totalActive) * 100) : 0;
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-100">
      <h3 className="mb-4 text-lg font-semibold text-stone-900">Fulfillment</h3>
      <div className="flex flex-col items-center">
        <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke={partnerUi.gaugeTrack} strokeWidth="12" />
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke={partnerUi.chartPrimary}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
          />
        </svg>
        <p className="-mt-16 text-3xl font-bold text-fresh-green">{pct}%</p>
        <p className="mt-12 text-center text-sm text-stone-600">
          <span className="font-semibold text-stone-900">{delivered}</span> delivered of {totalActive} active orders
        </p>
        <p className="mt-1 text-xs text-stone-500">Excludes cancelled</p>
      </div>
    </div>
  );
}

export default function RestaurantDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [monthlyReport, setMonthlyReport] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ordList, menus, rep] = await Promise.all([
        ordersApi.restaurant(),
        menuApi.my(),
        ordersApi.reports('monthly'),
      ]);
      setOrders(Array.isArray(ordList) ? ordList : []);
      setMenuItems(Array.isArray(menus) ? menus : []);
      setMonthlyReport(rep as ReportPayload);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const metrics = useMemo(() => {
    const orderCount = orders.length;
    const custSet = new Set<string>();
    for (const o of orders) {
      const k = customerKey(o);
      if (k) custSet.add(k);
    }
    const customerCount = custSet.size;
    const menuCount = menuItems.length;
    const totalIncome = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
    const last14 = ordersLastDays(orders, 14);
    const sparkOrders = groupCountByDay(last14, 14);
    const sparkCustomers = (() => {
      const map = new Map<string, Set<string>>();
      for (const o of last14) {
        if (o.status === 'cancelled') continue;
        if (!o.createdAt) continue;
        const key = new Date(o.createdAt).toISOString().slice(0, 10);
        const k = customerKey(o);
        if (!k) continue;
        if (!map.has(key)) map.set(key, new Set());
        map.get(key)!.add(k);
      }
      const out: number[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        out.push(map.get(key)?.size || 0);
      }
      return out;
    })();
    const sparkMenu = menuAddsByDay(menuItems, 14, menuCount);
    const sparkRevenue = revenueByDay(last14.filter((o) => o.status !== 'cancelled'), 14);
    return {
      orderCount,
      customerCount,
      menuCount,
      totalIncome,
      sparkOrders,
      sparkCustomers,
      sparkMenu,
      sparkRevenue,
    };
  }, [orders, menuItems]);

  const fulfillment = useMemo(() => {
    const active = orders.filter((o) => o.status !== 'cancelled');
    const delivered = orders.filter((o) => o.status === 'delivered').length;
    return { delivered, totalActive: active.length };
  }, [orders]);

  const topItems = monthlyReport?.topItems || [];
  const timeline = monthlyReport?.timeline || [];

  const recent = orders[0];
  const recentCustomer =
    recent && recent.customerId && typeof recent.customerId === 'object' && 'name' in recent.customerId
      ? String((recent.customerId as { name?: string }).name || 'Guest')
      : 'Guest';

  const recentThumb =
    recent?.items?.[0] && typeof recent.items[0].menuItemId === 'object' && (recent.items[0].menuItemId as MenuItem)?.imageUrl
      ? String((recent.items[0].menuItemId as MenuItem).imageUrl)
      : '/pizza main.png';

  const trendItem = topItems[0];

  return (
    <RestaurantPartnerShell title="Dashboard" subtitle="Live metrics from your orders and menu">
      {error ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>{error}</span>
          <button type="button" onClick={load} className="rounded-lg bg-red-100 px-3 py-1.5 font-semibold text-red-900 hover:bg-red-200">
            Retry
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard title="Orders" value={formatCompact(metrics.orderCount)} iconPath={ICONS.Orders} spark={metrics.sparkOrders} />
        <MetricCard title="Customers" value={formatCompact(metrics.customerCount)} iconPath={ICONS.Customers} spark={metrics.sparkCustomers} />
        <MetricCard title="Menu" value={formatCompact(metrics.menuCount)} iconPath={ICONS.Menu} spark={metrics.sparkMenu.map((h) => h / 10)} />
        <MetricCard title="Income" value={formatMoney(metrics.totalIncome)} iconPath={ICONS.Analytics} spark={metrics.sparkRevenue} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SalesLineChart timeline={timeline.map((t) => ({ _id: t._id, totalSales: t.totalSales }))} loading={loading} />
        <RevenueDonut topItems={topItems} loading={loading} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <FulfillmentGauge delivered={fulfillment.delivered} totalActive={fulfillment.totalActive} />
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-100 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-stone-900">Top sellers (from API)</h3>
            <Link to="/restaurant/items" className="text-sm font-semibold text-fresh-green hover:text-brand-greenHover">
              See All
            </Link>
          </div>
          {topItems.length === 0 && !loading ? (
            <p className="text-sm text-stone-500">No sales in the last ~12 months. Completed orders populate this list.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {topItems.slice(0, 3).map((item) => (
                <div key={item.name} className="relative overflow-hidden rounded-xl border border-stone-100 bg-stone-50">
                  <img src={item.imageUrl || '/burger1.webp'} alt="" className="h-32 w-full object-cover" />
                  <div className="p-3">
                    <p className="font-semibold text-stone-900">{item.name}</p>
                    <p className="text-sm font-bold text-fresh-green">{formatMoney(item.revenue)}</p>
                    <p className="text-xs text-stone-500">({item.quantitySold} sold)</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <OrderStatusPie orders={orders} loading={loading} />
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-100 lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-stone-900">Recent order</h3>
          {!recent ? (
            <p className="text-sm text-stone-500">No orders yet.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-stone-100 bg-stone-50/50 p-4">
              <img src={recentThumb} alt="" className="h-16 w-16 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-stone-900">{recent.items?.map((i) => i.name).join(', ') || 'Order'}</p>
                <p className="text-xs text-stone-500">
                  #{String(recent._id).slice(-6)} · {recentCustomer}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-stone-900">{formatMoney(recent.totalAmount)}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                    recent.status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : recent.status === 'processing'
                        ? 'bg-sky-100 text-sky-900'
                        : recent.status === 'packing'
                          ? 'bg-teal-100 text-teal-900'
                          : recent.status === 'shipping'
                            ? 'bg-orange-100 text-orange-900'
                            : recent.status === 'delivered'
                              ? 'bg-fresh-green/15 text-fresh-green'
                              : recent.status === 'cancelled'
                                ? 'bg-stone-200 text-stone-700'
                                : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {STATUS_META[recent.status]?.label || recent.status}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-100 lg:col-span-3">
          <h3 className="mb-4 text-lg font-semibold text-stone-900">Trending (by quantity)</h3>
          {!trendItem ? (
            <p className="text-sm text-stone-500">No trending data yet.</p>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-stone-100 p-3">
              <img src={trendItem.imageUrl || '/dish.png'} alt="" className="h-14 w-14 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-stone-900">{trendItem.name}</p>
                <p className="text-xs text-stone-500">
                  {formatMoney(trendItem.revenue)} · {trendItem.quantitySold} sold (reporting window)
                </p>
              </div>
              <Link
                to="/restaurant/orders"
                className="shrink-0 rounded-lg bg-fresh-green/10 px-3 py-1.5 text-xs font-semibold text-fresh-green hover:bg-fresh-green/15"
              >
                View orders
              </Link>
            </div>
          )}
        </div>
      </div>
    </RestaurantPartnerShell>
  );
}
