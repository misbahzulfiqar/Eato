import type { ReactNode } from 'react';

function cn(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

const INPUT_MINT =
  'w-full rounded-full border border-stone-200 bg-[#E8F5E9] py-3 pl-4 pr-12 text-stone-900 outline-none transition-[box-shadow,border-color] placeholder:text-stone-500 focus:border-fresh-green focus:ring-2 focus:ring-fresh-green/20';

/** Shorter fields (e.g. signup hub) */
const INPUT_MINT_COMPACT =
  'w-full rounded-full border border-stone-200 bg-[#E8F5E9] py-1.5 pl-3 pr-10 text-sm text-stone-900 outline-none transition-[box-shadow,border-color] placeholder:text-stone-400 focus:border-fresh-green focus:ring-2 focus:ring-fresh-green/20';

export function FieldValidIcon({ show, compact }: { show: boolean; compact?: boolean }) {
  const box = compact ? 'right-2.5 h-6 w-6' : 'right-3 h-7 w-7';
  const svg = compact ? 'h-3 w-3' : 'h-4 w-4';
  if (!show) {
    return <div className={cn('pointer-events-none absolute top-1/2 -translate-y-1/2', box)} aria-hidden />;
  }
  return (
    <div
      className={cn(
        'pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-[#1B5E20] text-white shadow-sm',
        box,
      )}
      aria-hidden
    >
      <svg className={svg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

type MintFieldProps = {
  id: string;
  label: string;
  valid: boolean;
  children: ReactNode;
  /** Smaller label + check badge + tighter inputs */
  compact?: boolean;
};

export function MintFieldRow({ id, label, valid, children, compact }: MintFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className={cn(
          'block font-semibold text-ink-dark',
          compact ? 'mb-1 text-xs' : 'mb-2 text-sm',
        )}
      >
        {label}
      </label>
      <div className="relative">
        {children}
        <FieldValidIcon show={valid} compact={compact} />
      </div>
    </div>
  );
}

export const mintInputClass = INPUT_MINT;
export const mintInputClassCompact = INPUT_MINT_COMPACT;
