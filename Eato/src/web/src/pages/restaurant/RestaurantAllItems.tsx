/**
 * Full-screen menu items table (Eato brand accent, filter tabs, pagination).
 * Route: `/restaurant/items`
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { menu as menuApi } from '../../api';
import { buildMenuDescriptionWithMeta, parseMenuDescriptionWithMeta } from '../../lib/menuItemMeta';
import type { MenuItem } from '../../types/eato';
import RestaurantPartnerShell from './RestaurantPartnerShell';

type FilterTab = 'all' | 'available' | 'unavailable';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All Items' },
  { key: 'available', label: 'Available' },
  { key: 'unavailable', label: 'Inactive' },
];

function stripAddons(description: string): string {
  return parseMenuDescriptionWithMeta(description).cleanDescription;
}

function buildPageList(total: number, current: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | 'ellipsis')[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push('ellipsis');
    out.push(p);
    prev = p;
  }
  return out;
}

function statusBadge(item: MenuItem) {
  if (item.available) {
    return <span className="rounded-full bg-fresh-green/15 px-2.5 py-0.5 text-xs font-semibold text-fresh-green">Active</span>;
  }
  return <span className="rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-semibold text-stone-700">Inactive</span>;
}

export default function RestaurantAllItems() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<FilterTab>('all');
  const [dateRange, setDateRange] = useState('week');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewingItem, setViewingItem] = useState<MenuItem | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategory, setEditCategory] = useState('Main');
  const [editAvailable, setEditAvailable] = useState(true);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editImageUrlField, setEditImageUrlField] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    menuApi
      .my()
      .then(setItems)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = items;
    if (tab === 'available') list = list.filter((i) => i.available);
    if (tab === 'unavailable') list = list.filter((i) => !i.available);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.category || '').toLowerCase().includes(q) ||
          stripAddons(i.description || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [items, tab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageSafe = Math.min(page, totalPages);
  const slice = useMemo(() => {
    const start = (pageSafe - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, pageSafe, perPage]);

  useEffect(() => {
    setPage(1);
  }, [tab, search, perPage]);

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllPage = () => {
    const ids = slice.map((i) => i._id);
    const allSelected = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this item from the menu?')) return;
    try {
      await menuApi.delete(id);
      load();
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const formatUpdated = (item: MenuItem) => {
    const d = item.createdAt ? new Date(item.createdAt) : new Date();
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };

  const itemImages = (item: MenuItem) => {
    const parsed = parseMenuDescriptionWithMeta(item.description || '');
    if (parsed.images.length > 0) return parsed.images;
    if (item.imageUrl) return [item.imageUrl];
    return [];
  };

  const openEditModal = (item: MenuItem) => {
    const parsed = parseMenuDescriptionWithMeta(item.description || '');
    setEditingItem(item);
    setEditName(item.name);
    setEditDescription(parsed.cleanDescription);
    setEditPrice(String(item.price ?? ''));
    setEditCategory(item.category || 'Main');
    setEditAvailable(item.available !== false);
    setEditImages(parsed.images.length > 0 ? parsed.images : item.imageUrl ? [item.imageUrl] : []);
    setEditImageUrlField('');
  };

  const saveEditModal = async () => {
    if (!editingItem) return;
    const priceNum = Number(editPrice);
    if (!editName.trim() || Number.isNaN(priceNum) || priceNum < 0) {
      setError('Please provide a valid name and price.');
      return;
    }
    setEditSaving(true);
    setError('');
    try {
      const parsed = parseMenuDescriptionWithMeta(editingItem.description || '');
      await menuApi.update(editingItem._id, {
        name: editName.trim(),
        description: buildMenuDescriptionWithMeta(editDescription, parsed.addonsRaw, editImages),
        price: priceNum,
        category: editCategory,
        available: editAvailable,
        imageUrl: editImages[0] || '',
      });
      setEditingItem(null);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <RestaurantPartnerShell
      title="All Items"
      subtitle="Manage dishes after you add them from Add Item"
      headerRight={
        <button
          type="button"
          onClick={() => navigate('/restaurant/items/add')}
          className="rounded-xl bg-fresh-green px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-greenHover"
        >
          + Add Item
        </button>
      }
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-stone-100 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="relative min-w-[200px] flex-1 sm:max-w-md">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items…"
              className="w-full rounded-xl border border-stone-200 py-2.5 pl-10 pr-3 text-sm outline-none ring-fresh-green/25 focus:ring-2"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-fresh-lime px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-95"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2.5 text-sm font-semibold text-white hover:bg-slate-900"
            >
              Export ▾
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-fresh-green px-3 py-2.5 text-sm font-semibold text-white hover:bg-brand-greenHover"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View
            </button>
          </div>
        </div>

        <div className="border-b border-stone-100 px-4">
          <div className="flex gap-6 overflow-x-auto">
            {TABS.map(({ key, label }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={[
                    'relative shrink-0 py-3 text-sm font-semibold transition-colors',
                    active ? 'text-fresh-green' : 'text-stone-500 hover:text-stone-700',
                  ].join(' ')}
                >
                  {label}
                  {active ? <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-fresh-lime" /> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/80 text-xs font-semibold uppercase tracking-wide text-stone-500">
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={slice.length > 0 && slice.every((i) => selected.has(i._id))} onChange={toggleAllPage} className="rounded border-stone-300" />
                </th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-stone-500">
                    Loading items…
                  </td>
                </tr>
              ) : slice.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-stone-500">
                    No items yet. Use <strong>Add Item</strong> to create your first dish.
                  </td>
                </tr>
              ) : (
                slice.map((item) => {
                  const sel = selected.has(item._id);
                  return (
                    <tr key={item._id} className={sel ? 'bg-fresh-green/5' : 'hover:bg-surface-muted/80'}>
                      <td className="px-4 py-3 align-middle">
                        <input type="checkbox" checked={sel} onChange={() => toggleRow(item._id)} className="rounded border-stone-300" />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white p-1 ring-1 ring-stone-100">
                            <img src={itemImages(item)[0] || '/LOGO.png'} alt="" className="h-full w-full object-contain" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-stone-900">{item.name}</p>
                            <p className="truncate text-xs text-stone-500">{stripAddons(item.description || '') || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle text-stone-600">{formatUpdated(item)}</td>
                      <td className="px-4 py-3 align-middle text-stone-700">{item.category || '—'}</td>
                      <td className="px-4 py-3 align-middle font-semibold text-stone-900">${Number(item.price).toFixed(2)}</td>
                      <td className="px-4 py-3 align-middle">{statusBadge(item)}</td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-lg bg-fresh-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-greenHover"
                            onClick={() => setViewingItem(item)}
                          >
                            See
                          </button>
                          <button
                            type="button"
                            className="rounded-lg bg-fresh-lime/25 px-3 py-1.5 text-xs font-semibold text-fresh-green hover:bg-fresh-lime/40"
                            onClick={() => openEditModal(item)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="rounded-lg bg-accent-orange/15 px-3 py-1.5 text-xs font-semibold text-accent-orange hover:bg-accent-orange/25"
                            onClick={() => handleDelete(item._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="rounded-lg border border-stone-200 px-2 py-1"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>
              Showing{' '}
              {filtered.length === 0 ? 0 : (pageSafe - 1) * perPage + 1} – {Math.min(pageSafe * perPage, filtered.length)} of{' '}
              {filtered.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pageSafe <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium disabled:opacity-40"
            >
              ‹
            </button>
            {buildPageList(totalPages, pageSafe).map((entry, idx) =>
              entry === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-stone-400">
                  …
                </span>
              ) : (
                <button
                  key={entry}
                  type="button"
                  onClick={() => setPage(entry)}
                  className={
                    entry === pageSafe
                      ? 'h-9 min-w-[2.25rem] rounded-full bg-fresh-green text-sm font-semibold text-white'
                      : 'h-9 min-w-[2.25rem] rounded-full text-sm font-medium text-stone-600 hover:bg-stone-100'
                  }
                >
                  {entry}
                </button>
              ),
            )}
            <button
              type="button"
              disabled={pageSafe >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {viewingItem ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-stone-900">{viewingItem.name}</h3>
                <p className="text-sm text-stone-500">{viewingItem.category || 'Main'} · ${Number(viewingItem.price).toFixed(2)}</p>
              </div>
              <button type="button" onClick={() => setViewingItem(null)} className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-semibold">
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {itemImages(viewingItem).map((img, idx) => (
                <div key={`${img.slice(0, 16)}-${idx}`} className="aspect-square w-full overflow-hidden rounded-lg border border-stone-200 bg-white p-1">
                  <img src={img} alt="" className="h-full w-full object-contain" />
                </div>
              ))}
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm text-stone-700">{stripAddons(viewingItem.description || '') || 'No description'}</p>
            <div className="mt-3">{statusBadge(viewingItem)}</div>
          </div>
        </div>
      ) : null}

      {editingItem ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h3 className="text-xl font-bold text-stone-900">Edit item</h3>
              <button type="button" onClick={() => setEditingItem(null)} className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-semibold">
                Cancel
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Name</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Price ($)</label>
                <input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} type="number" min={0} step="0.01" className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Category</label>
                <input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm" />
              </div>
              <label className="mt-6 flex items-center gap-2 text-sm font-medium text-stone-700">
                <input type="checkbox" checked={editAvailable} onChange={(e) => setEditAvailable(e.target.checked)} className="rounded border-stone-300" />
                Available
              </label>
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Description</label>
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm" />
            </div>
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Images (max 24)</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {editImages.map((img, idx) => (
                  <div key={`${img.slice(0, 16)}-${idx}`} className="relative overflow-hidden rounded-lg border border-stone-200">
                    <img src={img} alt="" className="h-16 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setEditImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute right-1 top-1 rounded bg-black/65 px-1 text-[10px] font-semibold text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (editImages.length >= 24) {
                      setError('Maximum 24 images allowed per item.');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      const data = reader.result as string;
                      setEditImages((prev) => (prev.length >= 24 ? prev : [...prev, data]));
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="text-xs"
                />
                <input
                  value={editImageUrlField}
                  onChange={(e) => setEditImageUrlField(e.target.value)}
                  placeholder="Paste image URL"
                  className="min-w-[220px] flex-1 rounded-lg border border-stone-200 px-3 py-2 text-xs"
                />
                <button
                  type="button"
                  className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold hover:bg-stone-50"
                  onClick={() => {
                    const v = editImageUrlField.trim();
                    if (!v) return;
                    if (editImages.length >= 24) {
                      setError('Maximum 24 images allowed per item.');
                      return;
                    }
                    setEditImages((prev) => [...prev, v].slice(0, 24));
                    setEditImageUrlField('');
                  }}
                >
                  Add URL
                </button>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={saveEditModal}
                disabled={editSaving}
                className="rounded-xl bg-fresh-green px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-greenHover disabled:opacity-60"
              >
                {editSaving ? 'Saving…' : 'Save item'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </RestaurantPartnerShell>
  );
}
