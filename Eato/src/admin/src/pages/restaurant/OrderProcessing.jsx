import { useCallback, useEffect, useState } from 'react';
import { orders as ordersApi } from '../../api';

const LABEL = {
  pending: 'Pending',
  processing: 'Processing',
  packing: 'Packing',
  shipping: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function nextRestaurantStatus(current) {
  if (current === 'cancelled' || current === 'delivered') return null;
  if (current === 'pending') return null;
  const pipeline = ['pending', 'processing', 'packing', 'shipping', 'delivered'];
  const idx = pipeline.indexOf(current);
  if (idx < 0 || idx >= pipeline.length - 1) return null;
  return pipeline[idx + 1];
}

export default function OrderProcessing() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async (opts) => {
    if (!opts?.silent) setLoading(true);
    try {
      const list = await ordersApi.restaurant();
      setOrders(list);
      setError('');
    } catch (e) {
      if (!opts?.silent) setError(e.message || 'Failed to load');
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (orderId, status) => {
    setError('');
    setBusyId(orderId);
    try {
      await ordersApi.updateStatus(orderId, status);
      await load({ silent: true });
    } catch (err) {
      setError(err.message || 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p className="text-center py-8">Loading orders...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Incoming Orders</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {!orders.length ? (
        <p className="text-stone-500">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const oid = String(order._id);
            const next = nextRestaurantStatus(order.status);
            const busy = busyId === oid;
            return (
              <div key={oid} className="p-4 bg-white border rounded-xl shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="font-medium">Order #{oid.slice(-6)}</span>
                  <span className="text-stone-500 text-sm">{new Date(order.createdAt).toLocaleString()}</span>
                </div>
                {order.customerId && (
                  <p className="text-stone-600 text-sm">
                    Customer: {order.customerId.name} — {order.customerId.email}
                  </p>
                )}
                <p className="text-stone-600 text-sm">Delivery: {order.deliveryAddress}</p>
                <ul className="mt-2 text-sm">
                  {order.items?.map((item, i) => (
                    <li key={i}>
                      {item.name} × {item.quantity} — ${(item.price * item.quantity).toFixed(2)}
                    </li>
                  ))}
                </ul>
                <p className="font-semibold mt-2">Total: ${order.totalAmount?.toFixed(2)} (COD)</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-stone-500">Status:</span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-stone-50">{LABEL[order.status] || order.status}</span>
                </div>
                {order.status === 'pending' ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => updateStatus(oid, 'processing')}
                      className="rounded-lg bg-fresh-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => updateStatus(oid, 'cancelled')}
                      className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
                {next ? (
                  <div className="mt-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => updateStatus(oid, next)}
                      className="rounded-lg bg-eato-orange px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {busy ? 'Updating…' : `Advance to ${LABEL[next]}`}
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
