/** Filter chips + department nav — routes: `/shop/:slug` */
export const SHOP_NAV_CATEGORIES = [
  { slug: 'nuts-seeds', label: 'Nuts & Seeds' },
  { slug: 'oils', label: 'Oils' },
  { slug: 'fruits', label: 'Fruits' },
  { slug: 'dairy', label: 'Dairy' },
  { slug: 'bakery', label: 'Bakery' },
  { slug: 'beverages', label: 'Beverages' },
] as const;

type ShopNavCategory = (typeof SHOP_NAV_CATEGORIES)[number];
export type ShopCategorySlug = ShopNavCategory['slug'];

/**
 * Public image paths from `categoryProductPublicPath` — mostly `{prefix}1.png` … `{prefix}10.png`.
 * Exceptions: nuts use `eato*.png`, bakery uses `backery*.png`, beverage 10 is `beverage10.jfif`.
 */
export const CATEGORY_IMAGE_PREFIX: Record<string, string> = {
  /** No `nuts*.png` in public — reuse hero grid assets eato1…eato10 */
  'nuts-seeds': 'eato',
  oils: 'oil',
  fruits: 'fruit',
  dairy: 'dairy',
  /** Files in public are `backery1.png`…`backery10.png` */
  bakery: 'backery',
  beverages: 'beverage',
};

const PRODUCT_NAMES: Record<string, string[]> = {
  'nuts-seeds': ['Trail Mix', 'Raw Almonds', 'Cashew Pieces', 'Pecan Halves', 'Walnut Hearts', 'Pistachios', 'Hazelnuts', 'Macadamias', 'Sunflower Seeds', 'Pumpkin Seeds'],
  oils: ['Extra Virgin Olive', 'Avocado Oil', 'Coconut Oil', 'Sesame Oil', 'Grapeseed Oil', 'Flax Oil', 'Chili Oil', 'Truffle Oil', 'Canola Cold-Press', 'Walnut Oil'],
  fruits: ['Berry Medley', 'Organic Apples', 'Cara Cara Oranges', 'Honey Mango', 'Rainier Cherries', 'Figs', 'Kiwi Pack', 'Stone Fruit Box', 'Citrus Sampler', 'Melon Duo'],
  dairy: ['Greek Yogurt', 'A2 Milk Quart', 'Sharp Cheddar', 'Butter Roll', 'Cottage Cheese', 'Cream Cheese', 'Mozzarella', 'Feta Block', 'Eggnog', 'Kefir Bottle'],
  bakery: ['Morning Granola', 'Rolled Oats', 'Bran Flakes', 'Muesli Mix', 'Puffed Rice', 'Corn Cereal', 'Seed Bread', 'Sourdough Loaf', 'Croissant Pack', 'Bagel Bundle'],
  beverages: ['Cold Brew', 'Kombucha', 'Sparkling Water', 'Oat Latte', 'Green Juice', 'Smoothie Base', 'Herbal Tea', 'Coconut Water', 'Tonic Pack', 'Root Beer'],
};

const PREFIX = ['Organic', 'Farm', 'Daily', 'Pure', 'Valley', 'Sunrise', 'Golden', 'Fresh', 'Local', 'Wild'];

export function getCategoryBySlug(slug: string): ShopNavCategory | null {
  return SHOP_NAV_CATEGORIES.find((c) => c.slug === slug) ?? null;
}

/** `/oil1.png` … `/dairy10.png` etc. — assets in `public/` */
export function categoryProductPublicPath(slug: string, indexZeroBased: number) {
  const prefix = CATEGORY_IMAGE_PREFIX[slug];
  const n = indexZeroBased + 1;
  if (!prefix) {
    return `https://picsum.photos/seed/eato-${slug}-${indexZeroBased}/400/400`;
  }
  if (slug === 'beverages' && n === 10) {
    return '/beverage10.jfif';
  }
  return `/${prefix}${n}.png`;
}

export function shopPath(slug: string) {
  return `/shop/${slug}`;
}

/** Product detail: slot 1–10 matches image number (e.g. dairy3 → dairy3.png). */
export function shopProductPath(categorySlug: string, slot: number) {
  return `/shop/${categorySlug}/item/${slot}`;
}

export function parseProductSlot(param: string) {
  const n = Number.parseInt(param, 10);
  if (!Number.isFinite(n) || n < 1 || n > 10) return null;
  return n;
}

/** Ten products for a category page — same shape as Home `ProductCard` data. */
export function buildCategoryProducts(slug: string) {
  const meta = getCategoryBySlug(slug);
  if (!meta) return [];
  const names = PRODUCT_NAMES[slug] ?? PRODUCT_NAMES.fruits;
  return Array.from({ length: 10 }, (_, i) => {
    const base = names[i % names.length];
    const name = `${PREFIX[i % PREFIX.length]} ${base}`;
    const price = Math.round((4.29 + i * 1.37 + (slug.length % 3)) * 100) / 100;
    const hasOld = i % 3 === 1;
    const old = hasOld ? Math.round((price + 2 + (i % 4)) * 100) / 100 : null;
    let badge: string | null = null;
    if (i % 5 === 0) badge = 'NEW';
    else if (i % 4 === 2) badge = 'SALE';

    return {
      slot: i + 1,
      name,
      cat: meta.label,
      price,
      old,
      img: categoryProductPublicPath(slug, i),
      badge,
    };
  });
}

export function getCategoryProductBySlot(slug: string, slot: number) {
  const products = buildCategoryProducts(slug);
  return products[slot - 1] ?? null;
}

