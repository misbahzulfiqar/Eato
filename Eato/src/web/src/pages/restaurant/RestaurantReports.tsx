import { useEffect, useState } from 'react';
import { orders as ordersApi } from '../../api';

type ReportData = {
  period: string;
  rangeStart?: string | Date;
  totals?: { totalSales?: number; orderCount?: number };
  timeline?: Array<{ _id: string; totalSales?: number; orderCount?: number }>;
  topItems?: Array<{ menuItemId: string; name: string; quantitySold: number; revenue: number; imageUrl?: string }>;
};

function csvEscape(value: string | number | undefined | null): string {
  const s = value === undefined || value === null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadReportCsv(period: string, data: ReportData) {
  const lines: string[] = [];
  lines.push('metric,value');
  lines.push(`report_period,${csvEscape(period)}`);
  lines.push(`range_start,${csvEscape(data.rangeStart ? new Date(data.rangeStart).toISOString() : '')}`);
  lines.push(`total_sales,${Number(data.totals?.totalSales || 0).toFixed(2)}`);
  lines.push(`order_count,${data.totals?.orderCount ?? 0}`);
  lines.push('');
  lines.push('timeline_bucket,sales,orders');
  for (const row of data.timeline || []) {
    lines.push([csvEscape(row._id), Number(row.totalSales || 0).toFixed(2), row.orderCount ?? 0].join(','));
  }
  lines.push('');
  lines.push('menu_item_id,name,quantity_sold,revenue');
  for (const it of data.topItems || []) {
    lines.push(
      [csvEscape(it.menuItemId), csvEscape(it.name), it.quantitySold, Number(it.revenue || 0).toFixed(2)].join(','),
    );
  }
  const body = lines.join('\r\n');
  const blob = new Blob([body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `eato-restaurant-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RestaurantReports() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<ReportData | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const d = await ordersApi.reports(period);
      setData(d as ReportData);
    } catch (e: any) {
      setError(e.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  if (loading) return <p className="text-center py-8">Loading reports...</p>;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales Reports</h1>
          <p className="mt-1 text-sm text-stone-600">Daily, weekly, or monthly performance for your restaurant.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                period === p ? 'border-fresh-green bg-fresh-green text-white' : 'bg-white hover:bg-surface-muted'
              }`}
            >
              {p[0].toUpperCase() + p.slice(1)}
            </button>
          ))}
          {data && !loading ? (
            <button
              type="button"
              onClick={() => downloadReportCsv(period, data)}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50"
            >
              Download CSV
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-red-600 mb-4">{error}</p> : null}

      {!data ? null : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">Total sales</div>
              <div className="mt-2 text-2xl font-bold text-fresh-green">${Number(data.totals?.totalSales || 0).toFixed(2)}</div>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">Orders</div>
              <div className="mt-2 text-2xl font-bold">${Number(data.totals?.orderCount || 0)}</div>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">Range start</div>
              <div className="mt-2 text-sm font-semibold text-stone-800">{data.rangeStart ? new Date(data.rangeStart).toLocaleDateString() : '-'}</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Sales timeline</div>
                <div className="text-xs text-stone-500">{period}</div>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 font-semibold text-stone-600">Period</th>
                      <th className="text-right py-2 px-2 font-semibold text-stone-600">Sales</th>
                      <th className="text-right py-2 px-2 font-semibold text-stone-600">Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.timeline || []).map((row) => (
                      <tr key={row._id} className="border-b last:border-b-0">
                        <td className="py-2 px-2 text-stone-800">{row._id}</td>
                        <td className="py-2 px-2 text-right font-semibold">${Number(row.totalSales || 0).toFixed(2)}</td>
                        <td className="py-2 px-2 text-right">{row.orderCount}</td>
                      </tr>
                    ))}
                    {(data.timeline || []).length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-4 px-2 text-center text-stone-500">
                          No data in this range.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold">Top selling items</div>
              <div className="mt-3 space-y-3">
                {(data.topItems || []).map((it) => (
                  <div key={it.menuItemId} className="flex items-start gap-3">
                    {it.imageUrl ? (
                      <img src={it.imageUrl} alt="" className="h-12 w-12 rounded-lg border object-cover bg-stone-50" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg border bg-surface-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-stone-800">{it.name}</div>
                      <div className="mt-1 text-xs text-stone-600">{it.quantitySold} sold</div>
                      <div className="mt-1 text-xs font-semibold text-fresh-green">${Number(it.revenue || 0).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
                {(data.topItems || []).length === 0 ? <p className="text-sm text-stone-600">No sales yet.</p> : null}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

