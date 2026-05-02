import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CustomerLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password, 'customer');
      navigate('/restaurants');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Customer Login</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
        <button type="submit" className="w-full py-2 bg-eato-orange text-white rounded-lg font-medium hover:bg-orange-600">Login</button>
      </form>
      <p className="mt-4 text-stone-600">Don't have an account? <Link to="/register/customer" className="text-eato-orange font-medium">Sign up</Link></p>
    </div>
  );
}
