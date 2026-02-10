'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Category } from '@/lib/supabase/types';
import type { ConversationCardWithLines, ConversationLine } from '@/lib/types/conversation';
import { getStorageUrl } from '@/lib/utils';
import { getIconForSelect } from '@/components/CategoryIcon';

interface EditableConversation extends Omit<ConversationCardWithLines, 'lines'> {
  lines: (ConversationLine & { isEdited?: boolean })[];
}

export default function EditConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [conversation, setConversation] = useState<EditableConversation | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [titleVi, setTitleVi] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState(1);
  const [isPublished, setIsPublished] = useState(true);
  const [lines, setLines] = useState<ConversationLine[]>([]);

  useEffect(() => {
    async function loadData() {
      // Fetch conversation
      try {
        const res = await fetch(`/api/conversations/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Conversation not found');
          } else {
            throw new Error('Failed to fetch');
          }
          return;
        }
        const data = await res.json();
        setConversation(data);
        setTitle(data.title || '');
        setTitleVi(data.title_vi || '');
        setCategoryId(data.category_id || '');
        setDifficulty(data.difficulty || 1);
        setIsPublished(data.is_published ?? true);
        setLines(data.lines || []);
      } catch {
        setError('Failed to load conversation');
      } finally {
        setIsLoading(false);
      }

      // Fetch categories
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data);
      } catch {
        console.error('Failed to fetch categories');
      }
    }
    loadData();
  }, [id]);

  function updateLine(index: number, field: keyof ConversationLine, value: string) {
    setLines((prev) =>
      prev.map((line, i) =>
        i === index ? { ...line, [field]: value } : line
      )
    );
  }

  async function handleSave() {
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          title_vi: titleVi || null,
          category_id: categoryId || null,
          difficulty,
          is_published: isPublished,
          lines,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      setSuccessMessage('Conversation saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      router.push('/admin/conversations');
    } catch {
      setError('Failed to delete conversation');
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </main>
    );
  }

  if (error && !conversation) {
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
          <Link
            href="/admin/conversations"
            className="text-gray-600 hover:text-gray-900"
          >
            Back to Conversations
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/conversations"
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            Back to Conversations
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Edit Conversation</h1>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-6">
            {successMessage}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          {/* Scene Image Preview */}
          {conversation?.scene_image_path && (
            <div className="relative h-48 rounded-lg overflow-hidden">
              <img
                src={getStorageUrl('cards-images', conversation.scene_image_path)}
                alt={title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="backdrop-blur-md bg-black/40 rounded-lg px-4 py-3">
                  <h2 className="text-white font-bold text-xl drop-shadow-sm">{title}</h2>
                  {titleVi && (
                    <p className="text-white/90 drop-shadow-sm">{titleVi}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title (English)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title (Vietnamese)
              </label>
              <input
                type="text"
                value={titleVi}
                onChange={(e) => setTitleVi(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {getIconForSelect(cat.icon)} {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value={1}>1 - Beginner</option>
                <option value={2}>2 - Elementary</option>
                <option value={3}>3 - Intermediate</option>
                <option value={4}>4 - Upper Int.</option>
                <option value={5}>5 - Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={isPublished ? 'published' : 'draft'}
                onChange={(e) => setIsPublished(e.target.value === 'published')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Conversation Lines */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Conversation Lines
            </h3>
            <div className="space-y-4">
              {lines.map((line, index) => (
                <div
                  key={line.id || index}
                  className="bg-gray-50 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-medium">Line {index + 1}</span>
                    <span className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                      {line.speaker}
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Vietnamese
                      </label>
                      <input
                        type="text"
                        value={line.vietnamese}
                        onChange={(e) => updateLine(index, 'vietnamese', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        English
                      </label>
                      <input
                        type="text"
                        value={line.english}
                        onChange={(e) => updateLine(index, 'english', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                  </div>
                  {line.romanization && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Romanization
                      </label>
                      <input
                        type="text"
                        value={line.romanization || ''}
                        onChange={(e) => updateLine(index, 'romanization', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              Delete Conversation
            </button>
            <div className="flex gap-3">
              <Link
                href="/admin/conversations"
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
