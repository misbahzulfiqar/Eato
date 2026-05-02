import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
const LOGO_SRC = '/LOGO.png';

function SocialButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-xs">{label[0]}</span>
      Continue with {label}
    </button>
  );
}

export default function RestaurantLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password, 'restaurant');
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-[calc(100vh-1rem)] bg-surface-canvas px-4 py-10">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-stone-200 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <img src={LOGO_SRC} alt="Eato" className="h-12 w-auto" />
          <h2 className="mt-3 text-2xl font-extrabold text-[#1a4225]">Login</h2>
          <p className="mt-1 text-sm text-stone-600">Restaurant account access</p>
        </div>

        <div className="mt-5 space-y-3">
          <SocialButton label="Google" />
          <SocialButton label="Facebook" />
          <SocialButton label="Twitter" />
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-200" />
          <span className="text-xs font-semibold text-stone-500">or</span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? <p className="text-red-600 text-sm">{error}</p> : null}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm outline-none focus:border-fresh-green focus:ring-2 focus:ring-fresh-green/20"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm outline-none focus:border-fresh-green focus:ring-2 focus:ring-fresh-green/20"
            required
          />

          <button type="submit" className="w-full rounded-lg bg-fresh-green px-4 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-brand-greenHover">
            LOGIN
          </button>

          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-fresh-green">Forgot password?</span>
          </div>
        </form>

        <p className="mt-4 text-center text-sm text-stone-600">
          Don&apos;t have a business account?{' '}
          <Link to="/register/restaurant" className="font-semibold text-fresh-green hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

