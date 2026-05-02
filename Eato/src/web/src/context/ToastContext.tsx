import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

type ToastContextValue = {
  /** @param variant defaults to `success` for existing call sites */
  showToast: (message: string, variant?: ToastVariant) => void;
};

type ToastState = { id: number; message: string; variant: ToastVariant } | null;

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_UI: Record<
  ToastVariant,
  { shell: string; iconWrap: string; divider: string; closeHover: string; label: string }
> = {
  success: {
    shell: 'border border-emerald-200/90 bg-emerald-50 text-emerald-900 shadow-[0_4px_24px_rgba(6,78,59,0.12)]',
    iconWrap: 'bg-emerald-600 text-white',
    divider: 'bg-emerald-200/90',
    closeHover: 'hover:bg-emerald-100/90',
    label: 'Success',
  },
  error: {
    shell: 'border border-red-200/90 bg-red-50 text-red-900 shadow-[0_4px_24px_rgba(127,29,29,0.12)]',
    iconWrap: 'bg-red-600 text-white',
    divider: 'bg-red-200/90',
    closeHover: 'hover:bg-red-100/90',
    label: 'Error',
  },
  warning: {
    shell: 'border border-amber-200/90 bg-amber-50 text-amber-950 shadow-[0_4px_24px_rgba(120,53,15,0.12)]',
    iconWrap: 'bg-amber-500 text-white',
    divider: 'bg-amber-200/90',
    closeHover: 'hover:bg-amber-100/90',
    label: 'Warning',
  },
  info: {
    shell: 'border border-sky-200/90 bg-sky-50 text-sky-950 shadow-[0_4px_24px_rgba(12,74,110,0.12)]',
    iconWrap: 'bg-sky-600 text-white',
    divider: 'bg-sky-200/90',
    closeHover: 'hover:bg-sky-100/90',
    label: 'Information',
  },
};

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function IconAlert({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  );
}

function IconInfo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function IconCircleX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  );
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  const cls = 'h-[1.1rem] w-[1.1rem] shrink-0';
  switch (variant) {
    case 'success':
      return <IconCheck className={cls} />;
    case 'error':
      return <IconCircleX className={cls} />;
    case 'warning':
      return <IconAlert className={cls} />;
    case 'info':
      return <IconInfo className={cls} />;
    default:
      return <IconCheck className={cls} />;
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast({ id: Date.now(), message, variant });
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const ui = toast ? VARIANT_UI[toast.variant] : VARIANT_UI.success;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-[250px] top-[160px] z-[300] flex w-[min(calc(100vw-2rem),22rem)] justify-end"
      >
        {toast ? (
          <div
            key={toast.id}
            role="status"
            aria-label={ui.label}
            className={`pointer-events-auto flex max-w-full items-center gap-0 rounded-full py-1 pl-2 pr-1 eato-toast-enter ${ui.shell}`}
          >
            <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${ui.iconWrap}`}>
              <ToastIcon variant={toast.variant} />
            </div>
            <p className="min-w-0 flex-1 px-2.5 py-0.5 text-left text-[13px] font-medium leading-snug">{toast.message}</p>
            <div className={`my-1.5 w-px shrink-0 self-stretch ${ui.divider}`} aria-hidden />
            <button
              type="button"
              onClick={dismiss}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${ui.closeHover}`}
              aria-label="Dismiss notification"
            >
              <IconClose className="h-3.5 w-3.5 opacity-80" />
            </button>
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
