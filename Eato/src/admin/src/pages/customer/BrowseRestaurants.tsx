import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { restaurants as restaurantsApi } from '../../api';

type RestaurantListItem = { _id: string; restaurantName?: string; cuisine?: string; description?: string };

export default function BrowseRestaurants() {
  const [list, setList] = useState<RestaurantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    restaurantsApi
      .list()
      .then((data) => setList(Array.isArray(data) ? (data as RestaurantListItem[]) : []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="py-8 text-center">Loading restaurants...</p>;
  if (error) return <p className="py-4 text-center text-red-600">{error}</p>;
  if (!list.length) return <p className="py-8 text-center text-stone-600">No restaurants yet. Admin must approve restaurants.</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Browse Restaurants</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((r) => (
          <Link key={r._id} to={`/restaurants/${r._id}/menu`} className="block rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md">
            <h3 className="text-lg font-semibold">{r.restaurantName}</h3>
            <p className="mt-1 text-sm text-stone-600">{r.cuisine || 'Various'}</p>
            <p className="mt-1 line-clamp-2 text-sm text-stone-500">{r.description || 'No description'}</p>
            <span className="mt-3 inline-block font-medium text-eato-orange">View menu →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
