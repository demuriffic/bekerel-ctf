'use client';

import { useState, useEffect } from 'react';
import { FolderTree, PlusCircle, Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  color: string;
  order: number;
  challengeCount: number;
}

const PRESET_COLORS = [
  '#00ff41', // Neon green
  '#00e5ff', // Cyan
  '#ff007f', // Neon pink
  '#ffd600', // Yellow
  '#b388ff', // Purple
  '#ff6d00', // Orange
  '#ff3366', // Crimson red
  '#76ff03', // Lime
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New category form state
  const [name, setName] = useState('');
  const [color, setColor] = useState('#00ff41');
  const [order, setOrder] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editOrder, setEditOrder] = useState(1);

  const fetchCategories = () => {
    fetch('/api/admin/categories')
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color, order }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create category');

      setName('');
      setOrder((prev) => prev + 1);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Error creating category');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
    setEditOrder(cat.order);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, color: editColor, order: editOrder }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchCategories();
      } else {
        alert('Failed to update category');
      }
    } catch {
      alert('Error communicating with server');
    }
  };

  const handleDelete = async (id: string, name: string, count: number) => {
    if (count > 0) {
      if (!confirm(`Warning: This category contains ${count} challenge(s). Deleting it will delete or uncategorize those challenges! Proceed?`)) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to delete category "${name}"?`)) {
        return;
      }
    }

    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert('Failed to delete category');
      }
    } catch {
      alert('Error communicating with server');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-mono-code text-white flex items-center gap-2.5">
          <FolderTree className="w-6 h-6 text-[#00ff41]" />
          CATEGORIES
        </h1>
        <p className="text-xs text-gray-400 font-mono-code mt-1">
          Manage challenge categories, colors, and display order.
        </p>
      </div>

      {/* Add Category Form */}
      <div className="p-6 rounded-lg border border-[#1a3026] bg-[#0d1613] space-y-4">
        <h2 className="text-sm font-bold font-mono-code text-[#00ff41] uppercase flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          Add New Category
        </h2>

        {error && (
          <div className="p-3 rounded bg-red-950/40 border border-red-500/40 flex items-start gap-2.5 text-xs text-red-300 font-mono-code">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-mono-code text-gray-400 mb-1 uppercase">
              Category Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Web"
              className="w-full px-3.5 py-2 rounded bg-[#13241d] border border-[#1a3026] text-sm text-white font-mono-code placeholder-gray-600 focus:outline-none focus:border-[#00ff41]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono-code text-gray-400 mb-1 uppercase">
              Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-9 h-9 rounded bg-[#13241d] border border-[#1a3026] cursor-pointer p-0.5"
              />
              <div className="flex flex-wrap gap-1">
                {PRESET_COLORS.slice(0, 4).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-5 h-5 rounded-full border border-gray-700"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="w-full py-2 px-4 rounded bg-[#00ff41] hover:bg-[#00e63a] text-[#041409] font-bold text-xs font-mono-code uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_10px_rgba(0,255,65,0.2)] disabled:opacity-50"
            >
              <span>{submitting ? 'ADDING...' : 'CREATE CATEGORY'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Categories Table */}
      <div className="border border-[#1a3026] rounded-lg bg-[#0d1613] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono-code">
            <thead className="bg-[#080d0b] text-xs uppercase text-gray-400 border-b border-[#1a3026]">
              <tr>
                <th className="py-3 px-4">Color</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4 text-center">Challenges</th>
                <th className="py-3 px-4 text-center">Order</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a3026]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    No categories found
                  </td>
                </tr>
              ) : (
                categories.map((cat) => {
                  const isEditing = editingId === cat.id;
                  return (
                    <tr key={cat.id} className="hover:bg-[#13241d]/50 transition-colors">
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="color"
                            value={editColor}
                            onChange={(e) => setEditColor(e.target.value)}
                            className="w-8 h-8 rounded bg-[#13241d] border border-[#1a3026] cursor-pointer"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3.5 h-3.5 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-xs text-gray-400">{cat.color}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-2 py-1 rounded bg-[#13241d] border border-[#1a3026] text-white text-sm font-mono-code w-full"
                          />
                        ) : (
                          <span
                            className="px-2.5 py-1 rounded text-xs border"
                            style={{
                              borderColor: `${cat.color}40`,
                              backgroundColor: `${cat.color}15`,
                              color: cat.color,
                            }}
                          >
                            {cat.name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-300">
                        {cat.challengeCount}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-400">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editOrder}
                            onChange={(e) => setEditOrder(Number(e.target.value))}
                            className="px-2 py-1 rounded bg-[#13241d] border border-[#1a3026] text-white text-sm font-mono-code w-20 text-center"
                          />
                        ) : (
                          cat.order
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveEdit(cat.id)}
                                className="p-1.5 text-green-400 hover:bg-green-500/10 rounded"
                                title="Save changes"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1.5 text-gray-400 hover:bg-gray-700/20 rounded"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(cat)}
                                className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded transition-colors"
                                title="Edit Category"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(cat.id, cat.name, cat.challengeCount)}
                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                title="Delete Category"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
