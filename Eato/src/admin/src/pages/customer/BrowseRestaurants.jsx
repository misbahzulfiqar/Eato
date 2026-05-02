import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { restaurants as restaurantsApi } from '../../api';

export default function BrowseRestaurants() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    restaurantsApi.list().then(setList).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center py-8">Loading restaurants...</p>;
  if (error) return <p className="text-red-600 text-center py-4">{error}</p>;
  if (!list.length) return <p className="text-center py-8 text-stone-600">No restaurants yet. Admin must approve restaurants.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Browse Restaurants</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((r) => (
          <Link key={r._id} to={`/restaurants/${r._id}/menu`} className="block p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition">
            <h3 className="font-semibold text-lg">{r.restaurantName}</h3>
            <p className="text-stone-600 text-sm mt-1">{r.cuisine || 'Various'}</p>
            <p className="text-stone-500 text-sm mt-1 line-clamp-2">{r.description || 'No description'}</p>
            <span className="inline-block mt-3 text-eato-orange font-medium">View menu →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
