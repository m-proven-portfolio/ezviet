'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, FolderOpen, Layers, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { AssignmentContentType } from '@/lib/classroom/types';
import { CONTENT_TYPE_LABELS } from '@/lib/classroom/types';

interface PageProps {
  params: Promise<{ classroomId: string }>;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  card_count: number;
}

export default function CreateAssignmentPage({ params }: PageProps) {
  const { classroomId } = use(params);
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState<AssignmentContentType>('category');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('categories')
        .select('id, name, icon, cards:cards(count)')
        .order('name');

      if (error) {
        console.error('Fetch categories error:', error);
      } else {
        // Transform to include card_count
        const transformed = (data || []).map((cat) => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          card_count:
            (cat.cards as unknown as { count: number }[])?.[0]?.count || 0,
        }));
        setCategories(transformed);
      }
      setLoading(false);
    }

    fetchCategories();
  }, []);

  const toggleCategory = (categoryId: string) => {
    setSelectedIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Assignment title is required');
      return;
    }

    if (selectedIds.length === 0) {
      setError('Please select at least one category');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const res = await fetch(`/api/classrooms/${classroomId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          content_type: contentType,
          content_ids: selectedIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create assignment');
      }

      // Navigate back to classroom
      router.push(`/classroom/${classroomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment');
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <button
            onClick={() => router.push(`/classroom/${classroomId}`)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">New Assignment</h1>
            <p className="text-sm text-gray-500">
              Create learning content for your students
            </p>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="mx-auto max-w-2xl px-6 py-8">
        <form onSubmit={handleCreate} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Assignment Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Week 1: Basic Greetings"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              required
            />
          </div>

          {/* Description */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add instructions or notes for students..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Content Type */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <label className="mb-3 block text-sm font-medium text-gray-700">
              Content Type
            </label>
            <div className="flex gap-3">
              {(['category'] as AssignmentContentType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setContentType(type);
                    setSelectedIds([]);
                  }}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    contentType === type
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {type === 'category' && <FolderOpen className="h-4 w-4" />}
                  {type === 'card_set' && <Layers className="h-4 w-4" />}
                  {CONTENT_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          {contentType === 'category' && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <label className="mb-3 block text-sm font-medium text-gray-700">
                Select Categories *
              </label>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
              ) : categories.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">
                  No categories available
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className={`relative flex flex-col items-start rounded-lg border p-3 text-left transition ${
                        selectedIds.includes(category.id)
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {selectedIds.includes(category.id) && (
                        <div className="absolute right-2 top-2">
                          <Check className="h-4 w-4 text-emerald-600" />
                        </div>
                      )}
                      <span className="text-lg">{category.icon || '📚'}</span>
                      <span className="mt-1 text-sm font-medium text-gray-900">
                        {category.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {category.card_count} card
                        {category.card_count !== 1 ? 's' : ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {selectedIds.length > 0 && (
                <p className="mt-3 text-xs text-gray-500">
                  {selectedIds.length} categor
                  {selectedIds.length === 1 ? 'y' : 'ies'} selected
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push(`/classroom/${classroomId}`)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !title.trim() || selectedIds.length === 0}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              {creating ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
