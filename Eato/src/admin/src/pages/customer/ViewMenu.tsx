import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { restaurants as restaurantsApi, menu as menuApi } from '../../api';

type Restaurant = {
  restaurantName?: string;
  description?: string;
  cuisine?: string;
};

type MenuItem = {
  _id: string;
  name: string;
  description?: string;
  price?: number;
  available?: boolean;
};

export default function ViewMenu() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    Promise.all([restaurantsApi.get(id), menuApi.byRestaurant(id)])
      .then(([r, m]) => {
        setRestaurant(r as Restaurant);
        setItems(m as MenuItem[]);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) return <p className="py-4 text-center">Invalid restaurant.</p>;
  if (loading) return <p className="py-8 text-center">Loading menu...</p>;
  if (error) return <p className="py-4 text-center text-red-600">{error}</p>;
  if (!restaurant) return <p className="py-4 text-center">Restaurant not found.</p>;

  const available = items.filter((i) => i.available);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{restaurant.restaurantName}</h1>
          <p className="text-stone-600">{restaurant.description || restaurant.cuisine}</p>
        </div>
        <Link to={`/restaurants/${id}/order`} className="rounded-lg bg-eato-orange px-4 py-2 font-medium text-white hover:bg-orange-600">
          Place order
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {available.map((item) => (
          <div key={item._id} className="rounded-xl border bg-white p-4 shadow-sm">
            <h3 className="font-semibold">{item.name}</h3>
            <p className="mt-1 text-sm text-stone-600">{item.description}</p>
            <p className="mt-2 font-semibold text-eato-orange">${item.price?.toFixed(2)}</p>
          </div>
        ))}
      </div>
      {available.length === 0 && <p className="text-stone-500">No menu items available.</p>}
    </div>
  );
}
