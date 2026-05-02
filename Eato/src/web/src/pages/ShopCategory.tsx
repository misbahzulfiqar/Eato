import { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import { buildCategoryProducts, getCategoryBySlug, SHOP_NAV_CATEGORIES, shopPath, shopProductPath } from '../data/shopNav';

export default function ShopCategory() {
  const { categorySlug } = useParams();
  const { user } = useAuth();
  const shopHref = user?.role === 'customer' ? '/restaurants' : shopPath(SHOP_NAV_CATEGORIES[0].slug);

  const category = getCategoryBySlug(categorySlug as string);
  const products = useMemo(() => (category ? buildCategoryProducts(category.slug) : []), [category]);

  if (!category) {
    return <Navigate to={shopPath(SHOP_NAV_CATEGORIES[0].slug)} replace />;
  }

  return (
    <div className="bg-surface-canvas font-sans text-stone-800">
      <section className="py-6 md:py-8 lg:py-10">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm text-stone-500">
                <Link to="/" className="hover:text-fresh-green">
                  Home
                </Link>
                <span className="mx-2 text-stone-400">/</span>
                <span className="text-fresh-green">{category.label}</span>
              </p>
              <h1 className="mt-2 text-2xl font-bold text-fresh-green md:text-3xl">{category.label}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {SHOP_NAV_CATEGORIES.map(({ slug, label }) => (
                <Link
                  key={slug}
                  to={shopPath(slug)}
                  className={`rounded px-2 py-1 text-sm transition-colors ${
                    slug === category.slug ? 'bg-fresh-green font-semibold text-white' : 'text-stone-600 hover:bg-surface-muted hover:text-fresh-green'
                  }`}
                >
                  {label}
                </Link>
              ))}
              <Link to={shopHref} className="whitespace-nowrap text-sm font-semibold text-fresh-lime hover:text-fresh-green">
                Shop All →
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 sm:gap-4 md:gap-8">
            {products.map((p) => (
              <ProductCard
                key={`${category.slug}-${p.slot}`}
                product={p}
                to={shopProductPath(category.slug, p.slot)}
                borderless
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

