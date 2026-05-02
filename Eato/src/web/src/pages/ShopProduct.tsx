import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getCategoryBySlug,
  getCategoryProductBySlot,
  parseProductSlot,
  SHOP_NAV_CATEGORIES,
  shopPath,
  shopProductPath,
} from '../data/shopNav';

type ShopProductShape = {
  name: string;
  cat: string;
  price: number;
  old?: number | null;
  img: string;
  badge?: 'NEW' | 'SALE' | null;
};

export default function ShopProduct() {
  const { categorySlug, productSlot: productSlotParam } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const shopHref = user?.role === 'customer' ? '/restaurants' : shopPath(SHOP_NAV_CATEGORIES[0].slug);

  const category = getCategoryBySlug(categorySlug as string);
  const slot = parseProductSlot(productSlotParam ?? '');
  const product = category && slot != null ? (getCategoryProductBySlot(category.slug, slot) as ShopProductShape | null) : null;

  if (!category) {
    return <Navigate to={shopPath(SHOP_NAV_CATEGORIES[0].slug)} replace />;
  }
  if (!slot || !product) {
    return <Navigate to={shopPath(category.slug)} replace />;
  }

  // Gallery: using your one image across thumbnails.
  const gallery = useMemo(() => [product.img, product.img, product.img, product.img], [product.img]);
  const [activeIdx, setActiveIdx] = useState(0);
  const activeImg = gallery[activeIdx] ?? product.img;

  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setActiveIdx(0);
    setQuantity(1);
  }, [categorySlug, productSlotParam, product.img]);

  // Magnifier (lens + zoom box)
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [isMagnifying, setIsMagnifying] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [bg, setBg] = useState({ px: 50, py: 50 });
  const ZOOM = 2.5;

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
                <Link to={shopPath(category.slug)} className="hover:text-fresh-green">
                  {category.label}
                </Link>
                <span className="mx-2 text-stone-400">/</span>
                <span className="text-fresh-green">{product.name}</span>
              </p>
              <h1 className="mt-2 text-2xl font-bold text-fresh-green md:text-3xl">{product.name}</h1>
              <p className="mt-1 text-sm font-medium uppercase tracking-wide text-fresh-lime">{product.cat}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {SHOP_NAV_CATEGORIES.map(({ slug, label }) => (
                <Link
                  key={slug}
                  to={shopPath(slug)}
                  className={`rounded px-2 py-1 text-sm transition-colors ${
                    slug === category.slug ? 'bg-fresh-green font-semibold text-white' : 'text-stone-600 hover:bg-surface-muted hover:text-fresh-green'
                  }`}
                >
                  {label}
                </Link>
              ))}
              <Link to={shopHref} className="whitespace-nowrap text-sm font-semibold text-fresh-lime hover:text-fresh-green">
                Shop All →
              </Link>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="relative overflow-hidden rounded-xl bg-white shadow-sm">
              <div className="group/card-media relative aspect-square max-h-[min(100vw,320px)] w-full bg-white lg:max-h-[360px]">
                <div
                  ref={wrapRef}
                  className="absolute inset-0 overflow-hidden rounded-xl bg-white cursor-crosshair"
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

                  {product.badge === 'NEW' ? (
                    <span className="absolute left-3 top-3 z-[25] rounded bg-fresh-lime px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      NEW
                    </span>
                  ) : null}
                  {product.badge === 'SALE' ? (
                    <span className="absolute left-3 top-3 z-[25] rounded bg-red-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      SALE
                    </span>
                  ) : null}

                  {/* Magnifier lens */}
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

              {/* Thumbnails */}
              <div className="mt-4 px-4 pb-4">
                <div className="flex items-center gap-3 overflow-auto">
                  {gallery.map((src, idx) => (
                    <button
                      key={`${src}-${idx}`}
                      type="button"
                      onClick={() => setActiveIdx(idx)}
                      className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-white ${
                        idx === activeIdx ? 'border-fresh-green' : 'border-stone-200'
                      }`}
                      aria-label={`Thumbnail ${idx + 1}`}
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      {idx === activeIdx ? <span className="absolute right-1 top-1 h-3 w-3 rounded-full bg-fresh-green" aria-hidden /> : null}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zoom box (desktop) */}
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

            <div className="flex flex-col mt-5">
              <h1 className="text-2xl font-bold text-fresh-green sm:text-2xl">{product.name}</h1>

              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <svg key={idx} className="h-4 w-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-semibold text-stone-700">4.5/5</span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-stone-900">${product.price.toFixed(2)}</span>
                  {product.old != null ? (
                    <span className="text-lg text-stone-400 line-through">${product.old.toFixed(2)}</span>
                  ) : null}
                </div>
                {product.old != null && product.old > 0 ? (
                  <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                    -{Math.round(((product.old - product.price) / product.old) * 100)}%
                  </span>
                ) : null}
              </div>

              <p className="mt-5 text-sm leading-relaxed text-stone-600">
                {`Fresh, quality ${category.label.toLowerCase()} — browse restaurants to order meals; this shop grid is browse-only until tied to live inventory.`}
              </p>

              <div className="mt-6 flex items-center gap-4">
                <div className="flex items-center overflow-hidden rounded-md border border-stone-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-12 w-12 items-center justify-center bg-white text-xl font-bold text-stone-700 hover:bg-stone-50"
                    aria-label="Decrease quantity"
                  >
                    –
                  </button>
                  <div className="flex h-12 w-12 items-center justify-center bg-stone-50 text-sm font-bold text-stone-700">
                    {quantity}
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-12 w-12 items-center justify-center bg-white text-xl font-bold text-stone-700 hover:bg-stone-50"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className="rounded-md bg-[#1a4225] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
                  onClick={() =>
                    showToast('Add dishes from a restaurant menu — shop items are not tied to checkout yet.', 'info')
                  }
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

