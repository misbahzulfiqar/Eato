/**
 * Public marketing / storefront home (customers & guests only for “main” experience).
 * Route: `/` (index). Do not merge with restaurant dashboard — see `restaurant/RestaurantHome.tsx`.
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import FloatingHomeLogo from '../components/FloatingHomeLogo';
import { HeroFoodPhraseCarousel } from '../components/home/HeroFoodPhraseCarousel';
import { SHOP_NAV_CATEGORIES, shopPath } from '../data/shopNav';

type IconProps = { className?: string };

const HERO_IMG = '/Hero-Section-img.jpg';

/** Right column — place `image.png` (or `image.jpg`) in `public/` */
const FEATURE_IMAGE_SRC = '/image.png';

/** Decorative overlay between Benefits and Hot Offers — `public/5.png` (add or replace in `public/`) */
const BENEFITS_HOT_OFFERS_OVERLAY_IMG = '/Designs/5.png';

/** Eato picks section — centered watermark overlay (`public/Designs/1.png`) */
const NEWSLETTER_DECOR_IMG = '/Designs/1.png';

/** Hot Offers — `public/11.png`, `public/22.png` */
const HOT_OFFER_SEAFOOD_IMG = '/11.png';
const HOT_OFFER_PRODUCE_IMG = '/22.png';

const HOT_OFFERS = [
  {
    title: 'Best Cuisine From the sea of America',
    sub: 'Premium seafood available everyday!',
    img: HOT_OFFER_SEAFOOD_IMG,
    overlayClass: 'bg-gradient-to-r from-black/80 via-black/45 to-black/20',
    titleClass: 'text-white drop-shadow-sm',
    subClass: 'text-white/90',
  },
  {
    title: 'Fresh vegetable & Fruit basket',
    sub: 'Fresh Packed to order',
    img: HOT_OFFER_PRODUCE_IMG,
    overlayClass: 'bg-gradient-to-r from-[#f5f5f3]/95 from-25% via-[#f5f5f3]/55 to-transparent',
    titleClass: 'text-[#2d5a43]',
    subClass: 'text-stone-700',
  },
];

function IconBenefitCurated({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <ellipse cx="22" cy="48" rx="12" ry="14" fill="#7cb342" />
      <path d="M22 34c-6 2-10 10-8 18l4-2c2-6 8-10 14-8" fill="#8bc34a" />
      <rect x="30" y="28" width="10" height="22" rx="2" fill="#eceff1" stroke="#90a4ae" strokeWidth="1" />
      <path d="M32 28v-6c0-2 2-4 4-4h2c2 0 4 2 4 4v6" fill="#cfd8dc" />
      <ellipse cx="52" cy="46" rx="10" ry="7" fill="#8d6e63" />
      <path d="M46 42h12v8c0 2-2 4-4 4h-4c-2 0-4-2-4-4v-8z" fill="#6d4c41" />
      <path d="M18 52l-6 8h14l-2-10c-2 2-4 2-6 2z" fill="#d7ccc8" />
      <path d="M16 58h10v4c0 2-2 4-4 4h-2c-2 0-4-2-4-4v-4z" fill="#bcaaa4" />
    </svg>
  );
}

function IconBenefitHandmade({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <ellipse cx="26" cy="44" rx="14" ry="16" fill="#e53935" />
      <path d="M26 30c-2 0-4 2-6 6-2 8 2 18 6 20 4-2 8-12 6-20-2-4-4-6-6-6z" fill="#ef5350" />
      <path d="M26 28l-4-8 2-2 4 6-2 4z" fill="#43a047" />
      <path d="M24 26l6-6 2 2-4 6-4-2z" fill="#66bb6a" />
      <ellipse cx="48" cy="40" rx="12" ry="14" fill="#c62828" />
      <path d="M48 28c-4 2-8 10-6 18 2 6 4 10 6 12 2-2 4-6 6-12 2-8-2-16-6-18z" fill="#e53935" />
      <path d="M48 26l-3-7 2-2 3 5-2 4z" fill="#43a047" />
      <ellipse cx="26" cy="44" rx="4" ry="5" fill="#ff8a80" opacity="0.5" />
    </svg>
  );
}

