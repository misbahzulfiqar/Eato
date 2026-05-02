import { useCallback, useEffect, useState } from 'react';
import { admin as adminApi } from '../../api';

export default function AdminReports() {
  const [period, setPeriod] = useState('week');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      setData(await adminApi.reports(period));
    } catch (e) {
      setError(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="text-stone-600">Loading…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  const s = data?.summary || {};

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-stone-900">Reports & analytics</h1>
      <p className="mb-4 text-sm text-stone-600">Sales and order trends by day; restaurant performance for the selected window.</p>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {['day', 'week', 'month'].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize ${period === p ? 'bg-eato-orange text-white' : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50'}`}
          >
            {p === 'day' ? 'Daily (24h)' : p === 'week' ? 'Weekly (7d)' : 'Monthly (30d)'}
          </button>
        ))}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-stone-500">Orders</div>
          <div className="text-2xl font-bold text-stone-900">{s.orders ?? 0}</div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-stone-500">Gross sales</div>
          <div className="text-2xl font-bold text-stone-900">${Number(s.revenue || 0).toFixed(2)}</div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-stone-500">Delivered</div>
          <div className="text-2xl font-bold text-stone-900">{s.delivered ?? 0}</div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-stone-500">Cancelled</div>
          <div className="text-2xl font-bold text-stone-900">{s.cancelled ?? 0}</div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-stone-900">Sales by day</h2>
        {!data?.trend?.length ? (
          <p className="text-sm text-stone-500">No data in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-stone-600">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Orders</th>
                  <th className="py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.trend.map((row) => (
                  <tr key={row._id} className="border-b border-stone-50">
                    <td className="py-2 pr-4 font-medium">{row._id}</td>
                    <td className="py-2 pr-4">{row.orders}</td>
                    <td className="py-2">${Number(row.revenue).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-stone-900">Restaurant performance</h2>
        {!data?.restaurants?.length ? (
          <p className="text-sm text-stone-500">No restaurant data in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-stone-600">
                  <th className="py-2 pr-4">Restaurant</th>
                  <th className="py-2 pr-4">Orders</th>
                  <th className="py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.restaurants.map((row) => (
                  <tr key={String(row._id)} className="border-b border-stone-50">
                    <td className="py-2 pr-4 font-medium">{row.restaurantName || '—'}</td>
                    <td className="py-2 pr-4">{row.orders}</td>
                    <td className="py-2">${Number(row.revenue).toFixed(2)}</td>
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
