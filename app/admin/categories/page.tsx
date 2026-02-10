'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ListPlus, ChevronDown, ChevronUp } from 'lucide-react';
import type { Category } from '@/lib/supabase/types';

// Extended type with queue stats
interface CategoryWithStats extends Category {
  queue_stats?: {
    pending: number;
    completed: number;
    cardCount: number;
  };
}
import { IconPicker } from '@/components/IconPicker';
import { CategoryIcon } from '@/components/CategoryIcon';
import { CategoryQueueSection } from '@/components/admin/CategoryQueueSection';

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New category form
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTargetCount, setFormTargetCount] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit mode
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTargetCount, setEditTargetCount] = useState('');

  // Queue expansion (separate from edit mode)
  const [expandedQueueId, setExpandedQueueId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories?include_stats=true');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setCategories(data);
    } catch {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          icon: formIcon.trim() || null,
          description: formDescription.trim() || null,
          target_count: formTargetCount ? parseInt(formTargetCount, 10) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create');
      }

      await fetchCategories();
      setFormName('');
      setFormIcon('');
      setFormDescription('');
      setFormTargetCount('');
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: editName.trim(),
          icon: editIcon.trim() || null,
          description: editDescription.trim() || null,
          target_count: editTargetCount ? parseInt(editTargetCount, 10) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update');
      }

      await fetchCategories();
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete category "${name}"? This cannot be undone.`)) return;

    setError(null);

    try {
      const res = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }

      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditIcon(category.icon || '');
    setEditDescription(category.description || '');
    setEditTargetCount(category.target_count?.toString() || '');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
    setEditIcon('');
    setEditDescription('');
    setEditTargetCount('');
  }

  return (
    <main className="py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600 mt-1">Manage word categories with icons</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add Category'}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* New Category Form */}
        {showForm && (
          <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Category</h2>
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Fruits"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder:text-gray-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Description <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Common fruits in Vietnam"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Target Cards <span className="text-gray-400 font-normal">(goal)</span>
                  </label>
                  <input
                    type="number"
                    value={formTargetCount}
                    onChange={(e) => setFormTargetCount(e.target.value)}
                    placeholder="10"
                    min="1"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Icon
                </label>
                <IconPicker value={formIcon} onChange={setFormIcon} />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !formName.trim()}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              All Categories ({categories.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-600">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 mb-4">No categories yet. Create your first one!</p>
              <button
                onClick={() => setShowForm(true)}
                className="text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                Add Category
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {categories.map((category) => (
                <div key={category.id} className="p-4">
                  {editingId === category.id ? (
                    // Edit mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">
                            Name
                          </label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Category name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder:text-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Optional description"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder:text-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">
                            Target Cards
                          </label>
                          <input
                            type="number"
                            value={editTargetCount}
                            onChange={(e) => setEditTargetCount(e.target.value)}
                            placeholder="10"
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder:text-gray-400"
                          />
                        </div>
                      </div>

                      {/* Icon picker for edit */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Icon
                        </label>
                        <IconPicker value={editIcon} onChange={setEditIcon} />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleUpdate(category.id)}
                          disabled={saving || !editName.trim()}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm font-medium rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display mode
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <CategoryIcon icon={category.icon} size="lg" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900">{category.name}</div>
                          {category.description && (
                            <div className="text-sm text-gray-600 truncate">
                              {category.description}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-0.5">
                            /{category.slug}/ • {category.queue_stats?.cardCount || 0} cards
                          </div>
                        </div>

                        {/* Queue progress button */}
                        {category.queue_stats && (category.queue_stats.pending > 0 || category.queue_stats.completed > 0) ? (
                          <button
                            onClick={() => setExpandedQueueId(expandedQueueId === category.id ? null : category.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              expandedQueueId === category.id
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-700 hover:bg-amber-50 hover:text-amber-700'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500"
                                  style={{
                                    width: `${
                                      ((category.queue_stats.completed) /
                                        (category.queue_stats.pending + category.queue_stats.completed)) *
                                      100
                                    }%`,
                                  }}
                                />
                              </div>
                              <span>
                                {category.queue_stats.completed}/{category.queue_stats.pending + category.queue_stats.completed}
                              </span>
                            </div>
                            {expandedQueueId === category.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => setExpandedQueueId(expandedQueueId === category.id ? null : category.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              expandedQueueId === category.id
                                ? 'bg-amber-100 text-amber-800'
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                            }`}
                          >
                            <ListPlus className="w-4 h-4" />
                            Queue
                          </button>
                        )}

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(category)}
                            className="px-3 py-1.5 text-emerald-600 hover:bg-emerald-50 text-sm font-medium rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(category.id, category.name)}
                            className="px-3 py-1.5 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Expandable Queue Section (separate from edit) */}
                      {expandedQueueId === category.id && (
                        <div className="ml-14 bg-amber-50/50 rounded-lg p-4 border border-amber-100">
                          <CategoryQueueSection
                            categoryId={category.id}
                            categoryName={category.name}
                            onUpdate={fetchCategories}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back link */}
        <div className="mt-6">
          <Link href="/admin" className="text-emerald-600 hover:text-emerald-700 font-medium">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
