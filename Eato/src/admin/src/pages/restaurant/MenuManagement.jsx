import { useEffect, useState } from 'react';
import { menu as menuApi } from '../../api';

export default function MenuManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: 'Main' });

  const load = () => menuApi.my().then(setItems).catch(e => setError(e.message)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: '', category: 'Main' });
  };

  const openEdit = (item) => {
    setEditing(item._id);
    setForm({ name: item.name, description: item.description || '', price: item.price ?? '', category: item.category || 'Main' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await menuApi.update(editing, { name: form.name, description: form.description, price: form.price, category: form.category });
      } else {
        await menuApi.add(form);
      }
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    setError('');
    try {
      await menuApi.delete(id);
      load();
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  if (loading) return <p className="text-center py-8">Loading menu...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <button type="button" onClick={openAdd} className="px-4 py-2 bg-eato-orange text-white rounded-lg font-medium hover:bg-orange-600">Add item</button>
      </div>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {items.map((item) => (
          <div key={item._id} className="p-4 bg-white border rounded-xl shadow-sm">
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-stone-600 text-sm">{item.description}</p>
            <p className="text-eato-orange font-semibold mt-1">${item.price?.toFixed(2)} — {item.category}</p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => openEdit(item)} className="px-3 py-1 border rounded text-sm hover:bg-stone-100">Edit</button>
              <button type="button" onClick={() => handleDelete(item._id)} className="px-3 py-1 border border-red-200 text-red-600 rounded text-sm hover:bg-red-50">Delete</button>
            </div>
          </div>
        ))}
      </div>
      {(editing || !items.length) && (
        <div className="max-w-md bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-lg mb-4">{editing ? 'Edit item' : 'Add food item'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" required />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" rows={2} />
            <input type="number" step="0.01" placeholder="Price" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" required />
            <input type="text" placeholder="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-eato-orange text-white rounded-lg font-medium hover:bg-orange-600">{editing ? 'Update' : 'Add'}</button>
              {editing && <button type="button" onClick={openAdd} className="px-4 py-2 border rounded-lg">Cancel</button>}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
