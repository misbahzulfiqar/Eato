import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CustomerLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password, 'customer');
      navigate('/restaurants');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h2 className="mb-4 text-2xl font-bold">Customer Login</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border px-4 py-2"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border px-4 py-2"
          required
        />
        <button type="submit" className="w-full rounded-lg bg-eato-orange py-2 font-medium text-white hover:bg-orange-600">
          Login
        </button>
      </form>
      <p className="mt-4 text-stone-600">
        Don&apos;t have an account?{' '}
        <Link to="/register/customer" className="font-medium text-eato-orange">
          Sign up
        </Link>
      </p>
    </div>
  );
}
