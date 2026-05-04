import { useEffect, useState, type FormEvent } from 'react';
import { menu as menuApi } from '../../api';

type MenuRow = {
  _id: string;
  name: string;
  description?: string;
  price?: number;
  category?: string;
};

type MenuForm = { name: string; description: string; price: string; category: string };

function errMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Failed';
}

export default function MenuManagement() {
  const [items, setItems] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<MenuForm>({ name: '', description: '', price: '', category: 'Main' });

  const load = () =>
    menuApi
      .my()
      .then((list) => setItems(list as MenuRow[]))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: '', category: 'Main' });
  };

  const openEdit = (item: MenuRow) => {
    setEditing(item._id);
    setForm({
      name: item.name,
      description: item.description || '',
      price: item.price != null ? String(item.price) : '',
      category: item.category || 'Main',
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await menuApi.update(editing, {
          name: form.name,
          description: form.description,
          price: form.price,
          category: form.category,
        });
      } else {
        await menuApi.add(form);
      }
      setEditing(null);
      setLoading(true);
      await load();
    } catch (err: unknown) {
      setError(errMessage(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    setError('');
    try {
      await menuApi.delete(id);
      setLoading(true);
      await load();
    } catch (err: unknown) {
      setError(errMessage(err));
    }
  };

  if (loading) return <p className="py-8 text-center">Loading menu...</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-lg bg-eato-orange px-4 py-2 font-medium text-white hover:bg-orange-600"
        >
          Add item
        </button>
      </div>
      {error && <p className="mb-4 text-red-600">{error}</p>}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item._id} className="rounded-xl border bg-white p-4 shadow-sm">
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-sm text-stone-600">{item.description}</p>
            <p className="mt-1 font-semibold text-eato-orange">
              ${item.price?.toFixed(2)} — {item.category}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => openEdit(item)}
                className="rounded border px-3 py-1 text-sm hover:bg-stone-100"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(item._id)}
                className="rounded border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {(editing || !items.length) && (
        <div className="max-w-md rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">{editing ? 'Edit item' : 'Add food item'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border px-4 py-2"
              required
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-lg border px-4 py-2"
              rows={2}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Price"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="w-full rounded-lg border px-4 py-2"
              required
            />
            <input
              type="text"
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded-lg border px-4 py-2"
            />
            <div className="flex gap-2">
              <button type="submit" className="rounded-lg bg-eato-orange px-4 py-2 font-medium text-white hover:bg-orange-600">
                {editing ? 'Update' : 'Add'}
              </button>
              {editing && (
                <button type="button" onClick={openAdd} className="rounded-lg border px-4 py-2">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
