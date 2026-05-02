import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type ShopProduct = {
  name: string;
  cat: string;
  price: number;
  old?: number | null;
  img: string;
  badge?: string | null;
};

export default function ProductCard({
  product,
  to,
  borderless = false,
}: {
  product: ShopProduct;
  to?: string;
  borderless?: boolean;
}) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [product.img]);

  const goToProduct = () => {
    if (to) navigate(to);
  };

  const subtitle = product.badge ? (product.badge === 'NEW' ? 'Hot & Fresh' : product.badge === 'SALE' ? 'Hot & Fresh' : product.cat) : product.cat;

  const cardShell = borderless
    ? 'min-w-0 overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md'
    : 'min-w-0 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md';

  return (
    <div
      className={`${cardShell} ${to ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-fresh-green focus-visible:ring-offset-2' : ''}`}
      onClick={to ? goToProduct : undefined}
      tabIndex={to ? 0 : undefined}
      role={to ? 'button' : undefined}
      aria-label={to ? `View ${product.name}` : undefined}
    >
      <div className="relative h-[160px] sm:h-[170px]">
        {!imageError ? (
          <img
            src={product.img}
            alt=""
            className="absolute inset-0 h-full w-full object-contain p-3"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-stone-100" />
        )}
      </div>

      <div className="p-5 bg-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-md font-semibold text-stone-900">{product.name}</h3>
            <p className="mt-1 text-sm font-semibold text-stone-600">{subtitle}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-md font-semibold text-red-500">${product.price.toFixed(2)}</span>
            {product.old != null ? <div className="text-xs text-stone-400 line-through">${product.old.toFixed(2)}</div> : null}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goToProduct();
            }}
            className="flex-1 rounded-md border border-fresh-green px-4 py-2 text-sm font-semibold text-fresh-green hover:bg-fresh-green hover:text-white"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

