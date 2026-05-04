import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { restaurants as restaurantsApi, menu as menuApi, orders as ordersApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

type MenuItem = {
  _id: string;
  name: string;
  price: number;
  available?: boolean;
};

type Restaurant = { restaurantName?: string };

type CartLine = { menuItemId: string; name: string; price: number; quantity: number };

function errMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Order failed';
}

export default function PlaceOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [address, setAddress] = useState(
    typeof user?.address === 'string' ? user.address : '',
  );
  const [phone, setPhone] = useState(typeof user?.phone === 'string' ? user.phone : '');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    Promise.all([restaurantsApi.get(id), menuApi.byRestaurant(id)])
      .then(([r, m]) => {
        setRestaurant(r as Restaurant);
        setItems((m as MenuItem[]).filter((i) => i.available));
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  }, [id]);

  const addToCart = (menuItem: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.menuItemId === menuItem._id);
      if (existing)
        return prev.map((p) =>
          p.menuItemId === menuItem._id ? { ...p, quantity: p.quantity + 1 } : p,
        );
      return [...prev, { menuItemId: menuItem._id, name: menuItem.name, price: menuItem.price, quantity: 1 }];
    });
  };

  const updateQty = (menuItemId: string, delta: number) => {
    setCart((prev) => {
      const item = prev.find((p) => p.menuItemId === menuItemId);
      if (!item) return prev;
      const qty = item.quantity + delta;
      if (qty <= 0) return prev.filter((p) => p.menuItemId !== menuItemId);
      return prev.map((p) => (p.menuItemId === menuItemId ? { ...p, quantity: qty } : p));
    });
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!address.trim()) {
      setError('Delivery address is required');
      return;
    }
    if (!cart.length) {
      setError('Add at least one item');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await ordersApi.place({
        restaurantId: id,
        items: cart.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        deliveryAddress: address.trim(),
        customerPhone: phone.trim(),
      });
      navigate('/restaurants');
    } catch (err: unknown) {
      setError(errMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!id) return <p className="py-4 text-center">Invalid restaurant.</p>;
  if (loading) return <p className="py-8 text-center">Loading...</p>;
  if (error && !restaurant) return <p className="py-4 text-center text-red-600">{error}</p>;
  if (!restaurant) return null;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold">Place order — {restaurant.restaurantName}</h1>
      <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-amber-700">
        Payment: Cash on Delivery (COD) only.
      </p>
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold">Menu</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item._id} className="flex items-center justify-between rounded-lg border bg-white p-3">
                <div>
                  <span className="font-medium">{item.name}</span>
                  <span className="ml-2 text-sm text-stone-600">${item.price?.toFixed(2)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => addToCart(item)}
                  className="rounded bg-eato-orange px-3 py-1 text-sm text-white hover:bg-orange-600"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold">Your order</h2>
          {cart.length === 0 ? (
            <p className="text-stone-500">Cart is empty. Add items from the menu.</p>
          ) : (
            <>
              <ul className="mb-4 space-y-2">
                {cart.map((i) => (
                  <li key={i.menuItemId} className="flex items-center justify-between">
                    <span>
                      {i.name} × {i.quantity}
                    </span>
                    <span className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQty(i.menuItemId, -1)}
                        className="h-7 w-7 rounded border"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() => updateQty(i.menuItemId, 1)}
                        className="h-7 w-7 rounded border"
                      >
                        +
                      </button>
                      ${(i.price * i.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="font-semibold">Total: ${total.toFixed(2)}</p>
              <form onSubmit={handlePlaceOrder} className="mt-4 space-y-3">
                {error && <p className="text-sm text-red-600">{error}</p>}
                <input
                  type="text"
                  placeholder="Delivery address *"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border px-4 py-2"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border px-4 py-2"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-eato-orange py-2 font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  Place order (COD)
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
