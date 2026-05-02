import { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const STATUS_COLORS = {
  pending: '#eab308',
  processing: '#3b82f6',
  packing: '#6366f1',
  shipping: '#8b5cf6',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

const PALETTE = ['#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#a855f7', '#14b8a6', '#f97316', '#06b6d4'];

function formatDayLabel(isoDate) {
  if (!isoDate) return '';
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? `${str.slice(0, n - 1)}…` : str;
}

const STATUS_BADGE_CLASSES = {
  pending: 'bg-amber-100 text-amber-900 ring-amber-400/45',
  processing: 'bg-blue-100 text-blue-900 ring-blue-400/45',
  packing: 'bg-indigo-100 text-indigo-900 ring-indigo-400/45',
  shipping: 'bg-violet-100 text-violet-900 ring-violet-400/45',
  delivered: 'bg-emerald-100 text-emerald-900 ring-emerald-400/45',
  cancelled: 'bg-red-100 text-red-900 ring-red-400/45',
};

function statusBadgeClass(status) {
  const key = String(status || '').toLowerCase();
  return STATUS_BADGE_CLASSES[key] || 'bg-stone-100 text-stone-700 ring-stone-400/40';
}

function OrderPreviewThumb({ url }) {
  const [failed, setFailed] = useState(false);
  const frame =
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 p-1 overflow-hidden';
  if (!url || failed) {
    return (
      <div className={`${frame} border-dashed border-stone-300`} title="No image">
        <span className="text-[11px] font-medium text-stone-400">—</span>
      </div>
    );
  }
  return (
    <div className={frame}>
      <img
        src={url}
        alt=""
        className="max-h-full max-w-full object-contain object-center"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export default function OverviewDashboardCharts({ chartData, topItems }) {
  const dailyActivity = chartData?.dailyActivity || [];
  const orderStatusBreakdown = chartData?.orderStatusBreakdown || [];
  const restaurantShare = chartData?.restaurantShare || [];
  const recentOrders = chartData?.recentOrders || [];

  const lineData = dailyActivity.map((d) => ({
    ...d,
    label: formatDayLabel(d.date),
  }));

  const statusPieData = orderStatusBreakdown
    .filter((x) => x.count > 0)
    .map((x) => ({
      name: String(x.status).replace(/^\w/, (c) => c.toUpperCase()),
      statusKey: String(x.status).toLowerCase(),
      value: x.count,
    }));

  const restaurantPieData = restaurantShare
    .filter((x) => x.orderCount > 0)
    .map((x) => ({ name: truncate(x.name, 18), fullName: x.name, value: x.orderCount }));

  const topItemsPie = (topItems || [])
    .slice(0, 6)
    .filter((x) => (x.quantitySold || 0) > 0)
    .map((x) => ({
      name: truncate(x.name || 'Item', 20),
      fullName: x.name,
      value: x.quantitySold,
    }));

  const renderTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs shadow-lg">
        {payload.map((p) => (
          <div key={p.dataKey} className="font-medium text-stone-800">
            {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mb-6 space-y-6">
      <div className="grid gap-4 lg:grid-cols-5 lg:gap-5">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm lg:col-span-3">
          <h2 className="mb-1 text-lg font-bold text-stone-900">Daily activity</h2>
          <p className="mb-4 text-xs text-stone-500">Last 14 days — orders placed vs delivered vs cancelled (live totals).</p>
          {!lineData.length ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-stone-500">No activity in this window yet.</div>
          ) : (
            <div className="h-[280px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="fillDelivered" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="fillCancelled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f87171" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#f87171" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#78716c" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#78716c" width={44} />
                  <Tooltip content={renderTooltip} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="orders" name="Orders placed" stroke="#d97706" fill="url(#fillOrders)" strokeWidth={2} />
                  <Area type="monotone" dataKey="delivered" name="Delivered" stroke="#16a34a" fill="url(#fillDelivered)" strokeWidth={2} />
                  <Area type="monotone" dataKey="cancelled" name="Cancelled" stroke="#dc2626" fill="url(#fillCancelled)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm lg:col-span-2">
          <h2 className="mb-1 text-lg font-bold text-stone-900">Top selling items</h2>
          <p className="mb-2 text-xs text-stone-500">Units sold (all time, top 6).</p>
          {!topItemsPie.length ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-stone-500">No sales yet.</div>
          ) : (
            <div className="h-[280px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(value, _name, props) => [
                      `${Number(value).toLocaleString()} sold`,
                      props.payload?.fullName || props.payload?.name,
                    ]}
                  />
                  <Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: 11 }} />
                  <Pie
                    data={topItemsPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="46%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {topItemsPie.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="mb-1 text-lg font-bold text-stone-900">All orders — by status</h2>
          <p className="mb-2 text-xs text-stone-500">Platform-wide counts (every restaurant combined).</p>
          {!statusPieData.length ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-stone-500">No data.</div>
          ) : (
            <div className="h-[240px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip formatter={(v) => `${Number(v).toLocaleString()} orders`} />
                  <Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: 11 }} />
                  <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={2}>
                    {statusPieData.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.statusKey] || PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="mb-1 text-lg font-bold text-stone-900">Orders by restaurant</h2>
          <p className="mb-2 text-xs text-stone-500">Non-cancelled orders only — share by partner (top 8).</p>
          {!restaurantPieData.length ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-stone-500">No restaurant orders yet.</div>
          ) : (
            <div className="h-[240px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(value, _name, props) => [
                      `${Number(value).toLocaleString()} orders`,
                      props.payload?.fullName || props.payload?.name,
                    ]}
                  />
                  <Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: 10 }} />
                  <Pie
                    data={restaurantPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={1}
                  >
                    {restaurantPieData.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-lg font-bold text-stone-900">Recent orders</h2>
        <p className="mb-3 text-xs text-stone-500">Restaurant, status, and amount — newest first (from API).</p>
        {!recentOrders.length ? (
          <p className="text-sm text-stone-500">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-stone-200">
            <table className="w-full min-w-[580px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-600">
                  <th className="border border-stone-200 px-3 py-2.5 text-center">Preview</th>
                  <th className="border border-stone-200 px-3 py-2.5">Restaurant</th>
                  <th className="border border-stone-200 px-3 py-2.5">Status</th>
                  <th className="border border-stone-200 px-3 py-2.5">Amount</th>
                  <th className="border border-stone-200 px-3 py-2.5">When</th>
                </tr>
              </thead>
              <tbody className="bg-white text-stone-800">
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="border border-stone-200 px-3 py-2.5 align-middle">
                      <div className="flex justify-center">
                        <OrderPreviewThumb url={o.previewImageUrl} />
                      </div>
                    </td>
                    <td className="border border-stone-200 px-3 py-2 align-middle font-medium">{o.restaurantName}</td>
                    <td className="border border-stone-200 px-3 py-2 align-middle">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${statusBadgeClass(o.status)}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="border border-stone-200 px-3 py-2 align-middle">${Number(o.totalAmount || 0).toFixed(2)}</td>
                    <td className="border border-stone-200 px-3 py-2 align-middle text-xs text-stone-500">
                      {new Date(o.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
