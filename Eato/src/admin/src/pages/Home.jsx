import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold text-eato-dark mb-2">Eato</h1>
      <p className="text-stone-600 mb-8">Online food delivery — order from your favorite restaurants.</p>
      <div className="flex flex-wrap justify-center gap-4">
        {!user && (
          <>
            <Link to="/login/customer" className="px-6 py-3 bg-eato-orange text-white rounded-lg font-medium hover:bg-orange-600">Customer Login</Link>
            <Link to="/register/customer" className="px-6 py-3 border-2 border-eato-orange text-eato-orange rounded-lg font-medium hover:bg-orange-50">Customer Sign Up</Link>
            <Link to="/login/restaurant" className="px-6 py-3 bg-stone-700 text-white rounded-lg font-medium hover:bg-stone-800">Restaurant Login</Link>
            <Link to="/register/restaurant" className="px-6 py-3 border-2 border-stone-700 text-stone-700 rounded-lg font-medium hover:bg-stone-100">Restaurant Sign Up</Link>
            <Link to="/login/admin" className="px-6 py-3 bg-stone-800 text-white rounded-lg font-medium hover:bg-stone-900">Admin Login</Link>
          </>
        )}
        {user?.role === 'customer' && <Link to="/restaurants" className="px-6 py-3 bg-eato-orange text-white rounded-lg font-medium hover:bg-orange-600">Browse Restaurants</Link>}
        {user?.role === 'restaurant' && <Link to="/restaurant/orders" className="px-6 py-3 bg-eato-orange text-white rounded-lg font-medium hover:bg-orange-600">View Orders</Link>}
        {user?.role === 'admin' && <Link to="/admin" className="px-6 py-3 bg-eato-orange text-white rounded-lg font-medium hover:bg-orange-600">Admin Dashboard</Link>}
      </div>
    </div>
  );
}
