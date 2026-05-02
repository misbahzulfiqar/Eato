import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { pushAdminNotification, pushRestaurantNotification } from '../../lib/notifications';

const LOGO_SRC = '/LOGO.png';

export default function RestaurantRegister() {
  const navigate = useNavigate();
  const { setUserFromRegister } = useAuth();
  const [form, setForm] = useState<{
    name: string;
    email: string;
    password: string;
    restaurantName: string;
    description: string;
    address: string;
    city: string;
    phone: string;
    cuisine: string;
    imageUrl: string;
  }>({
    name: '',
    email: '',
    password: '',
    restaurantName: '',
    description: '',
    address: '',
    city: '',
    phone: '',
    cuisine: '',
    imageUrl: '',
  });

  const [error, setError] = useState('');
  const [logoPreview, setLogoPreview] = useState('');

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
    try {
      const { user, token } = await auth.registerRestaurant({ ...(form as any), status: 'pending' });
      setUserFromRegister(user, token);

      const rid = String(user?._id ?? user?.id ?? '');
      pushAdminNotification({
        title: 'New restaurant approval request',
        body: `${user?.restaurantName || user?.name || 'Restaurant'} requested approval. Status: pending.`,
        meta: { restaurantId: user?._id ?? user?.id, email: user?.email, restaurantName: user?.restaurantName, status: user?.status },
      });

      if (rid) {
        pushRestaurantNotification(rid, {
          title: 'Approval request sent',
          body: 'Your restaurant approval request has been sent to admin. Please wait for approval.',
          meta: { kind: 'approval_pending' },
        });
      }

      navigate('/restaurant/home');
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Restaurant Registration</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? <p className="text-red-600 text-sm">{error}</p> : null}

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-xl border bg-white p-1 flex items-center justify-center">
              <img
                src={logoPreview || form.imageUrl || LOGO_SRC}
                alt="Restaurant logo preview"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800">Business logo (optional)</p>
              <p className="text-xs text-stone-600">Upload an image (stored as image URL in this prototype).</p>
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleLogoFileChange(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
        </div>

        <input type="text" placeholder="Owner name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" required />
        <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" required />
        <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" required minLength={6} />
        <input type="text" placeholder="Restaurant name" value={form.restaurantName} onChange={(e) => setForm((f) => ({ ...f, restaurantName: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" required />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" rows={2} />
        <input type="text" placeholder="Address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" />
        <input type="text" placeholder="City / area" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" />
        <input type="tel" placeholder="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" />
        <input type="text" placeholder="Cuisine" value={form.cuisine} onChange={(e) => setForm((f) => ({ ...f, cuisine: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" />
        <input
          type="url"
          placeholder="Logo URL (optional)"
          value={form.imageUrl}
          onChange={(e) => {
            setLogoPreview('');
            setForm((f) => ({ ...f, imageUrl: e.target.value }));
          }}
          className="w-full px-4 py-2 border rounded-lg"
        />

        <button type="submit" className="w-full py-2 bg-eato-orange text-white rounded-lg font-medium hover:bg-orange-600">
          Register restaurant
        </button>
      </form>
      <p className="mt-4 text-stone-600">
        Already have an account?{' '}
        <Link to="/login/restaurant" className="text-eato-orange font-medium">
          Login
        </Link>
      </p>
    </div>
  );
}

