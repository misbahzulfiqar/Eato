import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FOOTER_SHOP_LINKS, FOOTER_USEFUL_LINKS } from '../data/footerData';
import { SHOP_NAV_CATEGORIES, shopPath } from '../data/shopNav';

type IconProps = { className?: string };

const LOGO_SRC = '/LOGO.png';

function IconLeafTiny({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3c-4 4-6 9-5 14 2-3 5-5 9-5-3-4-2-7-4-9z" fill="#8bc34a" />
      <path d="M12 17v4" stroke="#1e4d2b" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconCheck({ className }: IconProps) {
  return (
    <svg className={`text-footer-accent ${className ?? ''}`} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="9" fill="currentColor" />
      <path d="M6 10l2.5 2.5L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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

export default function SiteFooter() {
  const { user } = useAuth();
  const shopHref = user?.role === 'customer' ? '/restaurants' : shopPath(SHOP_NAV_CATEGORIES[0].slug);

  return (
    <>
      <div className="bg-surface-canvas">
        <div
          id="contact"
          className="relative z-20 mx-auto max-w-[1180px] -mb-24 px-4 pt-6 sm:-mb-28 sm:px-6 sm:pt-10 md:-mb-32 lg:px-8"
        >
          <div className="relative overflow-hidden rounded-2xl px-4 py-8 shadow-[0_8px_40px_rgba(0,0,0,0.08)] sm:rounded-3xl sm:px-6 sm:py-10 lg:py-12">
            {/* Background video */}
            <div className="absolute inset-0 z-0">
              <video
                className="h-full w-full object-cover"
                src="/video/5820008-hd_1920_1080_25fps.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden
              />
              {/* Black gradient overlay for readability */}
              <div className="absolute inset-0 bg-black/25" aria-hidden />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-black/5" aria-hidden />
            </div>

            <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
              <p className="flex items-center justify-center gap-2 text-xs font-semibold tracking-wide text-white/90 sm:text-sm md:text-base">
                Eat local with Eato
              </p>
              <h2 className="mt-2 text-base font-semibold leading-snug text-white sm:mt-3 sm:text-xl lg:text-[1.65rem]">
                Restocks, recipes &amp; restaurant-ready staples
              </h2>
              <ul className="mt-5 w-full space-y-2.5 sm:max-w-xl">
                {['New produce, dairy & pantry arrivals'].map((item) => (
                  <li key={item} className="flex items-center justify-center gap-3 text-sm text-white/90 sm:text-base">
                    <IconCheck className="h-5 w-5 shrink-0" />
                    <span className="max-w-[min(100%,20rem)] text-center">{item}</span>
                  </li>
                ))}
              </ul>

              <form
                className="mt-6 flex w-full max-w-lg flex-col gap-0 overflow-hidden rounded-lg border border-white/20 bg-white/90 focus-within:ring-2 focus-within:ring-footer-accent/60 sm:flex-row sm:items-stretch"
                onSubmit={(e) => e.preventDefault()}
              >
                <label className="sr-only" htmlFor="footer-newsletter-email">
                  Email
                </label>
                <div className="flex min-h-[52px] flex-1 items-center gap-2 px-3 sm:px-4">
                  <IconMailOutline className="h-5 w-5 shrink-0 text-stone-400" />
                  <input
                    id="footer-newsletter-email"
                    type="email"
                    required
                    placeholder="Your email for Eato news &amp; offers"
                    className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-0"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center justify-center gap-2 bg-gradient-to-r from-footer-accent to-footer-deep px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-[filter] hover:brightness-105 sm:min-h-[52px] sm:px-8 sm:py-0"
                >
                  Sign me up
                  <IconArrowRight className="h-4 w-4 text-white" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <footer
        className="relative z-10 bg-[#1a4225] pb-12 pt-28 text-white sm:pb-14 sm:pt-32 md:pt-36"
        style={{ clipPath: 'polygon(0 36px, 50% 0, 100% 36px, 100% 100%, 0 100%)' }}
      >
        <div className="relative mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8 xl:gap-10">
            <div className="sm:col-span-2 lg:col-span-1">
              <Link to="/" className="inline-block">
                <img src={LOGO_SRC} alt="Eato" className="h-10 w-auto rounded-sm max-w-[200px] object-contain object-left sm:h-11" />
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/75">
                Organic groceries and restaurant-quality meals delivered with care. Eat local, seasonal, and honest food every day.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5 sm:mt-5">
                {[
                  { label: 'Facebook', d: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' },
                  { label: 'Instagram', d: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.069-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
                  { label: 'Twitter', d: 'M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z' },
                  { label: 'LinkedIn', d: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' },
                  { label: 'YouTube', d: 'M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33zM9.75 15.02V8.98l5.75 3.04-5.75 3z' },
                ].map(({ label, d }) => (
                  <a
                    key={label}
                    href="#contact"
                    aria-label={label}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-footer-accent text-white transition-[filter] hover:brightness-110"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d={d} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-4 border-b border-dashed border-footer-accent/70 pb-2 text-base font-semibold text-white">Our Menus</h3>
              <ul className="space-y-2">
                {FOOTER_SHOP_LINKS.map(({ label, highlight, to }) => (
                  <li key={label}>
                    <Link to={to ?? shopHref} className={`group inline-flex items-center gap-2 text-sm ${highlight ? 'font-medium text-footer-accent' : 'text-white/80 hover:text-footer-accent'}`}>
                      <span className="text-white/50 group-hover:text-footer-accent" aria-hidden>
                        →
                      </span>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 border-b border-dashed border-footer-accent/70 pb-2 text-base font-semibold text-white">Useful Links</h3>
              <ul className="space-y-2">
                {FOOTER_USEFUL_LINKS.map(({ label, href }) => (
                  <li key={label}>
                    {href.startsWith('/') ? (
                      <Link to={href} className="group inline-flex items-center gap-2 text-sm text-white/80 hover:text-footer-accent">
                        <span className="text-white/50 group-hover:text-footer-accent" aria-hidden>
                          →
                        </span>
                        {label}
                      </Link>
                    ) : (
                      <a href={href} className="group inline-flex items-center gap-2 text-sm text-white/80 hover:text-footer-accent">
                        <span className="text-white/50 group-hover:text-footer-accent" aria-hidden>
                          →
                        </span>
                        {label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 border-b border-dashed border-footer-accent/70 pb-2 text-base font-semibold text-white">Contact Us</h3>
              <ul className="space-y-4 text-sm text-white/85">
                <li className="flex gap-3">
                  <span className="pt-2">
                    1-800-555-0199
                    <br />
                    1-800-555-0188
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="break-all pt-2">hello@eato.com</span>
                </li>
                <li className="flex gap-3">
                  <span className="pt-2">123 Organic Lane, Food City, FC 10001</span>
                </li>
              </ul>
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className="mb-4 border-b border-dashed border-footer-accent/70 pb-2 text-base font-semibold text-white">Download App</h3>
              <p className="mb-4 text-sm text-white/75">Save $3 With app &amp; new user only</p>
              <div className="flex max-w-[220px] flex-col gap-3">
                <a
                  href="#contact"
                  className="inline-flex items-center gap-3 rounded-lg bg-footer-accent px-4 py-2.5 font-semibold text-white transition-[filter] hover:brightness-110"
                >
                  <svg className="h-8 w-8 shrink-0" viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="currentColor"
                      d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"
                    />
                  </svg>
                  <span className="text-left leading-tight">
                    <span className="block text-[10px] uppercase tracking-wide opacity-90">Get it on</span>
                    <span className="block text-sm font-semibold">Google Play</span>
                  </span>
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-3 rounded-lg bg-footer-accent px-4 py-2.5 font-semibold text-white transition-[filter] hover:brightness-105"
                >
                  <svg className="h-7 w-7 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  <span className="text-left leading-tight">
                    <span className="block text-[10px] uppercase tracking-wide opacity-90">Download on the</span>
                    <span className="block text-sm font-semibold">App Store</span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <div className="border-t border-white/10 bg-brand-greenHover text-xs text-white/80 sm:text-sm">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()}. All rights reserved by Eato</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="whitespace-nowrap text-white/50">Accept For</span>
            <div className="flex items-center gap-1.5">
              {['PayPal', 'MC', 'Visa', 'Disc'].map((name) => (
                <span
                  key={name}
                  className="flex h-7 min-w-[2.25rem] items-center justify-center rounded border border-white/10 bg-white/10 px-1.5 text-[10px] font-medium text-white/90"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

