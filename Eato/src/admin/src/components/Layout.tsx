import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-eato-dark text-white shadow">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-xl font-bold text-eato-orange">
            Eato
          </Link>
          <nav className="flex items-center gap-4">
            {!user && (
              <>
                <Link to="/login/customer" className="hover:text-eato-orange">
                  Customer
                </Link>
                <Link to="/login/restaurant" className="hover:text-eato-orange">
                  Restaurant
                </Link>
                <Link to="/login/admin" className="hover:text-eato-orange">
                  Admin
                </Link>
              </>
            )}
            {user?.role === 'customer' && (
              <>
                <Link to="/restaurants" className="hover:text-eato-orange">
                  Restaurants
                </Link>
                <button type="button" onClick={logout} className="hover:text-eato-orange">
                  Logout
                </button>
              </>
            )}
            {user?.role === 'restaurant' && (
              <>
                <Link to="/restaurant/profile" className="hover:text-eato-orange">
                  Profile
                </Link>
                <Link to="/restaurant/menu" className="hover:text-eato-orange">
                  Menu
                </Link>
                <Link to="/restaurant/orders" className="hover:text-eato-orange">
                  Orders
                </Link>
                <button type="button" onClick={logout} className="hover:text-eato-orange">
                  Logout
                </button>
              </>
            )}
            {user?.role === 'admin' && (
              <>
                <Link to="/admin" className="hover:text-eato-orange">
                  Dashboard
                </Link>
                <button type="button" onClick={logout} className="hover:text-eato-orange">
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