function IconBenefitNatural({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="36" cy="38" r="22" fill="#ffee58" stroke="#fdd835" strokeWidth="2" />
      <path d="M36 20v36M20 38h32" stroke="#fdd835" strokeWidth="1.5" opacity="0.6" />
      <ellipse cx="44" cy="32" rx="6" ry="8" fill="#fff9c4" opacity="0.7" />
      <path d="M52 28c4 4 6 10 4 14-3-2-6-8-4-14z" fill="#81d4fa" />
      <circle cx="56" cy="26" r="3" fill="#b3e5fc" />
    </svg>
  );
}

function IconBenefitShipping({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M8 40h32v14H8V40z" fill="#ffca28" stroke="#f9a825" strokeWidth="1.5" />
      <path d="M40 40l10-10h8v24H40V40z" fill="#ffd54f" stroke="#f9a825" strokeWidth="1.5" />
      <rect x="44" y="42" width="18" height="12" rx="2" fill="#66bb6a" stroke="#43a047" strokeWidth="1.2" />
      <path d="M49 47l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18" cy="56" r="5" fill="#424242" />
      <circle cx="18" cy="56" r="2" fill="#9e9e9e" />
      <circle cx="52" cy="56" r="5" fill="#424242" />
      <circle cx="52" cy="56" r="2" fill="#9e9e9e" />
    </svg>
  );
}

const BENEFITS = [
  { title: 'Curated Products', body: 'Eating locally grown foods has many benefits', Icon: IconBenefitCurated },
  { title: 'Handmade', body: 'Made with passion by 300+ curators across.', Icon: IconBenefitHandmade },
  { title: '100% Natural', body: 'Eat local, consume local, closer to nature.', Icon: IconBenefitNatural },
  { title: 'Shipping', body: 'Free shipping is valid on orders of $50 or more shipped', Icon: IconBenefitShipping },
] as const;

const PRODUCTS_NEW = [
  { name: 'Organic Almonds Raw', cat: 'Nuts & Seeds', price: 14.99, old: null, img: '/eato1.png', badge: 'NEW' },
  { name: 'Cold Press Olive Oil', cat: 'Oils', price: 24.5, old: 29.99, img: '/eato2.png', badge: null },
  { name: 'Fresh Strawberries', cat: 'Fruits', price: 8.99, old: null, img: '/eato3.png', badge: 'NEW' },
];

const PRODUCTS_SALE = [
  { name: 'Wildflower Honey Jar', cat: 'Pantry', price: 12.99, old: 18.99, img: '/eato4.png', badge: 'SALE' },
  { name: 'Greek Yogurt Plain', cat: 'Dairy', price: 4.49, old: 5.99, img: '/eato5.png', badge: 'SALE' },
  { name: 'Whole Grain Oats', cat: 'Bakery', price: 6.25, old: 8.5, img: '/eato6.png', badge: 'SALE' },
];

const PRODUCTS_POPULAR = [
  { name: 'Avocado Hass Organic', cat: 'Fruits', price: 9.99, old: null, img: '/eato7.png', badge: null },
  { name: 'Spinach Baby Leaves', cat: 'Vegetables', price: 3.99, old: null, img: '/eato8.png', badge: null },
  { name: 'Farm Eggs Free Range', cat: 'Dairy', price: 7.5, old: null, img: '/eato9.png', badge: null },
];

const PRODUCTS_TOP = [
  { name: 'Organic Quinoa', cat: 'Pantry', price: 11.0, old: null, img: '/eato10.png', badge: null },
  { name: 'Dark Chocolate 70%', cat: 'Snacks', price: 5.99, old: 7.5, img: '/eato11.png', badge: 'SALE' },
  { name: 'Green Smoothie Mix', cat: 'Beverages', price: 15.99, old: null, img: '/eato12.png', badge: 'NEW' },
];

