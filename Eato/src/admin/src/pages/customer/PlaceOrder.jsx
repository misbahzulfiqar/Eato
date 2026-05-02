import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { restaurants as restaurantsApi, menu as menuApi, orders as ordersApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function PlaceOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([restaurantsApi.get(id), menuApi.byRestaurant(id)])
      .then(([r, m]) => { setRestaurant(r); setItems(m.filter(i => i.available)); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const addToCart = (menuItem) => {
    setCart(prev => {
      const existing = prev.find(p => p.menuItemId === menuItem._id);
      if (existing) return prev.map(p => p.menuItemId === menuItem._id ? { ...p, quantity: p.quantity + 1 } : p);
      return [...prev, { menuItemId: menuItem._id, name: menuItem.name, price: menuItem.price, quantity: 1 }];
    });
  };

  const updateQty = (menuItemId, delta) => {
    setCart(prev => {
      const item = prev.find(p => p.menuItemId === menuItemId);
      if (!item) return prev;
      const qty = item.quantity + delta;
      if (qty <= 0) return prev.filter(p => p.menuItemId !== menuItemId);
      return prev.map(p => p.menuItemId === menuItemId ? { ...p, quantity: qty } : p);
    });
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!address.trim()) { setError('Delivery address is required'); return; }
    if (!cart.length) { setError('Add at least one item'); return; }
    setError('');
    setSubmitting(true);
    try {
      await ordersApi.place({
        restaurantId: id,
        items: cart.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        deliveryAddress: address.trim(),
        customerPhone: phone.trim(),
      });
      navigate('/restaurants');
    } catch (err) {
      setError(err.message || 'Order failed');
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
                  <span className="text-stone-600 text-sm ml-2">${item.price?.toFixed(2)}</span>
                </div>
                <button type="button" onClick={() => addToCart(item)} className="px-3 py-1 bg-eato-orange text-white rounded text-sm hover:bg-orange-600">Add</button>
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
                    <span>{i.name} × {i.quantity}</span>
                    <span className="flex items-center gap-2">
                      <button type="button" onClick={() => updateQty(i.menuItemId, -1)} className="w-7 h-7 rounded border">−</button>
                      <button type="button" onClick={() => updateQty(i.menuItemId, 1)} className="w-7 h-7 rounded border">+</button>
                      ${(i.price * i.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="font-semibold">Total: ${total.toFixed(2)}</p>
              <form onSubmit={handlePlaceOrder} className="mt-4 space-y-3">
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <input type="text" placeholder="Delivery address *" value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
                <input type="tel" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
                <button type="submit" disabled={submitting} className="w-full py-2 bg-eato-orange text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50">Place order (COD)</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
