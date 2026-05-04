import { useCallback, useEffect, useState } from 'react';
import { orders as ordersApi } from '../../api';

const LABEL: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  packing: 'Packing',
  shipping: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function nextRestaurantStatus(current: string): string | null {
  if (current === 'cancelled' || current === 'delivered') return null;
  if (current === 'pending') return null;
  const pipeline = ['pending', 'processing', 'packing', 'shipping', 'delivered'];
  const idx = pipeline.indexOf(current);
  if (idx < 0 || idx >= pipeline.length - 1) return null;
  return pipeline[idx + 1] ?? null;
}

type OrderItem = { name: string; quantity: number; price: number };

type CustomerRef = { name?: string; email?: string };

type OrderRow = {
  _id: string;
  status: string;
  createdAt: string;
  customerId?: CustomerRef;
  deliveryAddress?: string;
  items?: OrderItem[];
  totalAmount?: number;
};

export default function OrderProcessing() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const list = (await ordersApi.restaurant()) as OrderRow[];
      setOrders(list);
      setError('');
    } catch (e: unknown) {
      if (!opts?.silent) setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (orderId: string, status: string) => {
    setError('');
    setBusyId(orderId);
    try {
      await ordersApi.updateStatus(orderId, status);
      await load({ silent: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p className="py-8 text-center">Loading orders...</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Incoming Orders</h1>
      {error && <p className="mb-4 text-red-600">{error}</p>}
      {!orders.length ? (
        <p className="text-stone-500">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const oid = String(order._id);
            const next = nextRestaurantStatus(order.status);
            const busy = busyId === oid;
            return (
              <div key={oid} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">Order #{oid.slice(-6)}</span>
                  <span className="text-sm text-stone-500">{new Date(order.createdAt).toLocaleString()}</span>
                </div>
                {order.customerId && (
                  <p className="text-sm text-stone-600">
                    Customer: {order.customerId.name} — {order.customerId.email}
                  </p>
                )}
                <p className="text-sm text-stone-600">Delivery: {order.deliveryAddress}</p>
                <ul className="mt-2 text-sm">
                  {order.items?.map((item, i) => (
                    <li key={i}>
                      {item.name} × {item.quantity} — ${(item.price * item.quantity).toFixed(2)}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 font-semibold">Total: ${order.totalAmount?.toFixed(2)} (COD)</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-stone-500">Status:</span>
                  <span className="rounded-full border bg-stone-50 px-3 py-1 text-xs font-semibold">
                    {LABEL[order.status] ?? order.status}
                  </span>
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
                      {busy ? 'Updating…' : `Advance to ${LABEL[next] ?? next}`}
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
