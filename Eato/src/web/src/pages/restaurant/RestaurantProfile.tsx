import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { auth as authApi, restaurants as restaurantsApi } from '../../api';
import type { Restaurant } from '../../types/eato';

const LOGO_SRC = '/LOGO.png';
const CUISINE_OPTIONS = ['Pakistani', 'Indian', 'Chinese', 'Italian', 'Fast Food', 'BBQ', 'Desserts', 'Seafood'];

function parseCuisines(cuisine?: string) {
  if (!cuisine) return [];
  return cuisine
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function RestaurantProfile() {
  const { user, refreshUser } = useAuth();

  const [profile, setProfile] = useState<Restaurant | null>(null);
  const [form, setForm] = useState({
    ownerName: '',
    email: '',
    restaurantName: '',
    description: '',
    address: '',
    city: '',
    phone: '',
    imageUrl: '',
    cuisineSelections: [] as string[],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    authApi
      .me()
      .then((u) => setProfile(u as Restaurant))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (profile) {
      setForm({
        ownerName: profile.name || '',
        email: profile.email || '',
        restaurantName: profile.restaurantName || '',
        description: profile.description || '',
        address: profile.address || '',
        city: profile.city || '',
        phone: profile.phone || '',
        imageUrl: profile.imageUrl || '',
        cuisineSelections: parseCuisines(profile.cuisine),
      });
      setLogoPreview(profile.imageUrl || '');
    }
  }, [profile]);

  const handleLogoFileChange = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setLogoPreview(result);
        setForm((f) => ({ ...f, imageUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!form.cuisineSelections.length) {
      setError('Please choose at least one cuisine option.');
      return;
    }
    setSaving(true);
    try {
      const updated = await restaurantsApi.updateProfile({
        name: form.ownerName.trim(),
        email: form.email.trim(),
        restaurantName: form.restaurantName.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        phone: form.phone.trim(),
        imageUrl: form.imageUrl.trim(),
        cuisine: form.cuisineSelections.join(', '),
      });
      setProfile(updated);
      setLogoPreview(updated.imageUrl || '');
      await refreshUser();
      setMessage('Profile updated.');
      setEditOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center py-8">Loading...</p>;
  if (error && !profile) return <p className="text-red-600">{error}</p>;

  const cuisineList = parseCuisines(profile?.cuisine);

  return (
    <div className="mx-auto mt-4 max-w-4xl px-4 pb-8">
      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-2xl border border-stone-200 bg-white p-1">
              <img src={profile?.imageUrl || LOGO_SRC} alt="Restaurant logo" className="h-full w-full object-contain" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-stone-900">{profile?.restaurantName || 'Restaurant Profile'}</h1>
              <p className="text-sm text-stone-600">Owner: {profile?.name || user?.name || 'Not set'}</p>
              <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold capitalize text-amber-700">
                Status: {profile?.status || 'pending'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setError('');
              setMessage('');
              setEditOpen(true);
            }}
            className="rounded-lg bg-fresh-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-greenHover"
          >
            Edit Profile
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:px-6 sm:py-6">
          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Restaurant name</p>
            <p className="mt-1 text-sm font-medium text-stone-900">{profile?.restaurantName || 'Not set'}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Phone</p>
            <p className="mt-1 text-sm font-medium text-stone-900">{profile?.phone || 'Not set'}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Description</p>
            <p className="mt-1 text-sm font-medium text-stone-900">{profile?.description || 'Not set'}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">City / area</p>
            <p className="mt-1 text-sm font-medium text-stone-900">{profile?.city || 'Not set'}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Login email</p>
            <p className="mt-1 text-sm font-medium text-stone-900">{profile?.email || 'Not set'}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Address</p>
            <p className="mt-1 text-sm font-medium text-stone-900">{profile?.address || 'Not set'}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Cuisine</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {cuisineList.length ? (
                cuisineList.map((item) => (
                  <span key={item} className="rounded-full border border-fresh-green/30 bg-fresh-green/10 px-2.5 py-1 text-xs font-semibold text-fresh-green">
                    {item}
                  </span>
                ))
              ) : (
                <p className="text-sm font-medium text-stone-900">Not set</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {message ? <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p> : null}
      {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {editOpen ? (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-stone-900">Edit restaurant profile</h2>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit} className="max-h-[calc(90vh-72px)] space-y-4 overflow-y-auto px-5 py-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700" htmlFor="owner-name">
                  Owner name
                </label>
                <input
                  id="owner-name"
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700" htmlFor="restaurant-login-email">
                  Login email
                </label>
                <input
                  id="restaurant-login-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                  required
                />
                <p className="text-xs text-stone-500">Use this email the next time you sign in.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700" htmlFor="restaurant-name">
                  Restaurant name
                </label>
                <input
                  id="restaurant-name"
                  type="text"
                  value={form.restaurantName}
                  onChange={(e) => setForm((f) => ({ ...f, restaurantName: e.target.value }))}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700" htmlFor="restaurant-description">
                  Description
                </label>
                <textarea
                  id="restaurant-description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                  rows={3}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-stone-700" htmlFor="restaurant-address">
                    Address
                  </label>
                  <input
                    id="restaurant-address"
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-stone-700" htmlFor="restaurant-city">
                    City / area
                  </label>
                  <input
                    id="restaurant-city"
                    type="text"
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    placeholder="Shown in customer location search"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-semibold text-stone-700" htmlFor="restaurant-phone">
                    Phone
                  </label>
                  <input
                    id="restaurant-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm sm:max-w-xs"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2 rounded-xl border border-stone-200 p-3">
                <label className="text-sm font-semibold text-stone-700" htmlFor="business-logo-file">
                  Business logo
                </label>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-lg border border-stone-200 bg-white p-1">
                    <img src={logoPreview || form.imageUrl || LOGO_SRC} alt="Business logo preview" className="h-full w-full object-contain" />
                  </div>
                  <input
                    id="business-logo-file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoFileChange(e.target.files?.[0] ?? null)}
                    className="w-full text-xs text-stone-600 file:mr-2 file:rounded-md file:border-0 file:bg-fresh-green/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-fresh-green"
                  />
                </div>
                <input
                  type="url"
                  placeholder="Or paste logo URL"
                  value={form.imageUrl}
                  onChange={(e) => {
                    setLogoPreview('');
                    setForm((f) => ({ ...f, imageUrl: e.target.value }));
                  }}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                />
              </div>
              <fieldset className="space-y-2 rounded-xl border border-stone-200 p-3">
                <legend className="px-1 text-sm font-semibold text-stone-700">Cuisine options</legend>
                <div className="flex flex-wrap gap-2">
                  {CUISINE_OPTIONS.map((cuisine) => {
                    const selected = form.cuisineSelections.includes(cuisine);
                    return (
                      <label
                        key={cuisine}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          selected ? 'border-fresh-green bg-fresh-green/10 text-fresh-green' : 'border-stone-300 text-stone-600 hover:border-fresh-green/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded border-stone-300 text-fresh-green"
                          checked={selected}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              cuisineSelections: e.target.checked
                                ? [...prev.cuisineSelections, cuisine]
                                : prev.cuisineSelections.filter((item) => item !== cuisine),
                            }))
                          }
                        />
                        {cuisine}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
              <div className="flex justify-end gap-2 border-t border-stone-200 pt-3">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-fresh-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-greenHover disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

