import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { restaurants as restaurantsApi, menu as menuApi } from '../../api';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { parseMenuDescriptionWithMeta } from '../../lib/menuItemMeta';
import type { MenuItem, Restaurant } from '../../types/eato';

const PLACEHOLDER_FOOD = '/dish.png';
const ZOOM = 2.5;

function itemCardDescription(item: MenuItem) {
  return parseMenuDescriptionWithMeta(item.description || '').cleanDescription || 'No description';
}

function buildGallery(item: MenuItem): string[] {
  const parsed = parseMenuDescriptionWithMeta(item.description || '');
  const imgs = [...parsed.images];
  if (item.imageUrl) imgs.unshift(item.imageUrl);
  const unique = [...new Set(imgs.filter(Boolean))];
  const base = unique.length > 0 ? unique : [PLACEHOLDER_FOOD];
  const out = [...base];
  while (out.length < 4) out.push(out[0]!);
  return out.slice(0, 4);
}

export default function MenuItemDetail() {
  const { id: restaurantId, itemId } = useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showToast } = useToast();
  const { addFromMenuItem, setQuantity } = useCart();

  const [quantity, setQty] = useState(1);

  useEffect(() => {
    if (!restaurantId) return;
    Promise.all([restaurantsApi.get(restaurantId), menuApi.byRestaurant(restaurantId)])
      .then(([r, m]) => {
        setRestaurant(r);
        setItems(m);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const item = useMemo(() => {
    if (!itemId) return null;
    return items.find((i) => String(i._id) === itemId) ?? null;
  }, [items, itemId]);

  const gallery = useMemo(() => (item ? buildGallery(item) : []), [item]);
  const [activeIdx, setActiveIdx] = useState(0);
  const activeImg = gallery[activeIdx] ?? gallery[0] ?? PLACEHOLDER_FOOD;

  useEffect(() => {
    setActiveIdx(0);
    setQty(1);
  }, [restaurantId, itemId, item?._id]);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [isMagnifying, setIsMagnifying] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [bg, setBg] = useState({ px: 50, py: 50 });

  const onMagnifyMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(e.clientY - rect.top, 0), rect.height);
    setBg({ px: (x / rect.width) * 100, py: (y / rect.height) * 100 });
    const lensSize = 120;
    const left = Math.min(Math.max(x - lensSize / 2, 0), rect.width - lensSize);
    const top = Math.min(Math.max(y - lensSize / 2, 0), rect.height - lensSize);
    setLensPos({ x: left, y: top });
  };

  const addToCart = () => {
    if (!restaurantId || !restaurant || !item) return;
    addFromMenuItem(restaurantId, restaurant.restaurantName, item);
    setQuantity(String(item._id), quantity);
    showToast('Added to cart');
  };

  if (loading) return <p className="py-8 text-center">Loading...</p>;
  if (error) return <p className="py-4 text-center text-red-600">{error}</p>;
  if (!restaurantId || !restaurant) return <p className="py-4 text-center">Restaurant not found.</p>;
  if (!item || !item.available) {
    return <Navigate to={`/restaurants/${restaurantId}/menu`} replace />;
  }

  const menuPath = `/restaurants/${restaurantId}/menu`;

  return (
    <div className="bg-surface-canvas font-sans text-stone-800">
      <section className="py-6 md:py-8 lg:py-10">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm text-stone-500">
                <Link to="/" className="hover:text-fresh-green">
                  Home
                </Link>
                <span className="mx-2 text-stone-400">/</span>
                <Link to="/restaurants" className="hover:text-fresh-green">
                  Restaurants
                </Link>
                <span className="mx-2 text-stone-400">/</span>
                <Link to={menuPath} className="hover:text-fresh-green">
                  {restaurant.restaurantName}
                </Link>
                <span className="mx-2 text-stone-400">/</span>
                <span className="text-fresh-green">{item.name}</span>
              </p>
              <h1 className="mt-2 text-2xl font-bold text-fresh-green md:text-3xl">{item.name}</h1>
              <p className="mt-1 text-sm font-medium uppercase tracking-wide text-fresh-lime">{item.category || 'Menu'}</p>
            </div>
            <Link
              to={menuPath}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-fresh-green shadow-sm hover:bg-fresh-muted"
            >
              ← Back to menu
            </Link>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="relative overflow-hidden rounded-xl bg-white shadow-sm">
              <div className="group/card-media relative aspect-square max-h-[min(100vw,320px)] w-full bg-white lg:max-h-[360px]">
                <div
                  ref={wrapRef}
                  className="absolute inset-0 cursor-crosshair overflow-hidden rounded-xl bg-white"
                  onMouseEnter={() => setIsMagnifying(true)}
                  onMouseLeave={() => setIsMagnifying(false)}
                  onMouseMove={onMagnifyMove}
                >
                  <img
                    src={activeImg}
                    alt=""
                    className="relative z-0 h-full w-full border-0 object-contain object-center p-4 sm:p-6"
                  />
                  <div
                    className="pointer-events-none absolute inset-0 z-[1] bg-[#1e4d2b]/40 opacity-0 transition-opacity duration-500 ease-in-out group-hover/card-media:opacity-100"
                    aria-hidden
                  />

                  {isMagnifying ? (
                    <div
                      className="pointer-events-none absolute z-[30] rounded-full border-2 border-fresh-green"
                      style={{
                        width: 120,
                        height: 120,
                        left: lensPos.x,
                        top: lensPos.y,
                        backgroundImage: `url("${activeImg}")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: `${bg.px}% ${bg.py}%`,
                        backgroundSize: `${ZOOM * 100}% ${ZOOM * 100}%`,
                      }}
                    />
                  ) : null}
                </div>
              </div>

              <div className="mt-4 px-4 pb-4">
                <div className="flex items-center gap-3 overflow-auto">
                  {gallery.map((src, idx) => (
                    <button
                      key={`${src}-${idx}`}
                      type="button"
                      onClick={() => setActiveIdx(idx)}
                      className={`relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-stone-50 ${
                        idx === activeIdx ? 'border-fresh-green' : 'border-stone-200'
                      }`}
                      aria-label={`Thumbnail ${idx + 1}`}
                    >
                      <img src={src} alt="" className="max-h-full max-w-full object-contain object-center p-1.5" />
                      {idx === activeIdx ? <span className="absolute right-1 top-1 h-3 w-3 rounded-full bg-fresh-green" aria-hidden /> : null}
                    </button>
                  ))}
                </div>
              </div>

              <div className="hidden border-t border-stone-100 p-4 lg:block">
                <div className="text-xs font-semibold uppercase tracking-wider text-fresh-green">Zoom</div>
                <div className="mt-2 flex justify-end">
                  <div
                    className="h-56 w-56 overflow-hidden rounded-xl border border-fresh-green/40 bg-white"
                    style={{
                      backgroundImage: `url("${activeImg}")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: `${bg.px}% ${bg.py}%`,
                      backgroundSize: `${ZOOM * 100}% ${ZOOM * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col">
              <h2 className="text-2xl font-bold text-fresh-green sm:text-2xl">{item.name}</h2>
              <div className="mt-2 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <svg key={idx} className="h-4 w-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
                <span className="ml-1 text-sm font-semibold text-stone-700">4.8/5</span>
              </div>

              <div className="mt-3">
                <span className="text-2xl font-extrabold text-stone-900">${Number(item.price).toFixed(2)}</span>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-stone-600">{itemCardDescription(item)}</p>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <div className="flex items-center overflow-hidden rounded-md border border-stone-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="flex h-12 w-12 items-center justify-center bg-white text-xl font-bold text-stone-700 hover:bg-stone-50"
                    aria-label="Decrease quantity"
                  >
                    –
                  </button>
                  <div className="flex h-12 w-12 items-center justify-center bg-stone-50 text-sm font-bold text-stone-700">{quantity}</div>
                  <button
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    className="flex h-12 w-12 items-center justify-center bg-white text-xl font-bold text-stone-700 hover:bg-stone-50"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={addToCart}
                  className="rounded-md bg-[#1a4225] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-110"
                >
                  Add to cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
