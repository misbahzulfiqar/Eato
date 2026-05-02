/**
 * Eato design tokens (single source of truth for Tailwind).
 *
 * Backgrounds:  bg-surface-canvas | bg-surface-muted | bg-brand-* | bg-promo-* | bg-footer-accent
 * Text:         text-brand-green | text-brand-lime | text-ink-dark | text-promo-* | text-footer-accent (#82b440)
 * Legacy:       fresh.* and eato.* mirror brand/accent for existing class names.
 */

export const tokens = {
  surface: {
    /** Page canvas — neutral off-white (replaces warm cream) */
    canvas: '#f5f5f3',
    /** Subtle section bands */
    muted: '#f7f6f3',
  },                           
  brand: {
    /** Primary forest green — nav, headings, primary actions */
    green: '#1e4d2b',
    /** Darker green — hovers on primary buttons */
    greenHover: '#163d24',
    /** Secondary green — promo tiles, accents */
    greenSoft: '#2d5a3d',
    /** Accent lime — links, badges, focus rings */
    lime: '#8bc34a',
    /** Light gray-green product section alt */
    muted: '#f5f6f4',
    /** Newsletter / soft blue panel */
    sky: '#e3f2fd',
  },
  promo: {
    yellow: '#f5d547',
    orange: '#ff8c28',
    teal: '#7ec8b8',
  },
  accent: {
    /** App-wide CTA orange (login, restaurant tools) */
    orange: '#f97316',
  },
  ink: {
    /** Near-black for chrome / high contrast */
    dark: '#1c1917',
    /** Warm highlight (legacy eato cream) */
    butter: '#fef3c7',
  },
  footer: {
    /** Newsletter + footer — bright lime (visible on white + on dark green footer) */
    accent: '#82b440',
    /** Deeper green for gradients / contrast with accent */
    deep: '#5F962E',
  },
};

/** Tailwind `theme.extend.colors` shape */
export const colors = {
  /** shadcn tokens — pair with CSS vars in index.css (:root / .dark) */
  border: 'var(--border)',
  ring: 'var(--ring)',
  background: 'var(--background)',
  foreground: 'var(--foreground)',
  surface: tokens.surface,
  brand: tokens.brand,
  promo: tokens.promo,
  accent: tokens.accent,
  ink: tokens.ink,
  footer: tokens.footer,
  // Legacy aliases (keep existing class names working)
  eato: {
    orange: tokens.accent.orange,
    dark: tokens.ink.dark,
    cream: tokens.ink.butter,
  },
  fresh: {
    green: tokens.brand.green,
    lime: tokens.brand.lime,
    muted: tokens.brand.muted,
    sky: tokens.brand.sky,
  },
};
