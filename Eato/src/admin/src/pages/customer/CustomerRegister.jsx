import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function CustomerRegister() {
  const navigate = useNavigate();
  const { setUserFromRegister } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { user, token } = await auth.registerCustomer(form);
      setUserFromRegister(user, token);
      navigate('/restaurants');
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Customer Registration</h2>
      <p className="text-stone-600 mb-4">Create your account to order food.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input type="text" placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" required />
        <input type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" required />
        <input type="password" placeholder="Password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" required minLength={6} />
        <input type="tel" placeholder="Phone (optional)" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" />
        <input type="text" placeholder="Address (optional)" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" />
        <button type="submit" className="w-full py-2 bg-eato-orange text-white rounded-lg font-medium hover:bg-orange-600">Create account</button>
      </form>
      <p className="mt-4 text-stone-600">Already have an account? <Link to="/login/customer" className="text-eato-orange font-medium">Login</Link></p>
    </div>
  );
}
