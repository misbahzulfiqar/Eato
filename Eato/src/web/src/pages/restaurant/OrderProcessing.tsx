import { useCallback, useEffect, useState } from 'react';
import { orders as ordersApi } from '../../api';
import type { Order, OrderStatus } from '../../types/eato';
import { nextRestaurantStatus, ORDER_STATUS_LABEL } from '../../lib/orderStatus';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { pushRestaurantNotification } from '../../lib/notifications';

const statusMeta: Record<OrderStatus, { className: string }> = {
  pending: { className: 'bg-amber-50 text-amber-800 border-amber-200' },
  processing: { className: 'bg-sky-50 text-sky-900 border-sky-200' },
  packing: { className: 'bg-teal-50 text-teal-900 border-teal-200' },
  shipping: { className: 'bg-orange-50 text-orange-900 border-orange-200' },
  delivered: { className: 'bg-green-50 text-green-800 border-green-200' },
  cancelled: { className: 'bg-stone-50 text-stone-700 border-stone-200' },
};

function orderKey(o: Order): string {
  const id = o._id;
  return typeof id === 'string' ? id : String(id);
}

export default function OrderProcessing() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const list = await ordersApi.restaurant();
      const rid = String((user as { _id?: string; id?: string } | null)?._id ?? (user as { id?: string } | null)?.id ?? '');
      if (rid) {
        const seenKey = `eato_restaurant_seen_orders_${rid}`;
        const seen = new Set<string>(JSON.parse(sessionStorage.getItem(seenKey) || '[]'));
        const ids = list.map(orderKey);
        const newOnes = ids.filter((id) => !seen.has(id));
        if (newOnes.length && opts?.silent) {
          showToast(`New order received (${newOnes.length})`);
          pushRestaurantNotification(rid, { title: `New order received (${newOnes.length})` });
        }
        sessionStorage.setItem(seenKey, JSON.stringify(ids.slice(0, 200)));
      }
      setOrders(list);
      setError('');
    } catch (e: unknown) {
      if (!opts?.silent) {
        const msg = e instanceof Error ? e.message : 'Failed to load orders';
        if (/access\s*denied|unauthorized|permission\s*denied|denied/i.test(msg)) setError('');
        else setError(msg);
      }
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [showToast, user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') load({ silent: true });
    }, 12000);
    const onVis = () => {
      if (document.visibilityState === 'visible') load({ silent: true });
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(t);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [load]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
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
    <div className="mx-auto max-w-[1320px] px-2 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold">Order Processing</h1>
      {error ? <p className="mb-4 text-red-600">{error}</p> : null}

      {!orders.length ? (
        <p className="text-stone-500">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const oid = orderKey(order);
            const meta = statusMeta[order.status] ?? statusMeta.pending;
            const next = nextRestaurantStatus(order.status);
            const busy = busyId === oid;
            return (
              <div key={oid} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">Order #{oid.slice(-6)}</span>
                  <span className="text-sm text-stone-500">
                    {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                  </span>
                </div>
                {order.customerId ? (
                  <p className="text-sm text-stone-600">
                    Customer: {(order.customerId as { name?: string }).name} — {(order.customerId as { email?: string }).email}
                  </p>
                ) : null}
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
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}>
                    {ORDER_STATUS_LABEL[order.status]}
                  </span>
                </div>

                {order.status === 'pending' ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => updateStatus(oid, 'processing')}
                      className="rounded-lg bg-fresh-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-greenHover disabled:opacity-60"
                    >
                      {busy ? '…' : 'Accept'}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => updateStatus(oid, 'cancelled')}
                      className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
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
                      className="rounded-lg bg-fresh-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-greenHover disabled:opacity-60"
                    >
                      {busy
                        ? 'Updating…'
                        : next === 'packing'
                          ? 'Mark packing'
                          : next === 'shipping'
                            ? 'Mark out for delivery'
                            : next === 'delivered'
                              ? 'Mark delivered'
                              : `Advance to ${ORDER_STATUS_LABEL[next]}`}
                    </button>
                  </div>
                ) : null}

                {order.status === 'delivered' ? <p className="mt-2 text-sm font-semibold text-green-700">Completed</p> : null}
                {order.status === 'cancelled' ? <p className="mt-2 text-sm font-semibold text-stone-600">Cancelled</p> : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
