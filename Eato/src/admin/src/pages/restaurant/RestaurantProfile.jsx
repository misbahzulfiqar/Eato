import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { auth as authApi, restaurants as restaurantsApi } from '../../api';

export default function RestaurantProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ restaurantName: '', description: '', address: '', phone: '', cuisine: '', imageUrl: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    authApi.me().then(setProfile).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (profile) setForm({
      restaurantName: profile.restaurantName || '',
      description: profile.description || '',
      address: profile.address || '',
      phone: profile.phone || '',
      cuisine: profile.cuisine || '',
      imageUrl: profile.imageUrl || '',
    });
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      await restaurantsApi.updateProfile(form);
      setMessage('Profile updated.');
    } catch (err) {
      setError(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center py-8">Loading...</p>;
  if (error && !profile) return <p className="text-red-600">{error}</p>;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Restaurant Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {message && <p className="text-green-600 text-sm">{message}</p>}
        <input type="text" placeholder="Restaurant name" value={form.restaurantName} onChange={e => setForm(f => ({ ...f, restaurantName: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" required />
        <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" rows={3} />
        <input type="text" placeholder="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" />
        <input type="tel" placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" />
        <input type="text" placeholder="Cuisine" value={form.cuisine} onChange={e => setForm(f => ({ ...f, cuisine: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" />
        <input type="url" placeholder="Image URL" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" />
        <button type="submit" disabled={saving} className="w-full py-2 bg-eato-orange text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50">Save profile</button>
      </form>
    </div>
  );
}
