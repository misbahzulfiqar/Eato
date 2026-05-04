import { useCallback, useEffect, useState } from 'react';
import { admin as adminApi } from '../../api';

type PopulatedRef = { _id?: string; name?: string; email?: string; phone?: string; restaurantName?: string; imageUrl?: string };
type OrderItem = { menuItemId?: string | PopulatedRef; name: string; price: number; quantity: number };
type OrderDoc = {
  _id: string;
  status: string;
  totalAmount: number;
  createdAt?: string;
  deliveryAddress?: string;
  customerPhone?: string;
  adminNotes?: string;
  disputeSummary?: string;
  disputeOpen?: boolean;
  items?: OrderItem[];
  customerId?: PopulatedRef;
  restaurantId?: PopulatedRef;
};

function pickOrderPreviewUrl(o: OrderDoc): string {
  for (const it of o.items || []) {
    const mi = it.menuItemId;
    if (mi && typeof mi === 'object' && 'imageUrl' in mi && mi.imageUrl) return String(mi.imageUrl);
  }
  const rest = o.restaurantId;
  if (rest && typeof rest === 'object' && rest.imageUrl) return String(rest.imageUrl);
  return '';
}

function OrderPreviewThumb({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  const frame =
    'flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 p-1 overflow-hidden';
  if (!url || failed) {
    return (
      <div className={`${frame} border-dashed border-stone-300`} title="No image">
        <span className="text-xs font-medium text-stone-400">—</span>
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

const STATUSES = ['', 'pending', 'processing', 'packing', 'shipping', 'delivered', 'cancelled'] as const;

const LABEL: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  packing: 'Packing',
  shipping: 'Shipping',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function idStr(v: unknown): string {
  if (!v) return '';
  if (typeof v === 'object' && v !== null && '_id' in v) return String((v as { _id: string })._id);
  return String(v);
}

export default function AdminOrders() {
  const [filter, setFilter] = useState('');
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState({ adminNotes: '', disputeSummary: '', disputeOpen: false });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const params = filter ? { status: filter } : undefined;
      const list = await adminApi.orders(params);
      setOrders(Array.isArray(list) ? (list as OrderDoc[]) : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDispute = (o: OrderDoc) => {
    const oid = idStr(o._id);
    setExpanded(expanded === oid ? null : oid);
    setNotesDraft({
      adminNotes: o.adminNotes || '',
      disputeSummary: o.disputeSummary || '',
      disputeOpen: !!o.disputeOpen,
    });
  };

  const saveNotes = async (orderId: string) => {
    setSaving(true);
    setError('');
    try {
      await adminApi.patchOrder(orderId, notesDraft);
      setExpanded(null);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-stone-600">Loading…</p>;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-stone-900">Orders</h1>
      <p className="mb-4 text-sm text-stone-600">All platform orders, status tracking, and dispute notes.</p>
      {error ? <p className="mb-4 text-red-600">{error}</p> : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="text-sm font-medium text-stone-700">Filter:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm">
          {STATUSES.map((s) => (
            <option key={s || 'all'} value={s}>
              {s ? LABEL[s] : 'All statuses'}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {orders.map((o) => {
          const oid = idStr(o._id);
          const cust = o.customerId;
          const rest = o.restaurantId;
          const isOpen = expanded === oid;
          return (
            <div key={oid} className="rounded-xl border border-stone-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => openDispute(o)}
                className="flex w-full flex-wrap items-center gap-3 p-4 text-left hover:bg-stone-50 sm:flex-nowrap sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex shrink-0 justify-center">
                    <OrderPreviewThumb url={pickOrderPreviewUrl(o)} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-semibold text-stone-900">#{oid.slice(-8)}</div>
                    <div className="text-xs text-stone-500">
                      {LABEL[o.status] || o.status} · ${Number(o.totalAmount).toFixed(2)} COD
                    </div>
                    <div className="text-xs text-stone-600">
                      {cust?.name || 'Customer'} → {rest?.restaurantName || 'Restaurant'}
                    </div>
                    {o.disputeOpen ? (
                      <span className="mt-1 inline-block rounded bg-red-100 px-1.5 py-0.5 text-xs font-bold text-red-800">DISPUTE</span>
                    ) : null}
                  </div>
                </div>
                <div className="w-full shrink-0 text-xs text-stone-400 sm:w-auto sm:text-right">
                  {o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-stone-100 bg-stone-50 p-4 text-sm">
                  <p className="text-stone-700">
                    <span className="font-semibold">Delivery: </span>
                    {o.deliveryAddress}
                  </p>
                  <p className="mt-1 text-stone-700">
                    <span className="font-semibold">Phone: </span>
                    {o.customerPhone || cust?.phone || '—'}
                  </p>
                  <ul className="mt-2 list-inside list-disc text-stone-600">
                    {(o.items || []).map((it, i) => (
                      <li key={i}>
                        {it.quantity}× {it.name} @ ${Number(it.price).toFixed(2)}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 rounded-lg border border-stone-200 bg-white p-3">
                    <div className="text-xs font-bold uppercase tracking-wide text-stone-500">Support / disputes</div>
                    <label className="mt-2 flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={notesDraft.disputeOpen}
                        onChange={(e) => setNotesDraft((d) => ({ ...d, disputeOpen: e.target.checked }))}
                      />
                      Flag dispute open
                    </label>
                    <label className="mt-2 block text-xs font-semibold text-stone-600">
                      Admin notes
                      <textarea
                        className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                        rows={2}
                        value={notesDraft.adminNotes}
                        onChange={(e) => setNotesDraft((d) => ({ ...d, adminNotes: e.target.value }))}
                      />
                    </label>
                    <label className="mt-2 block text-xs font-semibold text-stone-600">
                      Dispute summary (visible to internal notes only)
                      <textarea
                        className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                        rows={2}
                        value={notesDraft.disputeSummary}
                        onChange={(e) => setNotesDraft((d) => ({ ...d, disputeSummary: e.target.value }))}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void saveNotes(oid)}
                      className="mt-3 rounded-lg bg-eato-orange px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!orders.length ? <p className="mt-6 text-stone-500">No orders in this view.</p> : null}
    </div>
  );
}
