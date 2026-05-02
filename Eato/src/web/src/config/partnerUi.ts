/**
 * Restaurant partner dashboard UI tokens (aligned with `theme.js` / Tailwind `fresh.*`, `brand.*`).
 */
import { tokens } from './theme.js';

export const partnerUi = {
  chartPrimary: tokens.brand.green,
  gaugeTrack: tokens.brand.muted,
  donutPalette: [
    tokens.brand.green,
    tokens.brand.greenSoft,
    tokens.brand.lime,
    tokens.footer.deep,
    tokens.footer.accent,
    tokens.promo.teal,
    tokens.brand.greenHover,
    tokens.promo.orange,
  ] as const,
};
