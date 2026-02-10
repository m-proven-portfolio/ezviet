'use client';

import { useState, useEffect, useMemo } from 'react';
import { Circle, Check, Trash2, Pencil, X, CheckCircle } from 'lucide-react';
import type { CardQueue } from '@/lib/supabase/types';

interface CategoryQueueSectionProps {
  categoryId: string;
  categoryName: string;
  onUpdate?: () => void;
}

interface ParsedItem {
  vietnamese: string;
  english: string;
  notes: string | null;
}

function parseText(text: string): ParsedItem[] {
  const lines = text.split('\n').filter((line) => line.trim());
  const items: ParsedItem[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for separator formats: "Vietnamese - English" or "Vietnamese, English"
    if (trimmed.includes(' - ') || trimmed.includes(',')) {
      const parts = trimmed.includes(' - ')
        ? trimmed.split(' - ').map((p) => p.trim())
        : trimmed.split(',').map((p) => p.trim());

      if (parts.length >= 2 && parts[0] && parts[1]) {
        items.push({
          vietnamese: parts[0],
          english: parts[1],
          notes: parts[2] || null,
        });
      }
    } else if (trimmed) {
      // Single word - treat as English, Vietnamese to be filled later
      items.push({
        vietnamese: '',  // Will be filled when creating the card
        english: trimmed,
        notes: null,
      });
    }
  }

  return items;
}

export function CategoryQueueSection({ categoryId, categoryName, onUpdate }: CategoryQueueSectionProps) {
  const [queueItems, setQueueItems] = useState<CardQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const parsedItems = useMemo(() => parseText(text), [text]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    fetchQueueItems();
  }, [categoryId]);

  async function fetchQueueItems() {
    try {
      const res = await fetch(`/api/card-queue?category_id=${categoryId}`);
      if (res.ok) {
        const data = await res.json();
        setQueueItems(data);
      }
    } catch (err) {
      console.error('Failed to fetch queue:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (parsedItems.length === 0) {
      setError('No valid items found. Use format: Vietnamese - English');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/card-queue/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: categoryId, text }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to import');
        setIsSubmitting(false);
        return;
      }

      setText('');
      fetchQueueItems();
      onUpdate?.();

      // Show success toast
      const count = data.inserted || parsedItems.length;
      setToast({
        message: `Added ${count} item${count !== 1 ? 's' : ''} to queue`,
        type: 'success',
      });
    } catch {
      setError('Failed to import items');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/card-queue?id=${id}`, { method: 'DELETE' });
      setQueueItems((prev) => prev.filter((item) => item.id !== id));
      onUpdate?.();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  }

  async function handleUpdate(id: string, vietnamese: string, english: string) {
    try {
      const res = await fetch('/api/card-queue', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, vietnamese, english }),
      });

      if (res.ok) {
        const updated = await res.json();
        setQueueItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
        );
        setToast({ message: 'Item updated', type: 'success' });
      }
    } catch (err) {
      console.error('Failed to update:', err);
      setToast({ message: 'Failed to update', type: 'error' });
    }
  }

  const pendingItems = queueItems.filter((item) => item.status === 'pending');
  const completedItems = queueItems.filter((item) => item.status === 'completed');

  return (
    <div className="space-y-4 relative">
      {/* Toast notification */}
      {toast && (
        <div
          className={`absolute -top-2 right-0 px-3 py-2 rounded-lg text-sm font-medium shadow-lg z-10 animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' && <CheckCircle className="w-4 h-4" />}
            {toast.message}
          </div>
        </div>
      )}

      {/* Add new items */}
      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Add cards to "${categoryName}":\nChuối - Banana\nTáo - Apple`}
          rows={3}
          className="w-full px-3 py-2 border border-amber-200 bg-white rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-sm font-mono text-gray-900"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            Format: Vietnamese - English, or just English words (one per line)
          </p>
          {parsedItems.length > 0 && (
            <button
              type="button"
              onClick={handleImport}
              disabled={isSubmitting}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {isSubmitting ? 'Saving...' : `Save ${parsedItems.length} item${parsedItems.length !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-600 mt-1">{error}</p>
        )}
      </div>

      {/* Queue items list */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading queue...</p>
      ) : queueItems.length === 0 ? (
        <p className="text-sm text-gray-500">No items in queue yet. Add words above to get started.</p>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {/* Pending items */}
          {pendingItems.map((item) => (
            <QueueItemRow
              key={item.id}
              item={item}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}

          {/* Completed items (collapsed) */}
          {completedItems.length > 0 && (
            <div className="pt-2 border-t border-amber-200/50">
              <p className="text-xs text-gray-400 mb-1">
                {completedItems.length} completed
              </p>
              {completedItems.slice(0, 3).map((item) => (
                <QueueItemRow
                  key={item.id}
                  item={item}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              ))}
              {completedItems.length > 3 && (
                <p className="text-xs text-gray-400">
                  +{completedItems.length - 3} more
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QueueItemRow({
  item,
  onDelete,
  onUpdate,
}: {
  item: CardQueue;
  onDelete: (id: string) => void;
  onUpdate: (id: string, vietnamese: string, english: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editVietnamese, setEditVietnamese] = useState(item.vietnamese);
  const [editEnglish, setEditEnglish] = useState(item.english);

  const isPending = item.status === 'pending';

  function handleSave() {
    if (editVietnamese.trim() && editEnglish.trim()) {
      onUpdate(item.id, editVietnamese.trim(), editEnglish.trim());
      setIsEditing(false);
    }
  }

  function handleCancel() {
    setEditVietnamese(item.vietnamese);
    setEditEnglish(item.english);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 py-1.5 px-2 rounded bg-amber-50 text-sm">
        <Circle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
        <input
          type="text"
          value={editVietnamese}
          onChange={(e) => setEditVietnamese(e.target.value)}
          className="flex-1 px-2 py-1 border border-amber-300 rounded text-gray-900 text-sm min-w-0"
          placeholder="Vietnamese"
          autoFocus
        />
        <span className="text-gray-400">—</span>
        <input
          type="text"
          value={editEnglish}
          onChange={(e) => setEditEnglish(e.target.value)}
          className="flex-1 px-2 py-1 border border-amber-300 rounded text-gray-900 text-sm min-w-0"
          placeholder="English"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <button
          type="button"
          onClick={handleSave}
          className="p-1 text-emerald-600 hover:text-emerald-700"
          title="Save"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="p-1 text-gray-400 hover:text-gray-600"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 group text-sm">
      {isPending ? (
        <Circle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
      ) : (
        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
      )}
      {item.vietnamese ? (
        <>
          <span className={`font-medium ${isPending ? 'text-gray-900' : 'text-gray-400'}`}>
            {item.vietnamese}
          </span>
          <span className="text-gray-400">—</span>
          <span className={isPending ? 'text-gray-600' : 'text-gray-400'}>
            {item.english}
          </span>
        </>
      ) : (
        <>
          <span className={`font-medium ${isPending ? 'text-gray-900' : 'text-gray-400'}`}>
            {item.english}
          </span>
          <span className="text-xs text-amber-500 italic">(needs Vietnamese)</span>
        </>
      )}
      <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isPending && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="p-1 text-gray-400 hover:text-amber-600"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="p-1 text-gray-400 hover:text-red-600"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
