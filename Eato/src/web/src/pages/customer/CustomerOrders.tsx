import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { orders as ordersApi, reviews as reviewsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { Order, OrderStatus, Review } from '../../types/eato';
import { isOrderActive, ORDER_PIPELINE, ORDER_STATUS_LABEL, pipelineStepIndex } from '../../lib/orderStatus';

const PLACEHOLDER_IMG = '/burger1.webp';

type StatusTab = 'all' | 'active' | 'delivered' | 'cancelled';
type DatePreset = 'all' | '7d' | '30d' | '365d';

const TAB_LABELS: { key: StatusTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'all', label: 'All dates' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '365d', label: 'Last 12 months' },
];

function safeId(v: unknown): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v !== null && '_id' in v) return String((v as { _id: string })._id);
  if (typeof (v as { toString?: () => string }).toString === 'function') return (v as { toString: () => string }).toString();
  return String(v);
}

function orderDisplayId(order: Order): string {
  const raw = safeId(order._id);
  const tail = raw.replace(/[^a-f0-9]/gi, '').slice(-8).toUpperCase();
  return tail.length >= 6 ? `EATO-${tail}` : `EATO-${raw.slice(-8).toUpperCase()}`;
}

function formatOrderDate(createdAt: Order['createdAt']): string {
  if (!createdAt) return '';
  return new Date(createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function matchesStatusTab(order: Order, tab: StatusTab): boolean {
  if (tab === 'all') return true;
  if (tab === 'active') return isOrderActive(order.status);
  return order.status === tab;
}

function matchesDatePreset(order: Order, preset: DatePreset): boolean {
  if (preset === 'all' || !order.createdAt) return true;
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 365;
  const cutoff = Date.now() - days * 86400000;
  return new Date(order.createdAt).getTime() >= cutoff;
}

function statusBadgeUI(status: OrderStatus): { label: string; dot: string; wrap: string } {
  if (status === 'delivered') {
    return {
      label: ORDER_STATUS_LABEL.delivered,
      dot: 'bg-fresh-lime',
      wrap: 'bg-fresh-lime/15 text-fresh-green border border-fresh-lime/30',
    };
  }
  if (status === 'cancelled') {
    return {
      label: ORDER_STATUS_LABEL.cancelled,
      dot: 'bg-stone-400',
      wrap: 'bg-stone-100 text-stone-700 border border-stone-200',
    };
  }
  if (status === 'pending') {
    return {
      label: ORDER_STATUS_LABEL.pending,
      dot: 'bg-promo-yellow',
      wrap: 'bg-promo-yellow/20 text-stone-800 border border-promo-yellow/40',
    };
  }
  if (status === 'processing') {
    return {
      label: ORDER_STATUS_LABEL.processing,
      dot: 'bg-promo-teal',
      wrap: 'bg-promo-teal/15 text-brand-greenSoft border border-promo-teal/30',
    };
  }
  if (status === 'packing') {
    return {
      label: ORDER_STATUS_LABEL.packing,
      dot: 'bg-fresh-lime',
      wrap: 'bg-fresh-lime/20 text-fresh-green border border-fresh-lime/35',
    };
  }
  if (status === 'shipping') {
    return {
      label: ORDER_STATUS_LABEL.shipping,
      dot: 'bg-eato-orange',
      wrap: 'bg-eato-orange/15 text-eato-orange border border-eato-orange/30',
    };
  }
  return {
    label: status,
    dot: 'bg-stone-400',
    wrap: 'bg-stone-100 text-stone-700 border border-stone-200',
  };
}

function OrderProgressTracker({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return <p className="text-sm text-stone-500">This order was cancelled.</p>;
  }
  const currentIdx = pipelineStepIndex(status);
  const stepLabels = ['Placed', 'Processing', 'Packing', 'Shipping', 'Delivered'];
  return (
    <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Track order</p>
      <div className="mt-3 flex flex-wrap items-start gap-1">
        {ORDER_PIPELINE.map((step, i) => {
          const complete = i < currentIdx || status === 'delivered';
          const current = i === currentIdx && status !== 'delivered';
          return (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center">
                <span
                  className={[
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                    complete ? 'bg-fresh-green text-white' : current ? 'bg-white text-fresh-green ring-2 ring-fresh-green ring-offset-2' : 'bg-stone-200 text-stone-500',
                  ].join(' ')}
                >
                  {i + 1}
                </span>
                <span className="mt-1 hidden max-w-[4.5rem] text-center text-[10px] text-stone-500 sm:block">{stepLabels[i]}</span>
              </div>
              {i < ORDER_PIPELINE.length - 1 ? (
                <span
                  className={`mx-0.5 mt-4 h-0.5 w-4 self-start sm:w-8 ${i < currentIdx || status === 'delivered' ? 'bg-fresh-green' : 'bg-stone-200'}`}
                  aria-hidden
                />
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-sm font-medium text-fresh-green">{ORDER_STATUS_LABEL[status]}</p>
    </div>
  );
}

type RatingDraft = { rating: number; comment: string };

function itemThumbSrc(item: NonNullable<Order['items']>[number]): string | null {
  const mid = item.menuItemId as { imageUrl?: string } | string | undefined;
  if (mid && typeof mid === 'object' && mid.imageUrl) return mid.imageUrl;
  return null;
}

export default function CustomerOrders() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [submittingCancelId, setSubmittingCancelId] = useState<string | null>(null);
  const [restaurantRatingStateByOrderId, setRestaurantRatingStateByOrderId] = useState<Record<string, RatingDraft>>({});
  const [itemRatingStateByOrderItemKey, setItemRatingStateByOrderItemKey] = useState<Record<string, RatingDraft>>({});

  const reload = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const [o, r] = await Promise.all([ordersApi.my(), reviewsApi.my()]);
      setOrders(o);
      setReviews(r);
      setError('');
    } catch (e: unknown) {
      if (!opts?.silent) setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload, user?._id]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') reload({ silent: true });
    }, 12000);
    const onVis = () => {
      if (document.visibilityState === 'visible') reload({ silent: true });
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [reload]);

  const reviewKey = useMemo(() => {
    const map = new Map<string, Review>();
    for (const r of reviews) {
      const orderId = safeId((r.orderId as { _id?: string })?._id ?? r.orderId);
      const menuItemId = r.menuItemId ? safeId((r.menuItemId as { _id?: string })?._id ?? r.menuItemId) : 'restaurant';
      map.set(`${orderId}:${menuItemId}`, r);
    }
    return map;
  }, [reviews]);

  const getRestaurantIdForOrder = (order: Order) => safeId((order.restaurantId as { _id?: string })?._id ?? order.restaurantId);

  const filteredOrders = useMemo(
    () => orders.filter((o) => matchesStatusTab(o, statusTab) && matchesDatePreset(o, datePreset)),
    [orders, statusTab, datePreset],
  );

  const cancelOrder = async (orderId: string) => {
    setSubmittingCancelId(orderId);
    try {
      await ordersApi.cancel(orderId);
      showToast('Order cancelled');
      await reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Cancel failed');
    } finally {
      setSubmittingCancelId(null);
    }
  };

  const submitRestaurantReview = async (orderId: string, restaurantId: string) => {
    try {
      const st = restaurantRatingStateByOrderId[orderId] || { rating: 5, comment: '' };
      await reviewsApi.create({
        orderId,
        restaurantId,
        rating: st.rating,
        comment: st.comment,
      });
      showToast('Restaurant review saved');
      setRestaurantRatingStateByOrderId((prev) => ({ ...prev, [orderId]: { rating: 5, comment: '' } }));
      await reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Review failed');
    }
  };

  const submitItemReview = async (orderId: string, restaurantId: string, menuItemIdD: string) => {
    const itemKey = `${orderId}:${menuItemIdD}`;
    const st = itemRatingStateByOrderItemKey[itemKey] || { rating: 5, comment: '' };
    try {
      await reviewsApi.create({
        orderId,
        restaurantId,
        menuItemId: menuItemIdD,
        rating: st.rating,
        comment: st.comment,
      });
      showToast('Food item review saved');
      setItemRatingStateByOrderItemKey((prev) => ({ ...prev, [itemKey]: { rating: 5, comment: '' } }));
      await reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Review failed');
    }
  };

  const getReviewForOrder = (orderId: string, menuItemId: string | null) => {
    const key = `${orderId}:${menuItemId ? safeId(menuItemId) : 'restaurant'}`;
    return reviewKey.get(key);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center text-stone-500">
        <p>Loading your orders…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-fresh-green sm:text-3xl">My Orders</h1>
        <p className="mt-1 text-sm text-stone-600">Track deliveries and manage your order history.</p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {TAB_LABELS.map(({ key, label }) => {
            const active = statusTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatusTab(key)}
                className={[
                  'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                  active
                    ? 'border-fresh-green text-fresh-green bg-white ring-1 ring-fresh-green/30'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300',
                ].join(' ')}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="shrink-0">
          <label htmlFor="order-date-preset" className="sr-only">
            Date range
          </label>
          <select
            id="order-date-preset"
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as DatePreset)}
            className="w-full rounded-full border border-stone-200 bg-white py-2 pl-4 pr-10 text-sm font-medium text-stone-700 shadow-sm focus:border-fresh-green focus:outline-none focus:ring-1 focus:ring-fresh-green sm:w-auto"
          >
            {DATE_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white py-14 text-center text-stone-600 shadow-sm">
          No orders in this view.
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {filteredOrders.map((order) => {
            const orderId = safeId(order._id);
            const restaurantId = getRestaurantIdForOrder(order);
            const restaurantName = (order.restaurantId as { restaurantName?: string })?.restaurantName || 'Restaurant';
            const restaurantImg = (order.restaurantId as { imageUrl?: string })?.imageUrl;
            const badge = statusBadgeUI(order.status);
            const items = order.items || [];
            const first = items[0];
            const thumb =
              (first && itemThumbSrc(first)) ||
              restaurantImg ||
              PLACEHOLDER_IMG;
            const extraCount = items.length > 1 ? items.length - 1 : 0;
            const namesLine = items.map((i) => `${i.quantity}× ${i.name}`).join(' | ');
            const shortLine = namesLine.length > 72 ? `${namesLine.slice(0, 70)}…` : namesLine;
            const expanded = expandedId === orderId;
            const cancellable = order.status === 'pending';
            const canRate = order.status === 'delivered';
            const restaurantReview = getReviewForOrder(orderId, null);
            const restaurantDraft = restaurantRatingStateByOrderId[orderId] || { rating: 5, comment: '' };

            return (
              <li key={orderId}>
                <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:border-fresh-green/20 hover:shadow-md">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : orderId)}
                    className="flex w-full gap-3 p-4 text-left sm:gap-4 sm:p-5"
                  >
                    <div className="shrink-0">
                      <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-surface-muted sm:h-24 sm:w-24">
                        <img src={thumb} alt="" className="h-full w-full object-cover" />
                        {extraCount > 0 ? (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-bold text-white">
                            +{extraCount}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.wrap}`}>
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${badge.dot}`} aria-hidden />
                          {badge.label}
                        </span>
                        <span className="hidden h-3 w-px bg-stone-300 sm:inline" aria-hidden />
                        <span className="text-xs font-medium text-stone-500 sm:text-sm">{formatOrderDate(order.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-sm font-bold text-fresh-green sm:text-base">
                        Order ID: {orderDisplayId(order)}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500">{restaurantName}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-stone-700">{shortLine || '—'}</p>
                      <p className="mt-2 text-base font-bold text-stone-900">
                        ${Number(order.totalAmount).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center self-center text-stone-400">
                      <svg
                        className={`h-6 w-6 transition-transform ${expanded ? 'rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  {expanded ? (
                    <div className="border-t border-stone-100 bg-surface-muted/50 px-4 py-4 sm:px-5">
                      <div className="flex flex-wrap gap-2">
                        {cancellable ? (
                          <button
                            type="button"
                            disabled={submittingCancelId === orderId}
                            onClick={(e: FormEvent) => {
                              e.stopPropagation();
                              cancelOrder(orderId);
                            }}
                            className="rounded-lg border border-accent-orange/40 bg-white px-4 py-2 text-sm font-semibold text-accent-orange hover:bg-accent-orange/5 disabled:opacity-60"
                          >
                            {submittingCancelId === orderId ? 'Cancelling…' : 'Cancel order'}
                          </button>
                        ) : null}
                      </div>

                      <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-600">
                        <p>
                          <span className="font-semibold text-stone-800">Delivery: </span>
                          {order.deliveryAddress}
                        </p>
                        {order.customerPhone ? (
                          <p className="mt-1">
                            <span className="font-semibold text-stone-800">Phone: </span>
                            {order.customerPhone}
                          </p>
                        ) : null}
                        <p className="mt-1">
                          <span className="font-semibold text-stone-800">Payment: </span>
                          {order.paymentMethod || 'COD'}
                        </p>
                      </div>

                      <OrderProgressTracker status={order.status} />

                      {canRate ? (
                        <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4">
                          <div className="text-sm font-semibold text-stone-800">Rate your order</div>

                          <div className="mt-3 border-t border-stone-100 pt-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-semibold">Restaurant</div>
                              {restaurantReview ? <span className="text-xs font-semibold text-fresh-green">Saved</span> : null}
                            </div>
                            {restaurantReview ? (
                              <p className="mt-2 text-sm text-stone-700">
                                {restaurantReview.rating} / 5
                                {restaurantReview.comment ? ` — ${restaurantReview.comment}` : ''}
                              </p>
                            ) : (
                              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end">
                                <div>
                                  <label className="text-xs font-semibold text-stone-600">Rating (1–5)</label>
                                  <select
                                    value={restaurantDraft.rating}
                                    onChange={(e) =>
                                      setRestaurantRatingStateByOrderId((prev) => ({
                                        ...prev,
                                        [orderId]: { ...restaurantDraft, rating: Number(e.target.value) },
                                      }))
                                    }
                                    className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm sm:w-28"
                                  >
                                    {[1, 2, 3, 4, 5].map((v) => (
                                      <option key={v} value={v}>
                                        {v}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <label className="text-xs font-semibold text-stone-600">Comment (optional)</label>
                                  <textarea
                                    value={restaurantDraft.comment}
                                    onChange={(e) =>
                                      setRestaurantRatingStateByOrderId((prev) => ({
                                        ...prev,
                                        [orderId]: { ...restaurantDraft, comment: e.target.value },
                                      }))
                                    }
                                    rows={2}
                                    className="mt-1 w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => submitRestaurantReview(orderId, restaurantId)}
                                  className="rounded-lg bg-fresh-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-greenHover"
                                >
                                  Submit
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 border-t border-stone-100 pt-4">
                            <div className="text-sm font-semibold">Food items</div>
                            <div className="mt-3 space-y-3">
                              {items.map((item, idx) => {
                                const menuItemId = safeId(item.menuItemId);
                                const existing = getReviewForOrder(orderId, menuItemId);
                                const itemKey = `${orderId}:${menuItemId}`;
                                const st = itemRatingStateByOrderItemKey[itemKey] || { rating: 5, comment: '' };

                                return (
                                  <div key={`${menuItemId}-${idx}`} className="rounded-xl border border-stone-100 bg-surface-muted/50 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-sm font-semibold">{item.name}</span>
                                      {existing ? <span className="text-xs font-semibold text-fresh-green">Saved</span> : null}
                                    </div>
                                    {existing ? (
                                      <p className="mt-2 text-sm text-stone-700">
                                        {existing.rating} / 5{existing.comment ? ` — ${existing.comment}` : ''}
                                      </p>
                                    ) : (
                                      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end">
                                        <select
                                          value={st.rating}
                                          onChange={(e) =>
                                            setItemRatingStateByOrderItemKey((prev) => ({
                                              ...prev,
                                              [itemKey]: { ...st, rating: Number(e.target.value) },
                                            }))
                                          }
                                          className="rounded-lg border bg-white px-3 py-2 text-sm sm:w-28"
                                        >
                                          {[1, 2, 3, 4, 5].map((v) => (
                                            <option key={v} value={v}>
                                              {v}
                                            </option>
                                          ))}
                                        </select>
                                        <textarea
                                          value={st.comment}
                                          onChange={(e) =>
                                            setItemRatingStateByOrderItemKey((prev) => ({
                                              ...prev,
                                              [itemKey]: { ...st, comment: e.target.value },
                                            }))
                                          }
                                          rows={2}
                                          placeholder="Optional comment"
                                          className="min-w-0 flex-1 resize-none rounded-lg border bg-white px-3 py-2 text-sm"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => submitItemReview(orderId, restaurantId, menuItemId)}
                                          className="rounded-lg bg-fresh-green px-3 py-2 text-sm font-semibold text-white hover:bg-brand-greenHover"
                                        >
                                          Submit
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-stone-600">
                          {order.status === 'pending' && 'You can cancel until the restaurant accepts your order.'}
                          {order.status === 'processing' && 'The restaurant is preparing your order.'}
                          {order.status === 'packing' && 'Your order is being packed.'}
                          {order.status === 'shipping' && 'Your order is out for delivery.'}
                          {order.status === 'cancelled' && 'This order was cancelled.'}
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
