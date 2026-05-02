import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function CustomerCartPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { restaurantId, restaurantName, lines, subtotal, itemCount, setQuantity, removeLine } = useCart();

  if (!restaurantId || itemCount === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-ink-dark">Your cart is empty</h1>
        <p className="mt-3 text-stone-600">Add dishes from a restaurant menu, then review your order here.</p>
        <Link
          to="/restaurants"
          className="mt-8 inline-flex rounded-lg bg-fresh-green px-6 py-3 text-sm font-bold text-white hover:bg-brand-greenHover"
        >
          Browse restaurants
        </Link>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-4 block w-full text-sm font-semibold text-fresh-green hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const checkoutHref = `/restaurants/${restaurantId}/order`;
  const canCheckout = user?.role === 'customer' || !user;

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-ink-dark">Cart</h1>
      <p className="mt-1 text-sm text-stone-600">
        From <span className="font-semibold text-fresh-green">{restaurantName}</span>
      </p>

      <ul className="mt-6 space-y-3">
        {lines.map((line) => (
          <li
            key={line.menuItemId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {line.imageUrl ? (
                <img src={line.imageUrl} alt="" className="h-12 w-12 rounded-full border border-stone-200 object-cover" />
              ) : (
                <div className="h-12 w-12 rounded-full border border-stone-200 bg-stone-100" />
              )}
              <div className="min-w-0">
                <p className="font-semibold text-stone-900">{line.name}</p>
                <p className="text-sm text-stone-600">${line.price.toFixed(2)} each</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Decrease quantity"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-300 text-lg font-bold hover:bg-stone-50"
                onClick={() => setQuantity(line.menuItemId, line.quantity - 1)}
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-bold">{line.quantity}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-300 text-lg font-bold hover:bg-stone-50"
                onClick={() => setQuantity(line.menuItemId, line.quantity + 1)}
              >
                +
              </button>
            </div>
            <div className="flex w-full items-center justify-between border-t border-stone-100 pt-3 sm:w-auto sm:border-0 sm:pt-0">
              <span className="font-semibold text-fresh-green">${(line.price * line.quantity).toFixed(2)}</span>
              <button
                type="button"
                aria-label={`Remove ${line.name} from cart`}
                className="flex h-4 w-4 ml-2 shrink-0 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-700"
                onClick={() => removeLine(line.menuItemId)}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" />
                </svg>
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-4">
        <div className="flex items-center justify-between text-lg font-bold">
          <span>Subtotal</span>
          <span className="text-fresh-green">${subtotal.toFixed(2)}</span>
        </div>
        <p className="mt-2 text-xs text-stone-500">Taxes and fees may apply at checkout. Payment: COD.</p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          to={`/restaurants/${restaurantId}/menu`}
          className="flex flex-1 items-center justify-center rounded-lg border-2 border-fresh-green py-3 text-center text-sm font-bold text-fresh-green hover:bg-fresh-muted"
        >
          Add more items
        </Link>
        {canCheckout ? (
          <Link
            to={checkoutHref}
            className="flex flex-1 items-center justify-center rounded-lg bg-fresh-green py-3 text-center text-sm font-bold text-white hover:bg-brand-greenHover"
          >
            Proceed to checkout
          </Link>
        ) : (
          <Link
            to="/signup"
            state={{ from: checkoutHref }}
            className="flex flex-1 items-center justify-center rounded-lg bg-promo-orange py-3 text-center text-sm font-bold text-white hover:brightness-110"
          >
            Log in to checkout
          </Link>
        )}
      </div>
    </div>
  );
}

