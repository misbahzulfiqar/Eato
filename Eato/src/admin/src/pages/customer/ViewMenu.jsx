import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { restaurants as restaurantsApi, menu as menuApi } from '../../api';

export default function ViewMenu() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([restaurantsApi.get(id), menuApi.byRestaurant(id)])
      .then(([r, m]) => { setRestaurant(r); setItems(m); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-center py-8">Loading menu...</p>;
  if (error) return <p className="text-red-600 text-center py-4">{error}</p>;
  if (!restaurant) return <p className="text-center py-4">Restaurant not found.</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{restaurant.restaurantName}</h1>
          <p className="text-stone-600">{restaurant.description || restaurant.cuisine}</p>
        </div>
        <Link to={`/restaurants/${id}/order`} className="px-4 py-2 bg-eato-orange text-white rounded-lg font-medium hover:bg-orange-600">Place order</Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.filter(i => i.available).map((item) => (
          <div key={item._id} className="p-4 bg-white border rounded-xl shadow-sm">
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-stone-600 text-sm mt-1">{item.description}</p>
            <p className="text-eato-orange font-semibold mt-2">${item.price?.toFixed(2)}</p>
          </div>
        ))}
      </div>
      {items.filter(i => i.available).length === 0 && <p className="text-stone-500">No menu items available.</p>}
    </div>
  );
}
