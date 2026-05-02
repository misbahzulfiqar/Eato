import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { menu as menuApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { parseMenuDescriptionWithMeta } from '../../lib/menuItemMeta';
import type { MenuItem } from '../../types/eato';

type MenuItemForm = {
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string;
  available: boolean;
};

const PLACEHOLDER_FOOD = '/dish.png';

function money(n: number | string | undefined) {
  const v = typeof n === 'string' ? Number(n) : n ?? 0;
  if (Number.isFinite(v)) return `$${Number(v).toFixed(2)}`;
  return '$0.00';
}

function itemCardDescription(item: MenuItem) {
  return parseMenuDescriptionWithMeta(item.description || '').cleanDescription || '—';
}

function itemCardImage(item: MenuItem) {
  const parsed = parseMenuDescriptionWithMeta(item.description || '');
  return parsed.images[0] || item.imageUrl || PLACEHOLDER_FOOD;
}

export default function MenuManagement() {
  const { user } = useAuth();
  const myId = String((user as { _id?: string; id?: string } | null)?._id ?? (user as { id?: string } | null)?.id ?? '');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<MenuItemForm>({
    name: '',
    description: '',
    price: '',
    category: 'Main',
    imageUrl: '',
    available: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [toast, setToast] = useState('');

  const load = () =>
    menuApi
      .my()
      .then(setItems)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: '', category: 'Main', imageUrl: '', available: true });
  };

  const openEdit = (item: MenuItem) => {
    const parsed = parseMenuDescriptionWithMeta(item.description || '');
    setEditing(item._id);
    setForm({
      name: item.name,
      description: parsed.cleanDescription || '',
      price: item.price != null ? String(item.price) : '',
      category: item.category || 'Main',
      imageUrl: parsed.images[0] || item.imageUrl || '',
      available: typeof item.available === 'boolean' ? item.available : true,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editing) {
        await menuApi.update(editing, {
          name: form.name,
          description: form.description,
          price: form.price as any,
          category: form.category,
          imageUrl: form.imageUrl,
          available: form.available,
        });
      } else {
        await menuApi.add({
          name: form.name,
          description: form.description,
          price: Number(form.price),
          category: form.category,
          imageUrl: form.imageUrl,
          available: form.available,
        } as any);
      }
      setToast(editing ? 'Item updated successfully.' : 'Item added successfully.');
      setEditing(null);
      load();
    } catch (err: any) {
      setError(err.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setError('');
    setDeleting(true);
    try {
      await menuApi.delete(deleteTarget._id);
      if (editing === deleteTarget._id) setEditing(null);
      setDeleteTarget(null);
      setToast('Item deleted successfully.');
      load();
    } catch (err: any) {
      setError(err.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <p className="text-center py-8">Loading menu...</p>;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">Menu</h1>
          {(user as { restaurantName?: string } | null)?.restaurantName ? (
            <p className="mt-2 text-sm text-stone-600">
              Manage items for{' '}
              <span className="font-semibold text-fresh-green">{(user as { restaurantName: string }).restaurantName}</span>.
            </p>
          ) : (
            <p className="mt-2 text-sm text-stone-600">Add dishes here — they show on your public menu page for customers.</p>
          )}
          {myId ? (
            <Link
              to={`/restaurants/${myId}/menu`}
              className="mt-3 inline-flex text-sm font-semibold text-fresh-green hover:text-brand-greenHover hover:underline"
            >
              Preview your public menu →
            </Link>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            to="/restaurant/items/add"
            className="inline-flex items-center justify-center rounded-xl bg-fresh-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-greenHover"
          >
            + Add item
          </Link>
        </div>
      </div>

      {error ? <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p> : null}

      {!items.length ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-fresh-green/10 text-fresh-green">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <path d="M4 6h16M4 12h10M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-stone-900">No menu items yet</h2>
            <p className="mt-2 text-sm text-stone-600">Add your first dish to start receiving orders.</p>
            <Link
              to="/restaurant/items/add"
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-fresh-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-greenHover"
            >
              + Add your first item
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <div key={item._id} className="mx-auto w-full max-w-[260px] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md">
              <div className="relative aspect-[4/3] w-full bg-stone-50 p-2">
                <img src={itemCardImage(item)} alt="" className="absolute inset-0 h-full w-full object-contain p-2" loading="lazy" />
                <div className="absolute left-3 top-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                      item.available ? 'border-fresh-green/30 bg-fresh-green/10 text-fresh-green' : 'border-amber-300/40 bg-amber-100/60 text-amber-800'
                    }`}
                  >
                    {item.available ? 'Available' : 'Hidden'}
                  </span>
                </div>
              </div>

              <div className="p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-bold text-stone-900" title={item.name}>
                      {item.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-stone-600">{itemCardDescription(item)}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-[11px] font-semibold text-stone-500">
                      <span className="inline-flex items-center gap-1">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                          <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {item.category || 'Main'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                          <path d="M11.48 3.5l2.1 4.26 4.7.68-3.4 3.3.8 4.68-4.2-2.21-4.2 2.21.8-4.68-3.4-3.3 4.7-.68 2.1-4.26z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        4.8
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-base font-extrabold text-stone-900">{money(item.price as any)}</p>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-stone-200 bg-white px-2.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-2.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing ? (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-stone-900">Edit item</h2>
              <button type="button" onClick={openAdd} className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50">
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-stone-300 px-4 py-2 text-sm"
                required
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg border border-stone-300 px-4 py-2 text-sm"
                rows={3}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full rounded-lg border border-stone-300 px-4 py-2 text-sm"
                  required
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-lg border border-stone-300 px-4 py-2 text-sm"
                />
              </div>
              <input
                type="url"
                placeholder="Image URL (for menu card)"
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                className="w-full rounded-lg border border-stone-300 px-4 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                <input type="checkbox" checked={form.available} onChange={(e) => setForm((f) => ({ ...f, available: e.target.checked }))} />
                Mark item as available
              </label>
              <div className="flex justify-end gap-2 border-t border-stone-200 pt-3">
                <button type="button" onClick={openAdd} className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="rounded-lg bg-fresh-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-greenHover disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[230] flex items-center justify-center bg-black/45 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-stone-900">Delete item?</h3>
            <p className="mt-2 text-sm text-stone-600">
              Are you sure you want to delete <span className="font-semibold text-stone-900">{deleteTarget.name}</span>? This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-[260] w-[min(calc(100vw-2rem),24rem)] -translate-x-1/2">
          <div className="rounded-xl bg-fresh-green px-4 py-3 text-sm font-semibold text-white shadow-lg">{toast}</div>
        </div>
      ) : null}
    </div>
  );
}

