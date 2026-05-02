import { useEffect, useState, type FormEvent } from 'react';
import { auth as authApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import type { ApiUserBase, Customer } from '../../types/eato';

export default function CustomerProfile() {
  const { user, refreshUser } = useAuth();

  const [form, setForm] = useState<{ name: string; email: string; phone: string; address: string }>({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    setForm({
      name: (user as ApiUserBase).name || '',
      email: (user as ApiUserBase).email || '',
      phone: (user as ApiUserBase).phone || '',
      address: (user as ApiUserBase).address || '',
    });
    setLoading(false);
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await authApi.updateProfile({
        name: form.name,
        email: form.email.trim(),
        phone: form.phone,
        address: form.address,
      });

      setForm({
        name: (updated as Customer).name || '',
        email: (updated as Customer).email || '',
        phone: (updated as Customer).phone || '',
        address: (updated as Customer).address || '',
      });
      await refreshUser();
      setMessage('Profile updated.');
    } catch (err: any) {
      setError(err?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center py-8">Loading profile...</p>;

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="mt-1 text-sm text-stone-600">Update your contact details for faster delivery.</p>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        {error ? <p className="mb-4 text-red-600">{error}</p> : null}
        {message ? <p className="mb-4 text-green-700 font-semibold">{message}</p> : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-stone-700">Full name</label>
            <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} className="w-full rounded-lg border bg-white px-3 py-2 text-sm" required />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-stone-700" htmlFor="customer-email">
              Email
            </label>
            <input
              id="customer-email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-stone-700">Phone</label>
            <input value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} className="w-full rounded-lg border bg-white px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-stone-700">Delivery address</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
              rows={3}
              className="w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm"
            />
          </div>

          <button type="submit" disabled={saving} className="w-full rounded-lg bg-fresh-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-greenHover disabled:opacity-60">
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

