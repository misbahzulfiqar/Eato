import { useCallback, useEffect, useState } from 'react';
import { admin as adminApi } from '../../api';

type RestaurantStatus = 'pending' | 'approved' | 'blocked' | 'rejected';

type AdminRestaurantRow = {
  _id: string;
  restaurantName?: string;
  name?: string;
  email?: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  cuisine?: string;
  imageUrl?: string;
  status: RestaurantStatus;
};

type EditForm = {
  restaurantName: string;
  name: string;
  email: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  cuisine: string;
  imageUrl: string;
};

const emptyEdit: EditForm = {
  restaurantName: '',
  name: '',
  email: '',
  description: '',
  address: '',
  city: '',
  phone: '',
  cuisine: '',
  imageUrl: '',
};

const EDIT_TEXT_FIELDS: (keyof EditForm)[] = [
  'restaurantName',
  'name',
  'email',
  'phone',
  'cuisine',
  'city',
  'imageUrl',
];

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Failed';
}

const STATUS_BADGE_CLASS: Record<RestaurantStatus, string> = {
  approved: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-900',
  rejected: 'bg-red-100 text-red-800',
  blocked: 'bg-stone-200 text-stone-800',
};

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'approved':
      return STATUS_BADGE_CLASS.approved;
    case 'pending':
      return STATUS_BADGE_CLASS.pending;
    case 'rejected':
      return STATUS_BADGE_CLASS.rejected;
    case 'blocked':
      return STATUS_BADGE_CLASS.blocked;
    default:
      return 'bg-stone-200 text-stone-800';
  }
}

export default function AdminRestaurants() {
  const [rows, setRows] = useState<AdminRestaurantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(emptyEdit);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const list = await adminApi.restaurants();
      setRows(Array.isArray(list) ? (list as AdminRestaurantRow[]) : []);
    } catch (e: unknown) {
      setError(errMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patchStatus = async (id: string, status: RestaurantStatus) => {
    setError('');
    try {
      await adminApi.updateRestaurant(id, { status });
      await load();
    } catch (e: unknown) {
      setError(errMessage(e));
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this restaurant permanently?')) return;
    setError('');
    try {
      await adminApi.deleteRestaurant(id);
      setEditId(null);
      await load();
    } catch (e: unknown) {
      setError(errMessage(e));
    }
  };

  const startEdit = (r: AdminRestaurantRow) => {
    setEditId(r._id);
    setEditForm({
      restaurantName: r.restaurantName || '',
      name: r.name || '',
      email: r.email || '',
      description: r.description || '',
      address: r.address || '',
      city: r.city || '',
      phone: r.phone || '',
      cuisine: r.cuisine || '',
      imageUrl: r.imageUrl || '',
    });
  };

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    setError('');
    try {
      await adminApi.updateRestaurant(editId, editForm);
      setEditId(null);
      await load();
    } catch (e: unknown) {
      setError(errMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-stone-600">Loading…</p>;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-stone-900">Restaurants</h1>
      <p className="mb-4 text-sm text-stone-600">Approve or reject signups, suspend for policy issues, and edit listings.</p>
      {error ? <p className="mb-4 text-red-600">{error}</p> : null}

      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r._id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-stone-900">{r.restaurantName}</div>
                <div className="text-sm text-stone-600">
                  {r.email} · owner: {r.name}
                </div>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusBadgeClass(r.status)}`}
                >
                  {r.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {r.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      onClick={() => patchStatus(r._id, 'approved')}
                      className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 hover:bg-green-200"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => patchStatus(r._id, 'rejected')}
                      className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      Reject
                    </button>
                  </>
                )}
                {r.status === 'approved' && (
                  <button
                    type="button"
                    onClick={() => patchStatus(r._id, 'blocked')}
                    className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-200"
                  >
                    Suspend
                  </button>
                )}
                {(r.status === 'blocked' || r.status === 'rejected') && (
                  <button
                    type="button"
                    onClick={() => patchStatus(r._id, 'approved')}
                    className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 hover:bg-green-200"
                  >
                    Reinstate
                  </button>
                )}
                {r.status !== 'pending' && (
                  <button
                    type="button"
                    onClick={() => patchStatus(r._id, 'pending')}
                    className="rounded bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-200"
                  >
                    Set pending
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => startEdit(r)}
                  className="rounded border border-stone-200 px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Edit details
                </button>
                <button
                  type="button"
                  onClick={() => remove(r._id)}
                  className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  Remove
                </button>
              </div>
            </div>

            {editId === r._id && (
              <div className="mt-4 grid gap-3 border-t border-stone-100 pt-4 sm:grid-cols-2">
                {EDIT_TEXT_FIELDS.map((field) => (
                  <label key={field} className="block text-xs font-semibold text-stone-600">
                    {field}
                    <input
                      type={field === 'email' ? 'email' : 'text'}
                      className="mt-1 w-full rounded border border-stone-200 px-2 py-1.5 text-sm"
                      value={editForm[field]}
                      onChange={(e) => setEditForm((f) => ({ ...f, [field]: e.target.value }))}
                    />
                  </label>
                ))}
                <label className="block text-xs font-semibold text-stone-600 sm:col-span-2">
                  Description
                  <textarea
                    className="mt-1 w-full rounded border border-stone-200 px-2 py-1.5 text-sm"
                    rows={2}
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </label>
                <label className="block text-xs font-semibold text-stone-600 sm:col-span-2">
                  Address
                  <input
                    className="mt-1 w-full rounded border border-stone-200 px-2 py-1.5 text-sm"
                    value={editForm.address}
                    onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </label>
                <div className="flex gap-2 sm:col-span-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void saveEdit()}
                    className="rounded-lg bg-eato-orange px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditId(null)}
                    className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
