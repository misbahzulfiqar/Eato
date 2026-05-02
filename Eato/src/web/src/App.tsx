import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './context/AuthContext';

import Layout from './components/Layout';
import Home from './pages/Home';
import ShopCategory from './pages/ShopCategory';
import ShopProduct from './pages/ShopProduct';

import BrowseRestaurants from './pages/customer/BrowseRestaurants';
import ViewMenu from './pages/customer/ViewMenu';
import MenuItemDetail from './pages/customer/MenuItemDetail';
import PlaceOrder from './pages/customer/PlaceOrder';
import CustomerOrders from './pages/customer/CustomerOrders';
import CustomerProfile from './pages/customer/CustomerProfile';
import CartPage from './pages/customer/CartPage';
import CustomerCartPage from './pages/customer/CustomerCartPage';

import RestaurantProfile from './pages/restaurant/RestaurantProfile';
import RestaurantHome from './pages/restaurant/RestaurantHome';
import MenuManagement from './pages/restaurant/MenuManagement';
import OrderProcessing from './pages/restaurant/OrderProcessing';
import RestaurantReports from './pages/restaurant/RestaurantReports';
import RestaurantDashboard from './pages/restaurant/RestaurantDashboard';
import RestaurantAddItem from './pages/restaurant/RestaurantAddItem';
import RestaurantAllItems from './pages/restaurant/RestaurantAllItems';

import RestaurantLogin from './pages/RestaurantLogin';
import AdminPortalRedirect from './pages/AdminPortalRedirect';
import RestaurantRegister from './pages/restaurant/RestaurantRegister';
import SignupHub from './pages/SignupHub';
import SitePages from './pages/SitePages';
import BlogIndex from './pages/BlogIndex';
import BlogPost from './pages/BlogPost';

type ProtectedProps = {
  children: ReactNode;
  role?: 'customer' | 'restaurant';
};

function Protected({ children, role }: ProtectedProps) {
  const { sessions, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!role) return children;
  const session = sessions[role];
  if (!session) return <Navigate to="/" replace />;
  return children;
}

/** Customers see any menu; restaurants may only preview their own public menu (same id as account). */
function ViewMenuAccess() {
  const { sessions, loading } = useAuth();
  const { id } = useParams();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  const customer = sessions.customer;
  const restaurant = sessions.restaurant;
  if (!customer && !restaurant) return <Navigate to="/signup" replace />;
  if (customer) return <ViewMenu />;
  if (restaurant) {
    const rid = String((restaurant as { _id?: string; id?: string })._id ?? (restaurant as { id?: string }).id ?? '');
    if (id && rid && id === rid) return <ViewMenu />;
    return <Navigate to="/restaurant/menu" replace />;
  }
  return <Navigate to="/" replace />;
}

function ViewMenuItemDetailAccess() {
  const { sessions, loading } = useAuth();
  const { id } = useParams();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  const customer = sessions.customer;
  const restaurant = sessions.restaurant;
  if (!customer && !restaurant) return <Navigate to="/signup" replace />;
  if (customer) return <MenuItemDetail />;
  if (restaurant) {
    const rid = String((restaurant as { _id?: string; id?: string })._id ?? (restaurant as { id?: string }).id ?? '');
    if (id && rid && id === rid) return <MenuItemDetail />;
    return <Navigate to="/restaurant/menu" replace />;
  }
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login/admin" element={<AdminPortalRedirect path="/login/admin" />} />
      <Route path="/admin/*" element={<AdminPortalRedirect path="current" />} />

      <Route path="/signup" element={<SignupHub />} />
      <Route path="/login/customer" element={<Navigate to="/signup" replace />} />
      <Route path="/register/customer" element={<Navigate to="/signup" replace />} />
      <Route path="/" element={<Layout />}>
        {/* Public storefront home — `src/pages/Home.tsx` (not restaurant dashboard) */}
        <Route index element={<Home />} />
        <Route path="shop/:categorySlug/item/:productSlot" element={<ShopProduct />} />
        <Route path="shop/:categorySlug" element={<ShopCategory />} />
        <Route path="pages" element={<SitePages />} />
        <Route path="blog" element={<BlogIndex />} />
        <Route path="blog/:slug" element={<BlogPost />} />
        <Route path="login/restaurant" element={<RestaurantLogin />} />

        <Route path="register/restaurant" element={<RestaurantRegister />} />

        <Route path="restaurants" element={<Protected role="customer"><BrowseRestaurants /></Protected>} />
        <Route path="restaurants/:id/menu/:itemId" element={<ViewMenuItemDetailAccess />} />
        <Route path="restaurants/:id/menu" element={<ViewMenuAccess />} />
        <Route path="restaurants/:id/order" element={<Protected role="customer"><PlaceOrder /></Protected>} />

        <Route path="customer/orders" element={<Protected role="customer"><CustomerOrders /></Protected>} />
        <Route path="customer/profile" element={<Protected role="customer"><CustomerProfile /></Protected>} />
        <Route path="customer/cart" element={<Protected role="customer"><CustomerCartPage /></Protected>} />
        <Route path="cart" element={<Navigate to="/customer/cart" replace />} />

        {/* Restaurant partner home — `src/pages/restaurant/RestaurantHome.tsx` (separate from `/`) */}
        <Route path="restaurant/home" element={<Protected role="restaurant"><RestaurantHome /></Protected>} />
        <Route path="restaurant" element={<Protected role="restaurant"><Navigate to="/restaurant/home" replace /></Protected>} />
        <Route path="restaurant/profile" element={<Protected role="restaurant"><RestaurantProfile /></Protected>} />
        <Route path="restaurant/menu" element={<Protected role="restaurant"><MenuManagement /></Protected>} />
        <Route path="restaurant/orders" element={<Protected role="restaurant"><OrderProcessing /></Protected>} />
        <Route path="restaurant/reports" element={<Protected role="restaurant"><RestaurantReports /></Protected>} />
      </Route>
      {/* Full-screen analytics UI: no SiteHeader / SiteFooter */}
      <Route
        path="/restaurant/dashboard"
        element={
          <Protected role="restaurant">
            <RestaurantDashboard />
          </Protected>
        }
      />
      <Route
        path="/restaurant/items"
        element={
          <Protected role="restaurant">
            <RestaurantAllItems />
          </Protected>
        }
      />
      <Route
        path="/restaurant/items/add"
        element={
          <Protected role="restaurant">
            <RestaurantAddItem />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

