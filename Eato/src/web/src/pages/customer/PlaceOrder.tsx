import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { restaurants as restaurantsApi, menu as menuApi, orders as ordersApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { loadPersistedCartLines, useCart, type CartLine } from '../../context/CartContext';
import type { MenuItem, Restaurant } from '../../types/eato';

export default function PlaceOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { syncRestaurantCart, clearCart, restaurantId: ctxRestaurantId, lines: ctxLines } = useCart();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([restaurantsApi.get(id), menuApi.byRestaurant(id)])
      .then(([r, m]) => {
        setRestaurant(r);
        setItems(m.filter((i) => i.available));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !restaurant) return;
    const next = ctxRestaurantId === id ? ctxLines : loadPersistedCartLines(id);
    setCart(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restaurant object identity is unstable; name + id are enough for cart source
  }, [id, restaurant?.restaurantName, ctxRestaurantId, ctxLines]);

  const addToCart = (menuItem: MenuItem) => {
    if (!id || !restaurant) return;
    setCart((prev) => {
      const existing = prev.find((p) => p.menuItemId === menuItem._id);
      const next = existing
        ? prev.map((p) => (p.menuItemId === menuItem._id ? { ...p, quantity: Number(p.quantity || 0) + 1 } : p))
        : [...prev, { menuItemId: menuItem._id, name: menuItem.name, price: menuItem.price, quantity: 1 }];
      syncRestaurantCart(id, restaurant.restaurantName, next);
      return next;
    });
  };

  const updateQty = (menuItemId: string, delta: number) => {
    if (!id || !restaurant) return;
    setCart((prev) => {
      const item = prev.find((p) => p.menuItemId === menuItemId);
      if (!item) return prev;
      const qty = item.quantity + delta;
      const next = qty <= 0 ? prev.filter((p) => p.menuItemId !== menuItemId) : prev.map((p) => (p.menuItemId === menuItemId ? { ...p, quantity: qty } : p));
      syncRestaurantCart(id, restaurant.restaurantName, next);
      return next;
    });
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
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
      if (!id) throw new Error('Restaurant not found');
      await ordersApi.place({
        restaurantId: id,
        items: cart.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        deliveryAddress: address.trim(),
        customerPhone: phone.trim(),
      });
      clearCart();
      setCart([]);
      navigate('/customer/orders');
    } catch (err: any) {
      setError(err?.message || 'Order failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-center py-8">Loading...</p>;
  if (error && !restaurant) return <p className="text-red-600 text-center py-4">{error}</p>;
  if (!restaurant) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Place order — {restaurant.restaurantName}</h1>
      <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-6">Payment: Cash on Delivery (COD) only.</p>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold text-lg mb-3">Menu</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item._id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                <div>
                  <span className="font-medium">{item.name}</span>
                  <span className="text-stone-600 text-sm ml-2">${item.price.toFixed(2)}</span>
                </div>
                <button type="button" onClick={() => addToCart(item)} className="px-3 py-1 bg-eato-orange text-white rounded text-sm hover:bg-orange-600">
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-3">Your order</h2>
          {cart.length === 0 ? (
            <p className="text-stone-500">Cart is empty. Add items from the menu.</p>
          ) : (
            <>
              <ul className="space-y-2 mb-4">
                {cart.map((i) => (
                  <li key={i.menuItemId} className="flex items-center justify-between">
                    <span>
                      {i.name} × {i.quantity}
                    </span>
                    <span className="flex items-center gap-2">
                      <button type="button" onClick={() => updateQty(i.menuItemId, -1)} className="w-7 h-7 rounded border">
                        −
                      </button>
                      <button type="button" onClick={() => updateQty(i.menuItemId, 1)} className="w-7 h-7 rounded border">
                        +
                      </button>
                      ${(i.price * i.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="font-semibold">Total: ${total.toFixed(2)}</p>

              <form onSubmit={handlePlaceOrder} className="mt-4 space-y-3">
                {error ? <p className="text-red-600 text-sm">{error}</p> : null}
                <input type="text" placeholder="Delivery address *" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
                <input type="tel" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
                <button type="submit" disabled={submitting} className="w-full py-2 bg-eato-orange text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50">
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

