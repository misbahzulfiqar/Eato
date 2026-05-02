import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { restaurants as restaurantsApi } from '../../api';
import type { Restaurant } from '../../types/eato';

const PLACEHOLDER_FOOD = '/burger1.webp';

function restaurantId(r: Restaurant): string {
  return String(r._id ?? (r as { id?: string }).id ?? '');
}

function cuisineTags(cuisine: string | undefined): string[] {
  if (!cuisine?.trim()) return [];
  return cuisine
    .split(/[,|]/g)
    .map((t) => t.trim())
    .filter(Boolean);
}

function buildCuisineCounts(restaurants: Restaurant[]): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const r of restaurants) {
    const tags = cuisineTags(r.cuisine);
    const seen = new Set<string>();
    if (tags.length === 0) {
      map.set('Other', (map.get('Other') || 0) + 1);
    } else {
      for (const t of tags) {
        const key = t;
        if (seen.has(key.toLowerCase())) continue;
        seen.add(key.toLowerCase());
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function pseudoFromId(id: string): number {
  return id.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
}

function restaurantCreatedMs(r: Restaurant): number {
  const anyR = r as any;
  const direct = anyR.createdAt ?? anyR.created_at ?? anyR.created ?? anyR.timestamp;
  if (direct) {
    const ms = new Date(direct).getTime();
    if (Number.isFinite(ms)) return ms;
  }

  // If `_id` is a Mongo ObjectId, first 8 hex chars encode creation time.
  const id = String((r as Restaurant | { id?: string })._id ?? (r as { id?: string }).id ?? '');
  if (/^[0-9a-fA-F]{24}$/.test(id)) {
    const seconds = parseInt(id.slice(0, 8), 16);
    return seconds * 1000;
  }

  return 0;
}

function formatOpensAt(id: string): string {
  const n = pseudoFromId(id);
  let h = 16 + (n % 5);
  const m = (n % 4) * 15;
  const pm = true;
  const dh = h > 12 ? h - 12 : h;
  return `Opens at ${dh}:${m === 0 ? '00' : m} ${pm ? 'PM' : 'AM'}`;
}

function formatMinOrder(id: string): string {
  const n = pseudoFromId(id);
  return `$${(8 + (n % 12)).toFixed(2)}`;
}

function Stars({ value }: { value: number | null | undefined }) {
  const rounded = value != null && !Number.isNaN(value) ? Math.round(value) : 0;
  return (
    <div className="flex items-center gap-0.5" aria-label={value != null ? `Rated ${value} out of 5` : 'No rating yet'}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i <= rounded ? 'text-promo-yellow' : 'text-stone-200'}`}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" />
        </svg>
      ))}
      {value != null ? <span className="ml-1 text-xs font-medium text-stone-600">{value.toFixed(1)}</span> : <span className="ml-1 text-xs text-stone-400">New</span>}
    </div>
  );
}

const OFFER_OPTIONS = [
  { id: 'all', label: 'All offers' },
  { id: 'under20', label: 'Set menu $20 and under' },
  { id: 'under30', label: 'Set menu $30 and under' },
] as const;

export default function BrowseRestaurants() {
  const [raw, setRaw] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [locationText, setLocationText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState<Set<string>>(new Set());
  const [cuisinesExpanded, setCuisinesExpanded] = useState(false);
  const [offerId, setOfferId] = useState<(typeof OFFER_OPTIONS)[number]['id']>('all');
  const [authenticOnly, setAuthenticOnly] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    restaurantsApi
      .list({})
      .then((list) => {
        // "Latest" first. Prefer explicit createdAt, otherwise fall back to ObjectId timestamp.
        const sorted = [...list].sort((a, b) => {
          const msA = restaurantCreatedMs(a);
          const msB = restaurantCreatedMs(b);
          if (msA !== msB) return msB - msA;
          return String(a.restaurantName || '').localeCompare(String(b.restaurantName || ''));
        });
        setRaw(sorted);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const cuisineOptions = useMemo(() => buildCuisineCounts(raw), [raw]);
  const visibleCuisines = cuisinesExpanded ? cuisineOptions : cuisineOptions.slice(0, 10);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const loc = locationText.trim().toLowerCase();

    return raw.filter((r) => {
      if (loc) {
        const addr = (r.address || '').toLowerCase();
        const city = (r.city || '').toLowerCase();
        if (!addr.includes(loc) && !city.includes(loc)) return false;
      }

      if (q) {
        const hay = [
          r.restaurantName,
          r.description,
          r.cuisine,
          ...(cuisineTags(r.cuisine)),
          r.address,
          r.city,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (selectedCuisines.size > 0) {
        const tags = cuisineTags(r.cuisine);
        const tagLo = tags.map((t) => t.toLowerCase());
        const has = [...selectedCuisines].some((s) => {
          const lo = s.toLowerCase();
          if (lo === 'other') return tags.length === 0;
          return tagLo.includes(lo);
        });
        if (!has) return false;
      }

      if (authenticOnly) {
        const av = r.avgRating;
        if (av == null || av < 4) return false;
      }

      if (offerId !== 'all') {
        const min = parseFloat(formatMinOrder(restaurantId(r)).replace('$', ''));
        const lim = offerId === 'under20' ? 20 : 30;
        if (min > lim) return false;
      }

      return true;
    });
  }, [raw, searchText, locationText, selectedCuisines, authenticOnly, offerId]);

  const toggleCuisine = (name: string) => {
    setSelectedCuisines((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-surface-muted">
      {/* Top bar — location + search */}
      <div className="border-b border-stone-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-3 px-3 py-4 sm:px-6 lg:flex-row lg:items-center lg:gap-6">
          <div className="flex min-w-0 items-start gap-2 lg:max-w-xs lg:shrink-0">
            <span className="mt-0.5 text-fresh-green" aria-hidden>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0z016 0z" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Change location</p>
              <input
                type="text"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="City, area, or address"
                className="mt-0.5 w-full border-0 bg-transparent text-sm font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="min-w-0 flex-1">
            <div className="relative">
              <input
                type="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search for a dish or restaurants"
                className="w-full rounded-full border border-stone-200 bg-stone-50 py-3 pl-5 pr-12 text-sm text-stone-800 placeholder:text-stone-400 focus:border-fresh-green focus:bg-white focus:outline-none focus:ring-1 focus:ring-fresh-green"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-[1320px] px-3 py-6 sm:px-6">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen((o) => !o)}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white py-3 text-sm font-semibold text-stone-800 lg:hidden"
        >
          {mobileFiltersOpen ? 'Hide filters' : 'Show filters'}
        </button>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8">
          {/* Sidebar filters */}
          <aside
            className={[
              'w-full shrink-0 lg:w-64 xl:w-72',
              mobileFiltersOpen ? 'block' : 'hidden lg:block',
            ].join(' ')}
          >
            <div className="sticky top-4 space-y-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <div>
                <h2 className="text-sm font-bold text-stone-900">All cuisines A–Z</h2>
                <ul className="mt-3 max-h-[280px] space-y-2 overflow-y-auto pr-1">
                  {visibleCuisines.map(({ name, count }) => {
                    const checked = selectedCuisines.has(name);
                    return (
                      <li key={name}>
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCuisine(name)}
                            className="rounded border-stone-300 text-eato-orange focus:ring-eato-orange"
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {name}{' '}
                            <span className="text-stone-400">({count})</span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                {cuisineOptions.length > 10 ? (
                  <button
                    type="button"
                    onClick={() => setCuisinesExpanded((e) => !e)}
                    className="mt-2 text-sm font-semibold text-eato-orange hover:underline"
                  >
                    {cuisinesExpanded ? 'Less' : '+ More'}
                  </button>
                ) : null}
              </div>

              <div className="border-t border-stone-100 pt-4">
                <h2 className="text-sm font-bold text-stone-900">Offers</h2>
                <ul className="mt-3 space-y-2">
                  {OFFER_OPTIONS.map((o) => (
                    <li key={o.id}>
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
                        <input
                          type="radio"
                          name="offer"
                          checked={offerId === o.id}
                          onChange={() => setOfferId(o.id)}
                          className="border-stone-300 text-eato-orange focus:ring-eato-orange"
                        />
                        {o.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-stone-100 pt-4">
                <h2 className="text-sm font-bold text-stone-900">Top rated</h2>
                <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={authenticOnly}
                    onChange={(e) => setAuthenticOnly(e.target.checked)}
                    className="rounded border-stone-300 text-eato-orange focus:ring-eato-orange"
                  />
                  Highly rated (4+ stars)
                </label>
              </div>

              {(selectedCuisines.size > 0 || authenticOnly || offerId !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCuisines(new Set());
                    setAuthenticOnly(false);
                    setOfferId('all');
                  }}
                  className="w-full rounded-lg border border-stone-200 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50"
                >
                  Clear filters
                </button>
              )}
            </div>
          </aside>

          {/* Main list */}
          <main className="min-w-0 flex-1">
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
            ) : null}

            <p className="mb-4 text-base font-medium text-stone-500">
              {loading ? 'Loading restaurants…' : <span className="text-stone-600">{filtered.length} open restaurants</span>}
            </p>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex animate-pulse gap-4 rounded-2xl border border-stone-100 bg-white p-4">
                    <div className="h-28 w-36 shrink-0 rounded-xl bg-stone-200" />
                    <div className="flex-1 space-y-2 pt-2">
                      <div className="h-5 w-1/3 rounded bg-stone-200" />
                      <div className="h-4 w-2/3 rounded bg-stone-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-200 bg-white py-14 text-center text-stone-600">
                No restaurants match your filters.
                <button
                  type="button"
                  onClick={() => {
                    setSearchText('');
                    setLocationText('');
                    setSelectedCuisines(new Set());
                    setAuthenticOnly(false);
                    setOfferId('all');
                  }}
                  className="mt-4 block w-full text-sm font-semibold text-eato-orange hover:underline"
                >
                  Reset search and filters
                </button>
              </div>
            ) : (
              <ul className="flex flex-col gap-4">
                {filtered.map((r) => {
                  const id = restaurantId(r);
                  if (!id) return null;
                  const isPending = r.status === 'pending';
                  const img = r.imageUrl || PLACEHOLDER_FOOD;
                  const promo = pseudoFromId(id) % 3 === 0;

                  return (
                    <li key={id}>
                      <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-stretch sm:gap-5 sm:p-5">
                        <Link to={`/restaurants/${id}/menu`} className="shrink-0 sm:self-center">
                          <div className="relative h-40 w-full overflow-hidden rounded-xl bg-white p-2 sm:h-32 sm:w-40">
                            <img src={img} alt="" className="h-full w-full object-contain" />
                            {isPending ? (
                              <span className="absolute left-2 top-2 rounded bg-amber-400/95 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-950">
                                Pending
                              </span>
                            ) : null}
                          </div>
                        </Link>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h2 className="text-lg font-bold text-stone-900 sm:text-xl">{r.restaurantName}</h2>
                              <p className="text-sm text-stone-500">{r.cuisine?.trim() || 'Various'}</p>
                              <div className="mt-2">
                                <Stars value={r.avgRating ?? null} />
                              </div>
                            </div>
                            <Link
                              to={`/restaurants/${id}/menu`}
                              className="mt-3 inline-flex shrink-0 items-center justify-center rounded-lg bg-eato-orange px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-sm hover:bg-orange-600 sm:mt-0"
                            >
                              View menu
                            </Link>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600 sm:text-sm">
                            <span className="inline-flex items-center gap-1">
                              <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatOpensAt(id)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                              Min. order {formatMinOrder(id)} · Delivery fee: $0.00 · COD
                            </span>
                          </div>

                          {promo ? (
                            <p className="mt-2 text-xs font-semibold text-fresh-green sm:text-sm">
                              Delivery: 10% off first order · Weekly specials
                            </p>
                          ) : null}

                          {r.description ? (
                            <p className="mt-2 line-clamp-2 text-sm text-stone-600">{r.description}</p>
                          ) : null}
                          {r.address ? <p className="mt-1 text-xs text-stone-500">📍 {r.address}</p> : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
