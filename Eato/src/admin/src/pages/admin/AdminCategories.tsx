import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { admin as adminApi } from '../../api';

type FoodCategory = {
  _id: string;
  name: string;
  slug: string;
  sortOrder: number;
  active: boolean;
  description?: string;
};

export default function AdminCategories() {
  const [list, setList] = useState<FoodCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editing, setEditing] = useState<FoodCategory | null>(null);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const data = await adminApi.categories();
      setList(Array.isArray(data) ? (data as FoodCategory[]) : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await adminApi.createCategory({ name, description });
      setName('');
      setDescription('');
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };

  const toggleActive = async (c: FoodCategory) => {
    setError('');
    try {
      await adminApi.updateCategory(c._id, { active: !c.active });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setError('');
    try {
      await adminApi.updateCategory(editing._id, {
        name: editing.name,
        description: editing.description,
        sortOrder: Number(editing.sortOrder) || 0,
      });
      setEditing(null);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this category? Menu items still using the name as free text are unchanged.')) return;
    setError('');
    try {
      await adminApi.deleteCategory(id);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };

  if (loading) return <p className="text-stone-600">Loading…</p>;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-stone-900">Food categories</h1>
      <p className="mb-4 text-sm text-stone-600">Canonical list for classifying menu items (also exposed publicly via GET /api/menu/categories).</p>
      {error ? <p className="mb-4 text-red-600">{error}</p> : null}

      <form onSubmit={create} className="mb-6 flex flex-wrap items-end gap-2 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-stone-600">New name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 rounded border border-stone-200 px-2 py-1.5 text-sm" placeholder="e.g. Vegan" />
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="block text-xs font-semibold text-stone-600">Description (optional)</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full rounded border border-stone-200 px-2 py-1.5 text-sm" />
        </div>
        <button type="submit" className="rounded-lg bg-eato-orange px-4 py-2 text-sm font-semibold text-white">
          Add category
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-stone-100">
            <tr>
              <th className="p-3 text-left font-semibold">Name</th>
              <th className="p-3 text-left font-semibold">Slug</th>
              <th className="p-3 text-left font-semibold">Sort</th>
              <th className="p-3 text-left font-semibold">Active</th>
              <th className="p-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) =>
              editing && editing._id === c._id ? (
                <tr key={c._id} className="border-t border-stone-100">
                  <td className="p-2">
                    <input
                      className="w-full rounded border px-2 py-1"
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    />
                  </td>
                  <td className="p-2 text-stone-500">{c.slug}</td>
                  <td className="p-2">
                    <input
                      type="number"
                      className="w-20 rounded border px-2 py-1"
                      value={editing.sortOrder}
                      onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })}
                    />
                  </td>
                  <td className="p-2">—</td>
                  <td className="p-2">
                    <button type="button" onClick={() => void saveEdit()} className="mr-1 text-xs font-semibold text-eato-orange">
                      Save
                    </button>
                    <button type="button" onClick={() => setEditing(null)} className="text-xs text-stone-600">
                      Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={c._id} className="border-t border-stone-100">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-stone-500">{c.slug}</td>
                  <td className="p-3">{c.sortOrder}</td>
                  <td className="p-3">{c.active ? 'Yes' : 'No'}</td>
                  <td className="p-3">
                    <button type="button" onClick={() => setEditing({ ...c })} className="mr-2 text-xs font-semibold text-eato-orange hover:underline">
                      Edit
                    </button>
                    <button type="button" onClick={() => toggleActive(c)} className="mr-2 text-xs font-semibold text-stone-700 hover:underline">
                      {c.active ? 'Hide' : 'Show'}
                    </button>
                    <button type="button" onClick={() => del(c._id)} className="text-xs font-semibold text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