function IconMailOutline({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function IconArrowRight({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function PromoTile({ discount, price, sub, bg, img }: { discount: string; price?: string; sub?: string; bg?: string; img?: string }) {
  return (
    <div
      className={`relative flex min-h-[180px] flex-col justify-end overflow-hidden rounded-lg p-4 text-white sm:min-h-[190px] sm:p-5 ${img ? '' : bg}`}
    >
      {img && (
        <>
          <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" aria-hidden />
        </>
      )}
      <div className="relative z-10">
        <p className="text-2xl font-bold tracking-tight sm:text-3xl">{discount}</p>
        {price ? <p className="mt-0.5 text-lg font-semibold sm:text-xl">{price}</p> : null}
        {sub ? <p className="mt-1 text-xs text-white/90 sm:text-sm">{sub}</p> : null}
      </div>
    </div>
  );
}

const BITE_MATTERS_TITLE = 'Where Every Bite Matters';

function ProductSection({
  title,
  promo,
  products,
  sectionId,
}: {
  title: string;
  promo: any;
  products: any[];
  sectionId?: string;
}) {
  const { user } = useAuth();
  const shopHref = user?.role === 'customer' ? '/restaurants' : shopPath(SHOP_NAV_CATEGORIES[0].slug);
  const isBiteMattersHeading = title === BITE_MATTERS_TITLE;

  return (
    <section id={sectionId ?? undefined} className="bg-surface-muted py-6 md:py-8">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <div
          className={`rounded-xl bg-white p-6 md:p-8 ${isBiteMattersHeading ? '' : 'shadow-lg md:shadow-xl'}`}
        >
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <h2
              className={`text-2xl font-bold md:text-3xl ${
                isBiteMattersHeading ? 'rounded-lg bg-fresh-green px-5 py-3 text-white' : 'text-fresh-green'
              }`}
            >
              {title}
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-2">
                {SHOP_NAV_CATEGORIES.map(({ slug, label }) => (
                  <Link
                    key={slug}
                    to={shopPath(slug)}
                    className="rounded px-2 py-1 text-sm text-stone-600 transition-colors hover:bg-surface-muted hover:text-fresh-green"
                  >
                    {label}
                  </Link>
                ))}
              </div>
              <Link to={shopHref} className="whitespace-nowrap text-sm font-semibold text-fresh-lime hover:text-fresh-green">
                Shop All →
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:gap-4 lg:grid lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-5">
            <PromoTile {...promo} />
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:contents">
              {products.map((p) => (
                <ProductCard key={p.name} product={p} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const PARALLAX = { bridgeX: 0.55, bridgeY: 0, kitchenX: 0, kitchenY: 0.52, newsletterDecorX: 0.52 } as const;

function sectionScrollDelta(el: HTMLElement | null) {
  if (!el) return 0;
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const sectionCenterY = rect.top + rect.height / 2;
  const viewportCenterY = vh / 2;
  return sectionCenterY - viewportCenterY;
}

export default function Home() {
  const { user } = useAuth();
  const hotOffersSectionRef = useRef<HTMLElement | null>(null);
  const kitchenSectionRef = useRef<HTMLElement | null>(null);
  const newsletterMidSectionRef = useRef<HTMLElement | null>(null);
  const [parallax, setParallax] = useState({
    bridge: { x: 0, y: 0 },
    kitchen: { x: 0, y: 0 },
    newsletterDecor: { x: 0 },
  });

  const shopHref = user?.role === 'customer' ? '/restaurants' : shopPath(SHOP_NAV_CATEGORIES[0].slug);

  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const updateParallax = () => {
      const dBridge = sectionScrollDelta(hotOffersSectionRef.current);
      const dKitchen = sectionScrollDelta(kitchenSectionRef.current);
      const dNewsletterMid = sectionScrollDelta(newsletterMidSectionRef.current);

      setParallax({
        bridge: { x: dBridge * PARALLAX.bridgeX, y: dBridge * PARALLAX.bridgeY },
        kitchen: { x: dKitchen * PARALLAX.kitchenX, y: dKitchen * PARALLAX.kitchenY },
        newsletterDecor: { x: dNewsletterMid * PARALLAX.newsletterDecorX },
      });
    };

    updateParallax();
    window.addEventListener('scroll', updateParallax, { passive: true });
    window.addEventListener('resize', updateParallax, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateParallax);
      window.removeEventListener('resize', updateParallax);
    };
  }, []);

  return (
    <div className="bg-surface-canvas font-sans text-stone-800 overflow-x-hidden">
      <FloatingHomeLogo />
      {/* Hero */}
      <section className="w-full p-0">
        <div className="relative min-h-[330px] lg:min-h-[467px] overflow-hidden rounded-none">
          <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="relative z-10 min-h-[320px] lg:min-h-[420px] flex flex-col items-center justify-center text-center px-4">
            <h1 className="m-0 text-3xl sm:text-4xl md:text-5xl font-bold text-fresh-green leading-tight">
              Eat Organic
              <br />
              <span className="inline-flex flex-wrap items-baseline justify-center gap-x-1.5">
                <span>&amp;</span>
                <HeroFoodPhraseCarousel />
              </span>
            </h1>
            <p className="m-0 mt-4 max-w-lg text-base font-medium text-stone-600 leading-relaxed">
              Eat local, Box contents change weekly to reflect the season&apos;s best
            </p>
          </div>
        </div>
      </section>

      {/* Benefits bar */}
      <section className="w-full py-6 sm:py-8 lg:py-10">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {BENEFITS.map(({ title, body, Icon }, i) => (
                <div
                  key={title}
                  className={[
                    'flex items-start gap-4 sm:gap-5 p-6 sm:p-8 lg:p-9 border-stone-200',
                    i < 3 ? 'border-b sm:border-b-0 lg:border-b-0' : '',
                    i < 2 ? 'sm:border-b' : '',
                    i % 2 === 0 ? 'sm:border-r' : '',
                    i < 3 ? 'lg:border-r' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <div className="shrink-0 w-[72px] h-[72px] sm:w-20 sm:h-20 flex items-center justify-center">
                    <Icon className="w-full h-full" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="m-0 text-base sm:text-lg font-bold text-fresh-green leading-snug">{title}</h3>
                    <p className="m-0 mt-2 text-sm sm:text-[0.9375rem] text-stone-500 leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Hot Offers */}
      <section ref={hotOffersSectionRef} className="relative w-full overflow-visible py-8 sm:py-10 lg:py-12">
        <div
          className="pointer-events-none absolute z-[100] right-2 top-0 -translate-y-1/2 sm:right-3 lg:right-[max(1rem,calc((100vw-1320px)/2+1rem))] select-none will-change-transform"
          style={{ transform: `translate3d(${parallax.bridge.x}px, calc(-50% + ${parallax.bridge.y}px), 0)` }}
          aria-hidden
        >
          <img
            src={BENEFITS_HOT_OFFERS_OVERLAY_IMG}
            alt=""
            className="relative right-[15%] block h-auto max-h-[300px] w-[min(380px,74vw)] max-w-[min(460px,92%)] object-contain object-right drop-shadow-sm sm:max-h-[350px] sm:w-[min(405px,61vw)] lg:max-h-[405px] lg:w-[min(460px,40vw)]"
          />
        </div>
        <div className="relative z-10 max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="m-0 mb-6 sm:mb-8 text-2xl sm:text-3xl font-bold text-fresh-green tracking-tight">Hot Offers</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {HOT_OFFERS.map((offer) => (
              <Link
                key={offer.title}
                to={shopHref}
                className="group relative block min-h-[200px] sm:min-h-[220px] lg:min-h-[240px] overflow-hidden rounded-3xl shadow-md transition-shadow hover:shadow-lg"
              >
                <img src={offer.img} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.2]" />
                <div className={`pointer-events-none absolute inset-0 z-[1] ${offer.overlayClass}`} aria-hidden />
                <div className="relative z-10 flex h-full min-h-[200px] sm:min-h-[220px] lg:min-h-[240px] max-w-[95%] sm:max-w-[85%] flex-col justify-center p-5 sm:p-7 lg:p-8 text-left">
                  <h3 className={`m-0 text-lg sm:text-xl lg:text-2xl font-bold leading-snug ${offer.titleClass}`}>{offer.title}</h3>
                  <p className={`m-0 mt-3 text-sm sm:text-base ${offer.subClass} leading-relaxed`}>{offer.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Remaining sections unchanged (copied from your JSX). */}
      {/* NOTE: To keep this patch manageable, the rest of the JSX was copied verbatim from the original Home.jsx. */}

      {/* Feature */}
      <section className="w-full bg-surface-canvas py-12 sm:py-16 lg:py-20">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-14 xl:gap-20">
            <div className="relative flex-1 min-w-0 lg:max-w-[52%]">
              <div
                className="pointer-events-none absolute -left-4 -right-4 top-0 bottom-0 sm:-left-6 opacity-[0.14]"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Cg fill='none' stroke='%231e4d2b' stroke-width='0.85' stroke-linecap='round'%3E%3Cpath d='M18 28c6 10 14 18 10 32M48 22c-4 14 8 26 20 22M82 18c10 8 8 24-2 30M110 40c-12 6-8 28 6 32M28 72c14 4 22 20 14 34M70 68c12-2 20 14 12 28M96 80c10 8 6 22-4 26'/%3E%3Cellipse cx='38' cy='108' rx='6' ry='10' transform='rotate(-25 38 108)'/%3E%3Cellipse cx='102' cy='96' rx='5' ry='8' transform='rotate(15 102 96)'/%3E%3Ccircle cx='58' cy='52' r='3'/%3E%3Ccircle cx='118' cy='118' r='2.5'/%3E%3C/g%3E%3C/svg%3E\")",
                  backgroundSize: '140px 140px',
                }}
                aria-hidden
              />
              <div className="relative z-10 text-left">
                <h2 className="m-0 text-3xl sm:text-4xl lg:text-[2.5rem] xl:text-5xl font-bold text-fresh-green leading-[1.15] tracking-tight">
                  Perfectly designed to start your online business
                </h2>
                <p className="m-0 mt-6 max-w-xl text-base sm:text-lg text-stone-700 leading-relaxed">
                  Design detailed product pages and stunning product listings with an easy drag-and-drop integration
                </p>
                <Link
                  to={shopHref}
                  className="mt-8 inline-flex items-center justify-center rounded-full bg-brand-lime px-8 py-3.5 text-sm sm:text-base font-semibold text-white shadow-sm transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-fresh-green focus-visible:ring-offset-2"
                >
                  View Shop Page
                </Link>
              </div>
            </div>
            <div className="relative flex-1 w-full min-w-0">
              <img
                src={FEATURE_IMAGE_SRC}
                alt=""
                className="w-full h-auto max-h-[520px] object-cover lg:max-h-none lg:aspect-[4/3]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Subscribe / Eato picks + Kitchen sections + ProductSection blocks copied from original. */}
      {/* For correctness, the remaining JSX blocks are included below exactly as in your Home.jsx. */}

      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative rounded-xl overflow-hidden min-h-[220px] flex items-center">
          <img
            src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1600&q=80"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-fresh-lime/15" />
          <div className="relative max-w-lg px-4 py-8 sm:px-8 sm:py-10 lg:px-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white [text-shadow:0_1px_3px_rgb(0_0_0_/_22%)]">
              Organic Ingredients Made Easy
            </h2>
            <p className="text-white/95 mt-2 text-sm md:text-base [text-shadow:0_1px_2px_rgb(0_0_0_/_18%)]">
              Curated groceries delivered with the same care as your favorite restaurant orders.
            </p>
            <Link
              to={shopHref}
              className="mt-6 inline-flex items-center gap-2 bg-white text-fresh-green px-5 py-2.5 rounded-md text-sm font-semibold hover:bg-fresh-muted"
            >
              Explore
              <IconArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section
        ref={newsletterMidSectionRef}
        className="relative w-full overflow-hidden bg-surface-canvas py-14 sm:py-16 lg:py-20"
      >
        <img
          src={NEWSLETTER_DECOR_IMG}
          alt=""
          aria-hidden
          className="pointer-events-none absolute z-[1] left-1/2 top-1/2 w-[min(92vw,520px)] max-h-[min(50vh,400px)] object-contain opacity-[0.14] sm:opacity-[0.16] select-none will-change-transform"
          style={{ transform: `translate3d(calc(-50% + ${parallax.newsletterDecor.x}px), -50%, 0)` }}
        />
        <div className="relative z-10 max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-xl flex-col items-center text-center">
            <h2 className="m-0 text-3xl sm:text-4xl font-bold text-fresh-green leading-tight tracking-tight">Eato picks</h2>
            <p className="m-0 mt-4 text-lg sm:text-xl font-bold text-fresh-green leading-snug">Your weekly organic box, in your inbox</p>
            <p className="m-0 mt-4 text-base sm:text-[1.0625rem] text-stone-600 leading-relaxed">
              Be first to see what&apos;s in season, when staples are back in stock, and short-run deals from local growers and kitchens we trust.
            </p>
            <form className="mt-8 w-full max-w-md flex flex-col items-center gap-3" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="eato-picks-email" className="w-full text-center text-sm font-bold text-fresh-green">
                Email
              </label>
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:gap-0 sm:overflow-hidden sm:rounded-lg sm:border sm:border-stone-300 sm:bg-white sm:shadow-sm">
                <div className="flex min-h-[52px] flex-1 items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 sm:border-0 sm:rounded-none">
                  <IconMailOutline className="h-5 w-5 shrink-0 text-stone-400" />
                  <input
                    id="eato-picks-email"
                    type="email"
                    required
                    placeholder="Email for restock & box news"
                    className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-0"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex min-h-[52px] shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-400 px-6 text-sm font-bold text-stone-800 shadow-sm transition-colors hover:bg-amber-500 sm:rounded-none"
                >
                  Get updates
                  <IconArrowRight className="h-4 w-4 text-stone-800" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section ref={kitchenSectionRef} className="relative w-full overflow-hidden bg-surface-canvas py-14 sm:py-20 lg:py-28">
        <img
          src="/home-pic-5 (1).png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute z-[13] sm:block bottom-[10%] left-[29%] object-cover will-change-transform"
          style={{ transform: `translate3d(${parallax.kitchen.x}px, ${parallax.kitchen.y}px, 0)` }}
        />
        <div className="relative z-20 mx-auto flex max-w-[1320px] flex-col px-4 sm:px-6 lg:px-8 lg:min-h-[420px] lg:flex-row lg:items-center">
          <div className="relative max-w-xl pt-4 text-left lg:pr-12">
            <p className="m-0 text-sm font-semibold uppercase tracking-wider text-fresh-green/90">Fresh from our kitchen</p>
            <h2 className="m-0 mt-3 text-3xl font-bold leading-tight text-fresh-green sm:text-4xl lg:text-[2.35rem]">
              Plates, produce &amp; pantry — curated for every appetite
            </h2>
            <p className="m-0 mt-4 text-base leading-relaxed text-stone-800 sm:text-lg">
              Scroll our picks, build your box, and get honest food without the guesswork — same-day friendly, seasonal, and packed with care.
            </p>
            <Link to={shopHref} className="mt-7 inline-flex items-center gap-2 rounded-full bg-fresh-green px-7 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-greenHover">
              Start shopping
              <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="hidden shrink-0 lg:block lg:w-[42%]" aria-hidden />
        </div>
      </section>

      <ProductSection
        sectionId="shop-sections"
        title={BITE_MATTERS_TITLE}
        promo={{
          discount: '50% Off',
          price: '$29.99',
          sub: 'Organic starter bundle',
          bg: 'bg-stone-900',
          img: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=600&q=80',
        }}
        products={PRODUCTS_NEW}
      />

      <ProductSection
        title="Shop Sales"
        promo={{
          discount: '20% Off',
          price: '$19.99',
          sub: 'Weekly specials',
          bg: 'bg-stone-800',
          img: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=600&q=80',
        }}
        products={PRODUCTS_SALE}
      />

      <ProductSection
        title="Shop Popular"
        promo={{
          discount: 'Fresh',
          price: 'Pick of the week',
          sub: 'Locally sourced produce',
          bg: 'bg-stone-900',
          img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
        }}
        products={PRODUCTS_POPULAR}
      />

      <ProductSection
        title="Top Rated"
        promo={{
          discount: 'Top',
          price: '4.9★ rated',
          sub: 'Customer favorites',
          bg: 'bg-stone-900',
          img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=600&q=80',
        }}
        products={PRODUCTS_TOP}
      />
    </div>
  );
}

