import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="py-12 text-center">
      <h1 className="mb-2 text-4xl font-bold text-eato-dark">Eato</h1>
      <p className="mb-8 text-stone-600">Online food delivery — order from your favorite restaurants.</p>
      <div className="flex flex-wrap justify-center gap-4">
        {!user && (
          <>
            <Link to="/login/customer" className="rounded-lg bg-eato-orange px-6 py-3 font-medium text-white hover:bg-orange-600">
              Customer Login
            </Link>
            <Link to="/register/customer" className="rounded-lg border-2 border-eato-orange px-6 py-3 font-medium text-eato-orange hover:bg-orange-50">
              Customer Sign Up
            </Link>
            <Link to="/login/restaurant" className="rounded-lg bg-stone-700 px-6 py-3 font-medium text-white hover:bg-stone-800">
              Restaurant Login
            </Link>
            <Link to="/register/restaurant" className="rounded-lg border-2 border-stone-700 px-6 py-3 font-medium text-stone-700 hover:bg-stone-100">
              Restaurant Sign Up
            </Link>
            <Link to="/login/admin" className="rounded-lg bg-stone-800 px-6 py-3 font-medium text-white hover:bg-stone-900">
              Admin Login
            </Link>
          </>
        )}
        {user?.role === 'customer' && (
          <Link to="/restaurants" className="rounded-lg bg-eato-orange px-6 py-3 font-medium text-white hover:bg-orange-600">
            Browse Restaurants
          </Link>
        )}
        {user?.role === 'restaurant' && (
          <Link to="/restaurant/orders" className="rounded-lg bg-eato-orange px-6 py-3 font-medium text-white hover:bg-orange-600">
            View Orders
          </Link>
        )}
        {user?.role === 'admin' && (
          <Link to="/admin" className="rounded-lg bg-eato-orange px-6 py-3 font-medium text-white hover:bg-orange-600">
            Admin Dashboard
          </Link>
        )}
      </div>
    </div>
  );
}
