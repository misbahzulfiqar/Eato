export type FooterShopLink = { label: string; to?: string; highlight?: boolean };
export type FooterUsefulLink = { label: string; href: string };

export const FOOTER_SHOP_LINKS: FooterShopLink[] = [
  { label: 'Fruits & Vegetables', to: '/shop/fruits' },
  { label: 'Organic Meat'},
  { label: 'Dairy & Eggs', to: '/shop/dairy' },
  { label: 'Pantry Staples' },
  { label: 'Beverages', to: '/shop/beverages' },
  { label: 'Bakery', to: '/shop/bakery' },
  { label: 'Weekly deals' },
];

export const FOOTER_USEFUL_LINKS: FooterUsefulLink[] = [
  { label: 'About Us', href: '/pages#about' },
  { label: 'Shop', href: '/#shop-sections' },
  { label: 'Restaurants', href: '/pages#restaurants' },
  { label: 'Blog', href: '/blog' },
  { label: "FAQ's", href: '/pages#faq' },
  { label: 'Privacy Policy', href: '/pages#privacy' },
];


