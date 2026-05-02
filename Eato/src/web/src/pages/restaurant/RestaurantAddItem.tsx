/**
 * Full-screen add / edit menu item with General · Category · Addons and image panel.
 * Route: `/restaurant/items/add` (optional `?id=` for edit)
 */
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { menu as menuApi } from '../../api';
import { buildMenuDescriptionWithMeta, parseMenuDescriptionWithMeta } from '../../lib/menuItemMeta';
import RestaurantPartnerShell from './RestaurantPartnerShell';

type TabId = 'general' | 'category' | 'addons';

type AddonLine = { id: string; name: string; price: string };
type AddonCategoryForm = { id: string; categoryName: string; type: string; lines: AddonLine[] };

const TAB_ROWS: { id: TabId; label: string; icon: string }[] = [
  {
    id: 'general',
    label: 'General',
    icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
  },
  { id: 'category', label: 'Category', icon: 'M4 5h6v6H4V5zm10 0h6v6h-6V5zM4 15h6v6H4v-6zm10 0h6v6h-6v-6z' },
  { id: 'addons', label: 'Addons', icon: 'M8 3v3M16 3v3M5 10h14M5 10a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2' },
];

let seq = 0;
const uid = () => `x-${++seq}-${Date.now().toString(36)}`;

function TabIcon({ d }: { d: string }) {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function RestaurantAddItem() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const formId = useId();

  const [tab, setTab] = useState<TabId>('general');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Main');
  const [available, setAvailable] = useState(true);
  /** First image is preview + canonical `imageUrl`; full list is embedded in description meta. */
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlField, setImageUrlField] = useState('');

  const [addonSelect, setAddonSelect] = useState('');
  const [addonRequired, setAddonRequired] = useState(false);
  const [addonMin, setAddonMin] = useState('0');
  const [addonMax, setAddonMax] = useState('1');
  const [addonCategories, setAddonCategories] = useState<AddonCategoryForm[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const wordCount = useMemo(() => {
    const t = `${name} ${description}`.trim();
    return t ? t.split(/\s+/).length : 0;
  }, [name, description]);

  const draftLabel = useMemo(() => {
    const d = new Date();
    return `Draft saved ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }, [name, description, price, category, tab, addonCategories]);

  useEffect(() => {
    if (!editId) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    menuApi
      .my()
      .then((items) => {
        const item = items.find((i) => i._id === editId);
        if (cancelled) return;
        if (!item) {
          setNotFound(true);
          setLoaded(true);
          return;
        }
        const parsed = parseMenuDescriptionWithMeta(item.description || '');
        setName(item.name);
        setDescription(parsed.cleanDescription.trim());
        setPrice(item.price != null ? String(item.price) : '');
        setCategory(item.category || 'Main');
        setAvailable(item.available !== false);
        const list = parsed.images.length ? parsed.images : item.imageUrl ? [item.imageUrl] : [];
        setImages(list.slice(0, 24));
        setImageUrlField('');
        setAddonCategories(Array.isArray(parsed.addonsRaw) ? (parsed.addonsRaw as AddonCategoryForm[]) : []);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [editId]);

  const onPickImage = useCallback((file: File | null) => {
    if (!file) return;
    if (images.length >= 24) {
      setError('Maximum 24 images allowed per item.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      setImages((prev) => (prev.length >= 24 ? prev : [...prev, data]));
      setImageUrlField('');
    };
    reader.readAsDataURL(file);
  }, [images.length]);

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const addAddonCategory = () => {
    setAddonCategories((prev) => [
      ...prev,
      {
        id: uid(),
        categoryName: '',
        type: 'Multiple',
        lines: [{ id: uid(), name: '', price: '' }],
      },
    ]);
  };

  const removeAddonCategory = (id: string) => {
    setAddonCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCategory = (id: string, patch: Partial<AddonCategoryForm>) => {
    setAddonCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const addLine = (cid: string) => {
    setAddonCategories((prev) =>
      prev.map((c) => (c.id === cid ? { ...c, lines: [...c.lines, { id: uid(), name: '', price: '' }] } : c)),
    );
  };

  const removeLine = (cid: string, lid: string) => {
    setAddonCategories((prev) =>
      prev.map((c) =>
        c.id === cid ? { ...c, lines: c.lines.filter((l) => l.id !== lid) } : c,
      ),
    );
  };

  const updateLine = (cid: string, lid: string, field: 'name' | 'price', value: string) => {
    setAddonCategories((prev) =>
      prev.map((c) =>
        c.id === cid
          ? {
              ...c,
              lines: c.lines.map((l) => (l.id === lid ? { ...l, [field]: value } : l)),
            }
          : c,
      ),
    );
  };

  const handleSave = async () => {
    setError('');
    const priceNum = Number(price);
    if (!name.trim()) {
      setError('Name is required.');
      setTab('general');
      return;
    }
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError('Enter a valid price.');
      setTab('general');
      return;
    }
    const fullDescription = buildMenuDescriptionWithMeta(description, addonCategories, images);
    const imageUrl = images[0]?.trim() || undefined;
    setSaving(true);
    try {
      if (editId) {
        await menuApi.update(editId, {
          name: name.trim(),
          description: fullDescription,
          price: priceNum,
          category,
          imageUrl,
          available,
        });
      } else {
        await menuApi.add({
          name: name.trim(),
          description: fullDescription,
          price: priceNum,
          category,
          imageUrl,
          available,
        });
      }
      navigate('/restaurant/items');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <RestaurantPartnerShell title="Food item" subtitle="Loading…">
        <div className="text-sm text-stone-500">Loading item…</div>
      </RestaurantPartnerShell>
    );
  }

  if (notFound) {
    return (
      <RestaurantPartnerShell title="Item not found" subtitle="This menu item may have been removed">
        <p className="text-sm text-stone-600">
          <button type="button" className="font-semibold text-fresh-green hover:underline" onClick={() => navigate('/restaurant/items')}>
            Back to All Items
          </button>
        </p>
      </RestaurantPartnerShell>
    );
  }

  return (
    <RestaurantPartnerShell
      title={editId ? 'Edit food item' : 'Food item data'}
      subtitle="Configure details, category, add-ons, and image"
      headerRight={
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-fresh-green px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-greenHover disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save item'}
        </button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 pb-3 text-xs text-stone-500">
        <span>Word count: {wordCount}</span>
        <span className="text-fresh-lime">{draftLabel}</span>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="min-w-0 flex-1 rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-stone-900">Food Item Data</h2>
          </div>
          <div className="flex flex-col md:flex-row">
            <div className="flex w-full shrink-0 flex-col border-stone-100 md:w-52 md:border-r">
              {TAB_ROWS.map((row) => {
                const active = tab === row.id;
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setTab(row.id)}
                    className={[
                      'flex items-center gap-3 px-4 py-3.5 text-left text-sm font-medium transition-colors',
                      active
                        ? 'border-l-4 border-fresh-green bg-fresh-green/5 text-fresh-green'
                        : 'border-l-4 border-transparent text-stone-600 hover:bg-surface-muted',
                    ].join(' ')}
                  >
                    <TabIcon d={row.icon} />
                    {row.label}
                  </button>
                );
              })}
            </div>

            <div className="min-h-[420px] flex-1 p-5">
              {tab === 'general' && (
                <div className="space-y-4" id={`${formId}-general`}>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Item name</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none ring-fresh-green/30 focus:ring-2"
                      placeholder="e.g. Margherita pizza"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none ring-fresh-green/30 focus:ring-2"
                      placeholder="Short description for guests"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Price ($)</label>
                      <input
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        type="number"
                        min={0}
                        step="0.01"
                        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none ring-fresh-green/30 focus:ring-2"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">SKU / Code</label>
                      <input
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none ring-fresh-green/30 focus:ring-2"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
                    <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="rounded border-stone-300 text-fresh-green focus:ring-fresh-green" />
                    Available on menu
                  </label>
                </div>
              )}

              {tab === 'category' && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Menu category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none ring-fresh-green/30 focus:ring-2"
                    >
                      {['Main', 'Appetizer', 'Dessert', 'Beverage', 'Special', 'Combo'].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-sm text-stone-500">Category groups this item in your menu and reports.</p>
                </div>
              )}

              {tab === 'addons' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-stone-900">Addons</h3>
                    <button
                      type="button"
                      onClick={addAddonCategory}
                      className="rounded-lg bg-fresh-lime px-3 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-95"
                    >
                      + Create New Add-on
                    </button>
                  </div>

                  <div className="relative rounded-xl border border-stone-200 bg-stone-50/50 p-4">
                    <span className="absolute right-3 top-3 text-stone-400" aria-hidden>
                      −
                    </span>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Select Addon</p>
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="min-w-[160px] flex-1">
                        <select
                          value={addonSelect}
                          onChange={(e) => setAddonSelect(e.target.value)}
                          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
                        >
                          <option value="">Select Addon</option>
                          <option value="extras">Extra toppings</option>
                          <option value="sides">Sides</option>
                          <option value="drinks">Drink pairing</option>
                        </select>
                      </div>
                      <button type="button" className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">
                        Add
                      </button>
                      <label className="flex items-center gap-2 text-sm text-stone-700">
                        <input type="checkbox" checked={addonRequired} onChange={(e) => setAddonRequired(e.target.checked)} className="rounded border-stone-300" />
                        Is Required?
                      </label>
                      <div>
                        <label className="mb-0.5 block text-[10px] font-medium text-stone-500">Min Selections?</label>
                        <input value={addonMin} onChange={(e) => setAddonMin(e.target.value)} className="w-16 rounded border border-stone-200 px-2 py-1 text-sm" />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[10px] font-medium text-stone-500">Max Selections?</label>
                        <input value={addonMax} onChange={(e) => setAddonMax(e.target.value)} className="w-16 rounded border border-stone-200 px-2 py-1 text-sm" />
                      </div>
                    </div>
                  </div>

                  {addonCategories.map((cat) => (
                    <div key={cat.id} className="relative rounded-xl border border-dashed border-stone-300 bg-white p-4 shadow-sm">
                      <button
                        type="button"
                        onClick={() => removeAddonCategory(cat.id)}
                        className="absolute right-3 top-3 text-sm font-semibold text-accent-orange hover:brightness-90"
                      >
                        Remove
                      </button>
                      <p className="mb-3 text-sm font-semibold text-stone-800">Create New Addon Category</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-stone-500">Addon Category</label>
                          <input
                            value={cat.categoryName}
                            onChange={(e) => updateCategory(cat.id, { categoryName: e.target.value })}
                            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                            placeholder="Addon Category Name"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-stone-500">Type</label>
                          <select
                            value={cat.type}
                            onChange={(e) => updateCategory(cat.id, { type: e.target.value })}
                            className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
                          >
                            <option value="Multiple">Multiple</option>
                            <option value="Single">Single</option>
                          </select>
                        </div>
                      </div>
                      <p className="mb-2 mt-4 text-xs font-semibold text-stone-600">Addon Items & Price ($)</p>
                      <div className="space-y-2">
                        {cat.lines.map((line) => (
                          <div key={line.id} className="flex flex-wrap items-center gap-2">
                            <input
                              value={line.name}
                              onChange={(e) => updateLine(cat.id, line.id, 'name', e.target.value)}
                              className="min-w-[120px] flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm"
                              placeholder="Option name"
                            />
                            <input
                              value={line.price}
                              onChange={(e) => updateLine(cat.id, line.id, 'price', e.target.value)}
                              type="number"
                              min={0}
                              step="0.01"
                              className="w-24 rounded-lg border border-stone-200 px-3 py-2 text-sm"
                              placeholder="0"
                            />
                            <button
                              type="button"
                              onClick={() => removeLine(cat.id, line.id)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-surface-muted hover:text-accent-orange"
                              aria-label="Remove line"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => addLine(cat.id)}
                        className="mt-3 rounded-lg bg-fresh-lime px-3 py-1.5 text-xs font-semibold text-white hover:brightness-95"
                      >
                        + Add New
                      </button>
                    </div>
                  ))}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={addAddonCategory}
                      className="rounded-lg bg-fresh-green px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-greenHover"
                    >
                      + Add New
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full shrink-0 xl:w-80">
          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-stone-900">Food Item Image</h3>
              <span className="text-stone-400">⌄⌃</span>
            </div>
            <div className="p-4">
              <button
                type="button"
                className="relative block w-full overflow-hidden rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 text-left"
                onClick={() => document.getElementById(`${formId}-file`)?.click()}
              >
                {images[0] ? (
                  <div className="aspect-square w-full bg-white p-2">
                    <img src={images[0]} alt="" className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <div className="flex aspect-square flex-col items-center justify-center gap-2 p-6 text-center text-sm text-stone-500">
                    <span>Click to upload</span>
                    <span className="text-xs">PNG, JPG up to a few MB</span>
                  </div>
                )}
              </button>
              <input
                id={`${formId}-file`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
              />
              <p className="mt-3 text-xs text-stone-500">Upload up to 24 images. First image is used as cover.</p>
              {images.length > 0 ? (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {images.map((img, idx) => (
                    <div key={`${img.slice(0, 16)}-${idx}`} className="relative overflow-hidden rounded-lg border border-stone-200 bg-white p-1">
                      <img src={img} alt="" className="h-14 w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute right-1 top-1 rounded bg-black/65 px-1 text-[10px] font-semibold text-white"
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="mt-4">
                <label className="mb-1 block text-[11px] font-medium text-stone-500">Or add by image URL</label>
                <div className="flex gap-2">
                  <input
                    value={imageUrlField}
                    onChange={(e) => setImageUrlField(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs"
                    placeholder="https://…"
                  />
                  <button
                    type="button"
                    className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold hover:bg-stone-50"
                    onClick={() => {
                      const v = imageUrlField.trim();
                      if (!v) return;
                      if (images.length >= 24) {
                        setError('Maximum 24 images allowed per item.');
                        return;
                      }
                      setImages((prev) => [...prev, v].slice(0, 24));
                      setImageUrlField('');
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RestaurantPartnerShell>
  );
}
