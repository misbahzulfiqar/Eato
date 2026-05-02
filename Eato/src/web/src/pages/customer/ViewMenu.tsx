import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { restaurants as restaurantsApi, menu as menuApi } from '../../api';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { parseMenuDescriptionWithMeta } from '../../lib/menuItemMeta';
import type { MenuItem, Restaurant } from '../../types/eato';

const PLACEHOLDER_FOOD = '/dish.png';

function itemCardDescription(item: MenuItem) {
  return parseMenuDescriptionWithMeta(item.description || '').cleanDescription || 'No description';
}

function itemCardImage(item: MenuItem) {
  const parsed = parseMenuDescriptionWithMeta(item.description || '');
  return parsed.images[0] || item.imageUrl || PLACEHOLDER_FOOD;
}

/** Mini hearts that burst outward when favouriting */
type BurstParticle = { id: number; dx: number; dy: number; size: number; color: string; rotate: number };

const HEART_PATH =
  'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z';

const BURST_COLORS = ['#f97316', '#22c55e', '#eab308', '#3b82f6', '#ec4899', '#ef4444', '#a855f7', '#14b8a6'];

function MenuItemFavouriteButton({
  favourited,
  onAdd,
  onRemove,
}: {
  favourited: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const [burst, setBurst] = useState<BurstParticle[]>([]);
  const [burstActive, setBurstActive] = useState(false);
  const idRef = useRef(0);

  useEffect(() => {
    if (!burst.length) return undefined;
    const raf = window.requestAnimationFrame(() => setBurstActive(true));
    const t = window.setTimeout(() => {
      setBurstActive(false);
      setBurst([]);
    }, 500);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [burst]);

  const handleClick = () => {
    if (favourited) {
      onRemove();
      return;
    }
    const count = 16;
    const particles: BurstParticle[] = [];
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.35;
      const speed = 20 + Math.random() * 38;
      idRef.current += 1;
      particles.push({
        id: idRef.current,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        size: 7 + Math.random() * 9,
        color: BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)]!,
        rotate: (Math.random() - 0.5) * 70,
      });
    }
    setBurst(particles);
    setBurstActive(false);
    onAdd();
  };

  return (
    <div className="relative flex shrink-0 items-center justify-center">
      <button
        type="button"
        onClick={handleClick}
        className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white shadow-sm transition-colors hover:border-stone-300 hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-fresh-green focus-visible:ring-offset-1 ${
          favourited ? 'text-red-500' : 'text-stone-400'
        }`}
        aria-label={favourited ? 'Remove from favourites' : 'Add to favourites'}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill={favourited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {burst.map((p) => (
        <span
          key={p.id}
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 flex items-center justify-center"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            transform: burstActive
              ? `translate(calc(-50% + ${p.dx}px), calc(-50% + ${p.dy}px)) rotate(${p.rotate}deg)`
              : `translate(-50%, -50%) rotate(${p.rotate}deg)`,
            opacity: burstActive ? 0 : 1,
            transition: burstActive ? 'transform 440ms cubic-bezier(0.22, 1, 0.36, 1), opacity 440ms ease-out' : 'none',
          }}
        >
          <svg className="h-full w-full drop-shadow-sm" viewBox="0 0 24 24" fill={p.color} aria-hidden>
            <path d={HEART_PATH} />
          </svg>
        </span>
      ))}
    </div>
  );
}

export default function ViewMenu() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showToast } = useToast();
  const { addFromMenuItem } = useCart();
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!id) return;
    Promise.all([restaurantsApi.get(id), menuApi.byRestaurant(id)])
      .then(([r, m]) => {
        setRestaurant(r);
        setItems(m);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const addToCart = (menuItem: MenuItem) => {
    if (!id || !restaurant) return;
    addFromMenuItem(id, restaurant.restaurantName, menuItem);
    showToast('Added to cart');
  };

  const itemKey = (item: MenuItem) => String(item._id ?? '');

  const addFavourite = (item: MenuItem) => {
    const key = itemKey(item);
    if (!key) return;
    setFavouriteIds((prev) => new Set(prev).add(key));
    showToast('This item is added to favourites successfully.');
  };

  const removeFavourite = (item: MenuItem) => {
    const key = itemKey(item);
    setFavouriteIds((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  if (loading) return <p className="text-center py-8">Loading menu...</p>;
  if (error) return <p className="text-red-600 text-center py-4">{error}</p>;
  if (!restaurant || !id) return <p className="text-center py-4">Restaurant not found.</p>;

  const availableItems = items.filter((i) => i.available);

  return (
    <div className="max-w-[1320px] mx-auto px-2 sm:px-6 lg:px-8 py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{restaurant.restaurantName}</h1>
          <p className="mt-1 text-sm text-stone-600">{restaurant.description || restaurant.cuisine}</p>
          {restaurant.address ? <p className="mt-2 text-xs text-stone-500">📍 {restaurant.address}</p> : null}
        </div>
      </div>

      {availableItems.length === 0 ? (
        <p className="text-stone-500">No menu items available.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {availableItems.map((item) => (
            <div
              key={item._id}
              role="button"
              aria-label={`View ${item.name}`}
              onClick={() => id && navigate(`/restaurants/${id}/menu/${itemKey(item)}`)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && id) {
                  e.preventDefault();
                  navigate(`/restaurants/${id}/menu/${itemKey(item)}`);
                }
              }}
              tabIndex={0}
              className="mx-auto w-full max-w-[260px] cursor-pointer overflow-visible rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-fresh-green focus-visible:ring-offset-2"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-stone-50 p-2">
                <img
                  src={itemCardImage(item)}
                  alt=""
                  className="absolute inset-0 h-full w-full object-contain p-2 transition-transform duration-500 ease-out hover:scale-[1.12]"
                  loading="lazy"
                />
              </div>

              <div className="p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-bold text-stone-900">{item.name}</h3>
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
                    <div className="text-base font-extrabold text-stone-900">${Number(item.price).toFixed(2)}</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => addToCart(item)}
                    className="rounded-xl bg-fresh-green px-2.5 py-2 text-xs font-semibold text-white hover:bg-brand-greenHover"
                  >
                    Add to cart
                  </button>
                  <MenuItemFavouriteButton
                    favourited={favouriteIds.has(itemKey(item))}
                    onAdd={() => addFavourite(item)}
                    onRemove={() => removeFavourite(item)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

