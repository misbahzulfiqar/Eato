import { useCallback, useEffect, useState } from 'react';
import { admin as adminApi } from '../../api';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString();
}

export default function AdminCustomers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      setRows(await adminApi.customers());
    } catch (e) {
      setError(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id, status) => {
    setError('');
    try {
      await adminApi.updateCustomer(id, { status });
      load();
    } catch (e) {
      setError(e.message || 'Failed');
    }
  };

  const remove = async (id) => {
    if (!confirm('Permanently delete this customer and orphan related data references?')) return;
    setError('');
    try {
      await adminApi.deleteCustomer(id);
      load();
    } catch (e) {
      setError(e.message || 'Failed');
    }
  };

  if (loading) return <p className="text-stone-600">Loading…</p>;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-stone-900">Customers</h1>
      <p className="mb-4 text-sm text-stone-600">Activate or deactivate accounts and monitor order activity.</p>
      {error ? <p className="mb-4 text-red-600">{error}</p> : null}
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead className="bg-stone-100 text-left text-stone-700">
            <tr>
              <th className="p-3 font-semibold">Name</th>
              <th className="p-3 font-semibold">Email</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Orders</th>
              <th className="p-3 font-semibold">Spent</th>
              <th className="p-3 font-semibold">Last order</th>
              <th className="p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c._id} className="border-t border-stone-100">
                <td className="p-3 font-medium text-stone-900">{c.name}</td>
                <td className="p-3 text-stone-600">{c.email}</td>
                <td className="p-3 capitalize">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'}`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="p-3 text-stone-700">{c.activity?.orderCount ?? 0}</td>
                <td className="p-3 text-stone-700">${Number(c.activity?.totalSpent ?? 0).toFixed(2)}</td>
                <td className="p-3 text-stone-500">{fmtDate(c.activity?.lastOrderAt)}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {c.status === 'active' ? (
                      <button type="button" onClick={() => setStatus(c._id, 'blocked')} className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-200">
                        Deactivate
                      </button>
                    ) : (
                      <button type="button" onClick={() => setStatus(c._id, 'active')} className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 hover:bg-green-200">
                        Activate
                      </button>
                    )}
                    <button type="button" onClick={() => remove(c._id)} className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
