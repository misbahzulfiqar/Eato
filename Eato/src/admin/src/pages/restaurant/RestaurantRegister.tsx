import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../api';
import type { AuthUser } from '../../context/AuthContext';
import { useAuth } from '../../context/AuthContext';

type RegForm = {
  name: string;
  email: string;
  password: string;
  restaurantName: string;
  description: string;
  address: string;
  phone: string;
  cuisine: string;
};

function errMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Registration failed';
}

export default function RestaurantRegister() {
  const navigate = useNavigate();
  const { setUserFromRegister } = useAuth();
  const [form, setForm] = useState<RegForm>({
    name: '',
    email: '',
    password: '',
    restaurantName: '',
    description: '',
    address: '',
    phone: '',
    cuisine: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { user, token } = (await auth.registerRestaurant(form)) as { user: AuthUser; token: string };
      setUserFromRegister(user, token);
      navigate('/restaurant/profile');
    } catch (err: unknown) {
      setError(errMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h2 className="mb-4 text-2xl font-bold">Restaurant Registration</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <input
          type="text"
          placeholder="Owner name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full rounded-lg border px-4 py-2"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="w-full rounded-lg border px-4 py-2"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          className="w-full rounded-lg border px-4 py-2"
          required
          minLength={6}
        />
        <input
          type="text"
          placeholder="Restaurant name"
          value={form.restaurantName}
          onChange={(e) => setForm((f) => ({ ...f, restaurantName: e.target.value }))}
          className="w-full rounded-lg border px-4 py-2"
          required
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="w-full rounded-lg border px-4 py-2"
          rows={2}
        />
        <input
          type="text"
          placeholder="Address"
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          className="w-full rounded-lg border px-4 py-2"
        />
        <input
          type="tel"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="w-full rounded-lg border px-4 py-2"
        />
        <input
          type="text"
          placeholder="Cuisine"
          value={form.cuisine}
          onChange={(e) => setForm((f) => ({ ...f, cuisine: e.target.value }))}
          className="w-full rounded-lg border px-4 py-2"
        />
        <button type="submit" className="w-full rounded-lg bg-eato-orange py-2 font-medium text-white hover:bg-orange-600">
          Register restaurant
        </button>
      </form>
      <p className="mt-4 text-stone-600">
        Already have an account?{' '}
        <Link to="/login/restaurant" className="font-medium text-eato-orange">
          Login
        </Link>
      </p>
    </div>
  );
}
