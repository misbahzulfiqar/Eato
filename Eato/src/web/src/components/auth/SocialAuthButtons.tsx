function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 11v3h4.2c-.18 1.17-1.36 3.45-4.2 3.45-2.52 0-4.58-2.05-4.58-4.58s2.06-4.58 4.58-4.58c1.44 0 2.4.6 2.95 1.12l2-2C16.88 4.6 14.74 3.5 12 3.5 7.86 3.5 4.5 6.86 4.5 11s3.36 7.5 7.5 7.5c4.35 0 7.24-3.05 7.24-7.35 0-.5-.06-.87-.13-1.24H12z" />
      <path fill="#34A853" d="M4.27 14.13l2.48 1.82C7.74 17.18 9.68 18.5 12 18.5c2.5 0 4.6-.98 6.14-2.64l-2.36-1.82C14.8 15.49 13.47 16 12 16c-1.87 0-3.47-1.22-4.03-2.9z" />
      <path fill="#FBBC05" d="M9.97 9.78l-.2 1.37.76.56 2.47-1.8C12.62 9.4 11.86 9.1 11 9.1c-1.56 0-2.9.98-3.37 2.34z" />
      <path fill="#4285F4" d="M12 4.5c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 1.47 15.04.5 12 .5 7.86.5 4.5 3.86 4.5 8h3.73c0-2.37 1.76-4 3.77-4z" />
    </svg>
  );
}

function AppleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

type Props = {
  onGoogle: () => void;
  onApple: () => void;
};

export function SocialAuthButtons({ onGoogle, onApple }: Props) {
  const btn =
    'flex flex-1 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-stone-400 hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-fresh-green/40';

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button type="button" className={btn} onClick={onGoogle}>
        <GoogleMark className="h-5 w-5 shrink-0" />
        <span className="min-w-0 text-left">
          <span className="hidden sm:inline">Log in with </span>
          <span className="sm:hidden">Continue with </span>
          Google
        </span>
      </button>
      <button type="button" className={btn} onClick={onApple}>
        <AppleMark className="h-5 w-5 shrink-0 text-stone-900" />
        <span className="min-w-0 text-left">
          <span className="hidden sm:inline">Log in with </span>
          <span className="sm:hidden">Continue with </span>
          Apple
        </span>
      </button>
    </div>
  );
}
