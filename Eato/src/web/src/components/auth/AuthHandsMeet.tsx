/** Decorative “high-five” pair — animates inward when `celebrate` is true (signup / login success). */
export function AuthHandsMeet({ celebrate, className = '' }: { celebrate: boolean; className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-0 sm:gap-1 ${className}`} aria-hidden>
      <div
        className={[
          'flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white shadow-sm transition-[transform] duration-[780ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform',
          celebrate ? 'translate-x-5 sm:translate-x-9' : '-translate-x-3 sm:-translate-x-6',
        ].join(' ')}
      >
        <span className="pointer-events-none text-[1.85rem] leading-none drop-shadow-sm">🖐</span>
      </div>
      <span
        className={[
          'pointer-events-none text-[1.85rem] leading-none drop-shadow-sm transition-[transform] duration-[780ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform',
          celebrate ? '-translate-x-5 sm:-translate-x-9' : 'translate-x-3 sm:translate-x-6',
        ].join(' ')}
      >
        🖐
      </span>
    </div>
  );
}
