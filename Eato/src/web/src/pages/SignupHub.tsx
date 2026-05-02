/**
 * Full-viewport signup / login hub — split hero + FoodieHub-style choice cards.
 * Route: `/signup` (no site chrome).
 */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../api';
import { useAuth } from '../context/AuthContext';
import { MintFieldRow, mintInputClassCompact } from '../components/auth/MintInputShell';
import { pushAdminNotification, pushRestaurantNotification } from '../lib/notifications';

const FOOD_IMG = '/patio-sushi-min-414x500.jpg';
const LOGO_SRC = '/LOGO.png';
const ORANGE = '#f97316';
const ORANGE_DARK = '#ea580c';
const CUISINE_OPTIONS = ['Pakistani', 'Indian', 'Chinese', 'Italian', 'Fast Food', 'BBQ', 'Desserts', 'Seafood'];

function cn(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

function emailOk(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

type Panel = 'choose' | 'customer' | 'restaurant';
type AuthTab = 'signup' | 'login';

function IconCloche({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <ellipse cx="16" cy="22" rx="12" ry="3" fill={ORANGE} opacity="0.35" />
      <path d="M6 14c0-5.5 4.5-10 10-10s10 4.5 10 10v6H6v-6z" fill={ORANGE} />
      <ellipse cx="16" cy="13" rx="10" ry="9" fill={ORANGE_DARK} opacity="0.5" />
      <path d="M8 20h16v2a3 3 0 01-3 3H11a3 3 0 01-3-3v-2z" fill="#c2410c" />
    </svg>
  );
}

function IconPerson({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0v1H5v-1z" />
    </svg>
  );
}

function IconStore({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 8l2-4h12l2 4v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8zm3 10h4v-4H7v4z" />
    </svg>
  );
}

/** Bottom food doodles — light line art */
function FoodDoodles() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 overflow-hidden opacity-[0.12]" aria-hidden>
      <svg className="absolute -bottom-4 left-1/2 h-40 w-[120%] -translate-x-1/2 text-promo-orange" viewBox="0 0 800 120" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M40 80c20-30 50-45 90-40M120 95c30-50 80-70 140-55M280 70q40-35 100-25M420 88c25-40 70-55 120-45M580 75c35-20 80-15 120 5" />
        <circle cx="200" cy="45" r="18" />
        <circle cx="480" cy="38" r="22" />
        <path d="M650 50l35-12 8 40z" />
      </svg>
    </div>
  );
}

function TabSwitch({
  value,
  onChange,
  accent,
}: {
  value: AuthTab;
  onChange: (v: AuthTab) => void;
  accent: 'orange' | 'green';
}) {
  const activeText = accent === 'orange' ? 'text-[#c2410c]' : 'text-fresh-green';
  const inactiveText = 'text-stone-500 hover:text-stone-700';
  return (
    <div className="relative flex rounded-full bg-stone-200/70 p-1 shadow-inner">
      <div
        className={cn(
          'absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-white shadow-md transition-[left] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          value === 'signup' ? 'left-1' : 'left-[calc(50%+2px)]',
        )}
        aria-hidden
      />
      <button
        type="button"
        onClick={() => onChange('signup')}
        className={cn(
          'relative z-10 flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors duration-300',
          value === 'signup' ? activeText : inactiveText,
        )}
      >
        Sign up
      </button>
      <button
        type="button"
        onClick={() => onChange('login')}
        className={cn(
          'relative z-10 flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors duration-300',
          value === 'login' ? activeText : inactiveText,
        )}
      >
        Log in
      </button>
    </div>
  );
}

