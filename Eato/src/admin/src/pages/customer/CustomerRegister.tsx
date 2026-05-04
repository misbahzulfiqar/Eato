import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../api';
import { useAuth, type AuthUser } from '../../context/AuthContext';

export default function CustomerRegister() {
  const navigate = useNavigate();
  const { setUserFromRegister } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = (await auth.registerCustomer(form)) as { user: AuthUser; token: string };
      const { user, token } = res;
      setUserFromRegister(user, token);
      navigate('/restaurants');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h2 className="mb-4 text-2xl font-bold">Customer Registration</h2>
      <p className="mb-4 text-stone-600">Create your account to order food.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <input
          type="text"
          placeholder="Full name"
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
          type="tel"
          placeholder="Phone (optional)"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="w-full rounded-lg border px-4 py-2"
        />
        <input
          type="text"
          placeholder="Address (optional)"
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          className="w-full rounded-lg border px-4 py-2"
        />
        <button type="submit" className="w-full rounded-lg bg-eato-orange py-2 font-medium text-white hover:bg-orange-600">
          Create account
        </button>
      </form>
      <p className="mt-4 text-stone-600">
        Already have an account?{' '}
        <Link to="/login/customer" className="font-medium text-eato-orange">
          Login
        </Link>
      </p>
    </div>
  );
}
