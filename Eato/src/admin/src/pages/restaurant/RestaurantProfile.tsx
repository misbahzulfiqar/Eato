import { useEffect, useState, type FormEvent } from 'react';
import { auth as authApi, restaurants as restaurantsApi } from '../../api';

type Profile = Record<string, unknown> & {
  restaurantName?: string;
  description?: string;
  address?: string;
  phone?: string;
  cuisine?: string;
  imageUrl?: string;
};

type ProfileForm = {
  restaurantName: string;
  description: string;
  address: string;
  phone: string;
  cuisine: string;
  imageUrl: string;
};

function errMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Update failed';
}

export default function RestaurantProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    restaurantName: '',
    description: '',
    address: '',
    phone: '',
    cuisine: '',
    imageUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    authApi
      .me()
      .then((p) => setProfile(p as Profile))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (profile)
      setForm({
        restaurantName: String(profile.restaurantName ?? ''),
        description: String(profile.description ?? ''),
        address: String(profile.address ?? ''),
        phone: String(profile.phone ?? ''),
        cuisine: String(profile.cuisine ?? ''),
        imageUrl: String(profile.imageUrl ?? ''),
      });
  }, [profile]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      await restaurantsApi.updateProfile(form);
      setMessage('Profile updated.');
    } catch (err: unknown) {
      setError(errMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="py-8 text-center">Loading...</p>;
  if (error && !profile) return <p className="text-red-600">{error}</p>;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-bold">Restaurant Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}
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
          rows={3}
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
        <input
          type="url"
          placeholder="Image URL"
          value={form.imageUrl}
          onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
          className="w-full rounded-lg border px-4 py-2"
        />
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-eato-orange py-2 font-medium text-white hover:bg-orange-600 disabled:opacity-50"
        >
          Save profile
        </button>
      </form>
    </div>
  );
}