export default function SignupHub() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, setUserFromRegister } = useAuth();

  const [panel, setPanel] = useState<Panel>('choose');
  const [customerTab, setCustomerTab] = useState<AuthTab>('signup');
  const [restaurantTab, setRestaurantTab] = useState<AuthTab>('signup');

  const [error, setError] = useState('');

  const [cReg, setCReg] = useState({ name: '', email: '', password: '' });
  const [cAgree, setCAgree] = useState(false);
  const [cLogin, setCLogin] = useState({ email: '', password: '' });
  const [cRemember, setCRemember] = useState(true);

  const [rReg, setRReg] = useState({
    name: '',
    email: '',
    password: '',
    restaurantName: '',
    description: '',
    address: '',
    city: '',
    phone: '',
    imageUrl: '',
    cuisineSelections: [] as string[],
  });
  const [rLogin, setRLogin] = useState({ email: '', password: '' });
  const [restaurantLogoPreview, setRestaurantLogoPreview] = useState('');

  const [busy, setBusy] = useState(false);
  const appliedAsParam = useRef<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const syncBody = () => {
      document.body.style.overflow = mq.matches ? 'hidden' : '';
    };
    syncBody();
    mq.addEventListener('change', syncBody);
    return () => {
      mq.removeEventListener('change', syncBody);
      document.body.style.overflow = '';
    };
  }, []);

  /** Deep-link from home / marketing: `/signup?as=customer` or `?as=restaurant` */
  useEffect(() => {
    const as = searchParams.get('as');
    if (as !== 'customer' && as !== 'restaurant') return;
    if (appliedAsParam.current === as) return;
    appliedAsParam.current = as;
    setError('');
    if (as === 'customer') {
      setPanel('customer');
      setCustomerTab('signup');
    } else {
      setPanel('restaurant');
      setRestaurantTab('signup');
    }
  }, [searchParams]);

  const goChoose = () => {
    setPanel('choose');
    setError('');
  };

  const openCustomerLogin = () => {
    setPanel('customer');
    setCustomerTab('login');
    setError('');
  };

  const onCustomerSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!cAgree) {
      setError('Please accept the Privacy & Policy.');
      return;
    }
    setBusy(true);
    try {
      const { user, token } = await auth.registerCustomer({
        name: cReg.name.trim(),
        email: cReg.email.trim(),
        password: cReg.password,
        phone: '',
        address: '',
      });
      setUserFromRegister(user, token);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  const onCustomerLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(cLogin.email, cLogin.password, 'customer', { persist: cRemember });
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const onRestaurantSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!rReg.cuisineSelections.length) {
      setError('Please choose at least one cuisine option.');
      return;
    }
    setBusy(true);
    try {
      const { user, token } = await auth.registerRestaurant({
        name: rReg.name.trim(),
        email: rReg.email.trim(),
        password: rReg.password,
        restaurantName: rReg.restaurantName.trim(),
        description: rReg.description.trim(),
        address: rReg.address.trim(),
        city: rReg.city.trim(),
        phone: rReg.phone.trim(),
        cuisine: rReg.cuisineSelections.join(', '),
        imageUrl: rReg.imageUrl.trim(),
        status: 'pending',
      });
      setUserFromRegister(user, token);
      const rid = String(user?._id ?? user?.id ?? '');
      pushAdminNotification({
        title: 'New restaurant approval request',
        body: `${user?.restaurantName || user?.name || 'Restaurant'} requested approval. Status: pending.`,
        meta: { restaurantId: user?._id ?? user?.id, email: user?.email, restaurantName: user?.restaurantName, status: user?.status },
      });
      if (rid) {
        pushRestaurantNotification(rid, {
          title: 'Approval request sent',
          body: 'Your restaurant approval request has been sent to admin. Please wait for approval.',
          meta: { kind: 'approval_pending' },
        });
      }
      navigate('/restaurant/home');
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  const onRestaurantLogoFileChange = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setRestaurantLogoPreview(result);
        setRReg((prev) => ({ ...prev, imageUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const onRestaurantLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(rLogin.email, rLogin.password, 'restaurant');
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh w-full flex-col overflow-x-hidden overflow-y-auto bg-white pb-[max(1rem,env(safe-area-inset-bottom))] lg:h-dvh lg:max-h-[100dvh] lg:flex-row lg:overflow-hidden lg:pb-0">
      {/* LEFT — food photo only (desktop) */}
      <div className="relative hidden min-h-0 shrink-0 lg:flex lg:w-[46%] lg:max-w-[620px]">
        <img src={FOOD_IMG} alt="" className="h-full w-full object-cover" />
      </div>

      {/* RIGHT */}
      <div className="relative flex w-full flex-none flex-col bg-white lg:min-h-0 lg:flex-1 lg:overflow-hidden">
        <FoodDoodles />

        <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 px-5 pt-4 lg:px-10 lg:pt-6">
          {panel !== 'choose' ? (
            <button
              type="button"
              onClick={goChoose}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-promo-orange/40 hover:text-promo-orange"
            >
              <span aria-hidden>←</span> Back
            </button>
          ) : (
            <span />
          )}
          <Link to="/" className="text-sm font-semibold text-stone-500 transition hover:text-fresh-green">
            Home
          </Link>
        </header>

        <div className="relative z-10 flex w-full flex-col px-5 pb-6 lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:px-12 lg:pb-8">
          {/* Choice view */}
          <div
            className={cn(
              'flex w-full flex-none flex-col transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:min-h-0 lg:flex-1',
              panel === 'choose' ? 'z-20 translate-y-0 opacity-100' : 'pointer-events-none absolute inset-x-5 top-0 z-0 max-lg:opacity-0 lg:inset-x-12 -translate-y-4 opacity-0',
            )}
            aria-hidden={panel !== 'choose'}
          >
            <div className="mx-auto flex w-full max-w-xl flex-col justify-start py-2 sm:py-4 lg:max-w-2xl lg:justify-center lg:py-0">
              {/* Brand row */}
              <div className="flex flex-col items-center text-center sm:flex-row sm:justify-center sm:gap-3">
                <IconCloche className="h-11 w-11 shrink-0 sm:h-12 sm:w-12" />
                <div className="mt-2 sm:mt-0 sm:text-left">
                  <p className="text-2xl font-extrabold text-ink-dark">Eato</p>
                  <p className="text-sm text-stone-500">Food you love, delivered fast.</p>
                </div>
              </div>

              {/* Get Started */}
              <div className="mt-5 flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-promo-orange/70" />
                <h2 className="shrink-0 text-xl font-extrabold text-ink-dark lg:text-2xl">Get Started</h2>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-promo-orange/70" />
              </div>
              <p className="mt-3 text-center text-sm text-stone-500">Choose an option to create your account</p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {/* Customer card */}
                <div className="flex flex-col rounded-2xl border border-orange-100 bg-gradient-to-b from-[#fff8f0] to-[#ffedd5]/50 p-5 shadow-md transition hover:shadow-lg">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-promo-orange text-white shadow-md">
                    <IconPerson className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 text-center text-lg font-extrabold text-ink-dark">Sign Up as a Customer</h3>
                  <p className="mt-2 flex-1 text-center text-sm leading-relaxed text-stone-600">
                    Order from your favorite restaurants and get it delivered fast.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPanel('customer');
                      setCustomerTab('signup');
                      setError('');
                    }}
                    className="mt-4 w-full rounded-xl bg-promo-orange py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-110"
                  >
                    Continue as Customer &gt;
                  </button>
                </div>

                {/* Restaurant card */}
                <div className="flex flex-col rounded-2xl border border-green-100 bg-gradient-to-b from-[#f0fdf4] to-[#dcfce7]/50 p-5 shadow-md transition hover:shadow-lg">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-fresh-green text-white shadow-md">
                    <IconStore className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 text-center text-lg font-extrabold text-ink-dark">Sign Up as a Restaurant</h3>
                  <p className="mt-2 flex-1 text-center text-sm leading-relaxed text-stone-600">
                    Partner with us and grow your restaurant business online.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPanel('restaurant');
                      setRestaurantTab('signup');
                      setError('');
                    }}
                    className="mt-4 w-full rounded-xl bg-fresh-green py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-brand-greenHover"
                  >
                    Continue as Restaurant &gt;
                  </button>
                </div>
              </div>

              <p className="mt-4 text-center text-sm text-stone-600">
                Already have an account?{' '}
                <button type="button" onClick={openCustomerLogin} className="font-bold text-promo-orange hover:underline">
                  Log in
                </button>
                <span className="text-stone-400"> · </span>
                <button
                  type="button"
                  onClick={() => {
                    setPanel('restaurant');
                    setRestaurantTab('login');
                    setError('');
                  }}
                  className="font-semibold text-fresh-green hover:underline"
                >
                  Restaurant log in
                </button>
              </p>
            </div>
          </div>

          {/* Customer auth panel */}
          <div
            className={cn(
              'flex w-full flex-none flex-col py-1 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:max-w-xl lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:self-center lg:px-1',
              panel === 'customer' ? 'z-20 translate-x-0 opacity-100' : 'pointer-events-none absolute inset-x-0 top-0 z-0 px-5 opacity-0 lg:px-12 translate-x-10',
            )}
            aria-hidden={panel !== 'customer'}
          >
            <h2 className="text-center text-xl font-extrabold text-ink-dark lg:text-2xl">Customer account</h2>
            <p className="mt-1 text-center text-sm text-stone-500">Sign up or sign in to order</p>
            <div className="mx-auto mt-3 w-full max-w-md shrink-0">
              <TabSwitch value={customerTab} onChange={(t) => { setCustomerTab(t); setError(''); }} accent="orange" />
            </div>
            <div className="mx-auto mt-4 w-full max-w-md pb-4 lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:pb-2">
              {error ? (
                <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
              ) : null}
              {customerTab === 'signup' ? (
                <form onSubmit={onCustomerSignup} className="space-y-3">
                  <MintFieldRow compact id="hub-c-name" label="Name" valid={cReg.name.trim().length >= 2}>
                    <input
                      id="hub-c-name"
                      className={mintInputClassCompact}
                      value={cReg.name}
                      onChange={(e) => setCReg((s) => ({ ...s, name: e.target.value }))}
                      required
                      minLength={2}
                      autoComplete="name"
                    />
                  </MintFieldRow>
                  <MintFieldRow compact id="hub-c-email" label="E-mail" valid={emailOk(cReg.email)}>
                    <input
                      id="hub-c-email"
                      type="email"
                      className={mintInputClassCompact}
                      value={cReg.email}
                      onChange={(e) => setCReg((s) => ({ ...s, email: e.target.value }))}
                      required
                      autoComplete="email"
                    />
                  </MintFieldRow>
                  <MintFieldRow compact id="hub-c-pass" label="Password" valid={cReg.password.length >= 6}>
                    <input
                      id="hub-c-pass"
                      type="password"
                      className={mintInputClassCompact}
                      value={cReg.password}
                      onChange={(e) => setCReg((s) => ({ ...s, password: e.target.value }))}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </MintFieldRow>
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={cAgree}
                      onChange={(e) => setCAgree(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-stone-300 text-promo-orange"
                    />
                    <span className="text-xs text-stone-600">
                      I agree to the{' '}
                      <Link to="/" className="font-semibold text-promo-orange underline">
                        Privacy &amp; Policy
                      </Link>
                    </span>
                  </label>
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-xl bg-promo-orange py-3 text-sm font-bold text-white shadow-md hover:brightness-110 disabled:opacity-60"
                  >
                    Create account
                  </button>
                </form>
              ) : (
                <form onSubmit={onCustomerLogin} className="space-y-3">
                  <MintFieldRow compact id="hub-cl-email" label="E-mail" valid={emailOk(cLogin.email)}>
                    <input
                      id="hub-cl-email"
                      type="email"
                      className={mintInputClassCompact}
                      value={cLogin.email}
                      onChange={(e) => setCLogin((s) => ({ ...s, email: e.target.value }))}
                      required
                      autoComplete="email"
                    />
                  </MintFieldRow>
                  <MintFieldRow compact id="hub-cl-pass" label="Password" valid={cLogin.password.length >= 1}>
                    <input
                      id="hub-cl-pass"
                      type="password"
                      className={mintInputClassCompact}
                      value={cLogin.password}
                      onChange={(e) => setCLogin((s) => ({ ...s, password: e.target.value }))}
                      required
                      autoComplete="current-password"
                    />
                  </MintFieldRow>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={cRemember}
                      onChange={(e) => setCRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-stone-300 text-promo-orange"
                    />
                    <span className="text-sm text-stone-600">Keep me logged in</span>
                  </label>
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-xl bg-promo-orange py-3 text-sm font-bold text-white shadow-md hover:brightness-110 disabled:opacity-60"
                  >
                    Log in
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Restaurant panel */}
          <div
            className={cn(
              'flex w-full flex-none flex-col py-1 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:max-w-xl lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:self-center lg:px-1',
              panel === 'restaurant' ? 'z-20 translate-x-0 opacity-100' : 'pointer-events-none absolute inset-x-0 top-0 z-0 px-5 opacity-0 lg:px-12 translate-x-10',
            )}
            aria-hidden={panel !== 'restaurant'}
          >
            <h2 className="text-center text-xl font-extrabold text-ink-dark lg:text-2xl">Restaurant account</h2>
            <p className="mt-1 text-center text-sm text-stone-500">Partner signup or business login</p>
            <div className="mx-auto mt-3 w-full max-w-md shrink-0">
              <TabSwitch value={restaurantTab} onChange={(t) => { setRestaurantTab(t); setError(''); }} accent="green" />
            </div>
            <p className="mx-auto mt-3 max-w-md text-center text-xs text-stone-500">
              Quick signup covers essentials. Full details?{' '}
              <Link to="/register/restaurant" className="font-semibold text-fresh-green underline">
                Complete registration
              </Link>
            </p>
            <div
              className={cn(
                'mx-auto mt-3 w-full max-w-md pb-4 lg:min-h-0 lg:flex-1 lg:pb-2',
                restaurantTab === 'signup' ? 'overflow-y-auto pr-1 lg:overflow-y-auto' : 'lg:overflow-hidden',
              )}
            >
              {error ? (
                <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
              ) : null}
              {restaurantTab === 'signup' ? (
                <form onSubmit={onRestaurantSignup} className="space-y-3">
                  <MintFieldRow compact id="hub-r-name" label="Owner name" valid={rReg.name.trim().length >= 2}>
                    <input
                      id="hub-r-name"
                      className={mintInputClassCompact}
                      value={rReg.name}
                      onChange={(e) => setRReg((s) => ({ ...s, name: e.target.value }))}
                      required
                      autoComplete="name"
                    />
                  </MintFieldRow>
                  <MintFieldRow compact id="hub-r-email" label="Business email" valid={emailOk(rReg.email)}>
                    <input
                      id="hub-r-email"
                      type="email"
                      className={mintInputClassCompact}
                      value={rReg.email}
                      onChange={(e) => setRReg((s) => ({ ...s, email: e.target.value }))}
                      required
                      autoComplete="email"
                    />
                  </MintFieldRow>
                  <MintFieldRow compact id="hub-r-pass" label="Password" valid={rReg.password.length >= 6}>
                    <input
                      id="hub-r-pass"
                      type="password"
                      className={mintInputClassCompact}
                      value={rReg.password}
                      onChange={(e) => setRReg((s) => ({ ...s, password: e.target.value }))}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </MintFieldRow>
                  <MintFieldRow compact id="hub-r-rest" label="Restaurant name" valid={rReg.restaurantName.trim().length >= 2}>
                    <input
                      id="hub-r-rest"
                      className={mintInputClassCompact}
                      value={rReg.restaurantName}
                      onChange={(e) => setRReg((s) => ({ ...s, restaurantName: e.target.value }))}
                      required
                      autoComplete="organization"
                    />
                  </MintFieldRow>
                  <MintFieldRow compact id="hub-r-desc" label="Description" valid={rReg.description.trim().length >= 10}>
                    <textarea
                      id="hub-r-desc"
                      className={mintInputClassCompact}
                      value={rReg.description}
                      onChange={(e) => setRReg((s) => ({ ...s, description: e.target.value }))}
                      required
                      rows={2}
                    />
                  </MintFieldRow>
                  <MintFieldRow compact id="hub-r-address" label="Address" valid={rReg.address.trim().length >= 6}>
                    <input
                      id="hub-r-address"
                      className={mintInputClassCompact}
                      value={rReg.address}
                      onChange={(e) => setRReg((s) => ({ ...s, address: e.target.value }))}
                      required
                      autoComplete="street-address"
                    />
                  </MintFieldRow>
                  <MintFieldRow compact id="hub-r-city" label="City / area" valid={rReg.city.trim().length >= 2}>
                    <input
                      id="hub-r-city"
                      className={mintInputClassCompact}
                      value={rReg.city}
                      onChange={(e) => setRReg((s) => ({ ...s, city: e.target.value }))}
                      required
                      autoComplete="address-level2"
                      placeholder="e.g. Downtown, Gulberg"
                    />
                  </MintFieldRow>
                  <MintFieldRow compact id="hub-r-phone" label="Phone" valid={rReg.phone.trim().length >= 7}>
                    <input
                      id="hub-r-phone"
                      type="tel"
                      className={mintInputClassCompact}
                      value={rReg.phone}
                      onChange={(e) => setRReg((s) => ({ ...s, phone: e.target.value }))}
                      required
                      autoComplete="tel"
                    />
                  </MintFieldRow>
                  <div className="space-y-2 rounded-xl border border-stone-200 bg-white/70 p-3">
                    <label className="text-sm font-semibold text-stone-700" htmlFor="hub-r-logo-file">
                      Business logo
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-lg border border-stone-200 bg-white p-1">
                        <img
                          src={restaurantLogoPreview || rReg.imageUrl || LOGO_SRC}
                          alt="Business logo preview"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <input
                        id="hub-r-logo-file"
                        type="file"
                        accept="image/*"
                        className="w-full text-xs text-stone-600 file:mr-2 file:rounded-md file:border-0 file:bg-fresh-green/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-fresh-green"
                        onChange={(e) => onRestaurantLogoFileChange(e.target.files?.[0] ?? null)}
                      />
                    </div>
                    <input
                      type="url"
                      placeholder="Or paste business logo URL"
                      className={mintInputClassCompact}
                      value={rReg.imageUrl}
                      onChange={(e) => {
                        setRestaurantLogoPreview('');
                        setRReg((s) => ({ ...s, imageUrl: e.target.value }));
                      }}
                    />
                  </div>
                  <fieldset className="space-y-2 rounded-xl border border-stone-200 bg-white/70 p-3">
                    <legend className="px-1 text-sm font-semibold text-stone-700">Cuisine options</legend>
                    <div className="flex flex-wrap gap-2">
                      {CUISINE_OPTIONS.map((cuisine) => {
                        const isChecked = rReg.cuisineSelections.includes(cuisine);
                        return (
                          <label
                            key={cuisine}
                            className={cn(
                              'inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                              isChecked
                                ? 'border-fresh-green bg-fresh-green/10 text-fresh-green'
                                : 'border-stone-300 text-stone-600 hover:border-fresh-green/50',
                            )}
                          >
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5 rounded border-stone-300 text-fresh-green"
                              checked={isChecked}
                              onChange={(e) =>
                                setRReg((prev) => ({
                                  ...prev,
                                  cuisineSelections: e.target.checked
                                    ? [...prev.cuisineSelections, cuisine]
                                    : prev.cuisineSelections.filter((item) => item !== cuisine),
                                }))
                              }
                            />
                            {cuisine}
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-xs text-stone-500">Select at least one cuisine.</p>
                  </fieldset>
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-xl bg-fresh-green py-3 text-sm font-bold text-white shadow-md hover:bg-brand-greenHover disabled:opacity-60"
                  >
                    Create restaurant account
                  </button>
                </form>
              ) : (
                <form onSubmit={onRestaurantLogin} className="space-y-3">
                  <MintFieldRow compact id="hub-rl-email" label="Email" valid={emailOk(rLogin.email)}>
                    <input
                      id="hub-rl-email"
                      type="email"
                      className={mintInputClassCompact}
                      value={rLogin.email}
                      onChange={(e) => setRLogin((s) => ({ ...s, email: e.target.value }))}
                      required
                      autoComplete="email"
                    />
                  </MintFieldRow>
                  <MintFieldRow compact id="hub-rl-pass" label="Password" valid={rLogin.password.length >= 1}>
                    <input
                      id="hub-rl-pass"
                      type="password"
                      className={mintInputClassCompact}
                      value={rLogin.password}
                      onChange={(e) => setRLogin((s) => ({ ...s, password: e.target.value }))}
                      required
                      autoComplete="current-password"
                    />
                  </MintFieldRow>
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-xl bg-fresh-green py-3 text-sm font-bold text-white shadow-md hover:bg-brand-greenHover disabled:opacity-60"
                  >
                    Log in
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
