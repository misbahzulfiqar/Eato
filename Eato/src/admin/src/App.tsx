import type { ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import AdminLayout from './components/AdminLayout';

import AdminOverview from './pages/admin/AdminOverview';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminRestaurants from './pages/admin/AdminRestaurants';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCategories from './pages/admin/AdminCategories';
import AdminReviews from './pages/admin/AdminReviews';
import AdminReports from './pages/admin/AdminReports';
import AdminSecurity from './pages/admin/AdminSecurity';

import AdminLogin from './pages/AdminLogin';

function Protected({ children, role }: { children: ReactNode; role?: 'admin' }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login/admin" replace />} />
      <Route path="/login/admin" element={<AdminLogin />} />

      <Route
        path="/admin"
        element={
          <Protected role="admin">
            <AdminLayout />
          </Protected>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="restaurants" element={<AdminRestaurants />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="security" element={<AdminSecurity />} />
      </Route>

      <Route path="*" element={<Navigate to="/login/admin" replace />} />
    </Routes>
  );
}
