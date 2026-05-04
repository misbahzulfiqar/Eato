import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password, 'admin');
      navigate('/admin');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') navigate('/admin', { replace: true });
  }, [user, navigate]);

  return (
    <div
      className="relative h-screen overflow-hidden bg-[#ececf1]"
      style={{
        backgroundImage: 'url("/Screenshot_17.png")',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="mx-auto flex h-screen w-full max-w-3xl flex-col items-center justify-center px-4 py-6">
        <h1 className="text-center text-3xl font-extrabold tracking-tight text-[#1d1c29] sm:text-4xl">Login</h1>
        <p className="mt-3 text-center text-sm font-semibold text-stone-500">
          More than <span className="text-fresh-green">15,000 recipes</span> from around the world!
        </p>

        <div className="mt-8 w-full max-w-sm rounded-sm bg-white px-6 py-7 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

            <input
              type="email"
              placeholder="Enter Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-full border border-stone-200 bg-[#fafafa] px-5 text-sm outline-none focus:border-pink-500"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-full border border-stone-200 bg-[#fafafa] px-5 text-sm outline-none focus:border-pink-500"
              required
            />

            <div className="flex items-center justify-between px-1 text-sm text-stone-500">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-stone-300" />
                Remember me
              </label>
              <button type="button" className="font-medium hover:text-pink-600">
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="mt-1 h-11 w-full rounded-full bg-fresh-green text-sm font-bold tracking-wide text-white transition hover:bg-brand-greenHover"
            >
              LOGIN
            </button>
          </form>

          <div className="my-6 h-px w-full bg-stone-200" />
          <p className="text-center text-sm text-stone-500">Login with</p>

          <div className="mt-5 flex items-center justify-center gap-5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-base font-bold text-[#1877F2]">f</span>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-base font-bold text-[#DB4437]">G+</span>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-base font-bold text-[#1DA1F2]">t</span>
          </div>
        </div>
      </div>
    </div>
  );
}
