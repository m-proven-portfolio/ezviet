'use client';

import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';
import { BLOCKED_PRACTICE_CONFIG } from '@/lib/blocked-practice';
import type { Category } from '@/lib/supabase/types';

interface CategoryPickerProps {
  categories: Category[];
  onSelect: (categoryIds: string[]) => void;
  onDismiss: () => void;
}

/**
 * Category picker shown after initial engagement
 * Allows users to choose which topics to study
 */
export function CategoryPicker({
  categories,
  onSelect,
  onDismiss,
}: CategoryPickerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Load saved preferences on mount
  useEffect(() => {
    const saved = localStorage.getItem(
      BLOCKED_PRACTICE_CONFIG.STORAGE_KEY_SELECTED_CATEGORIES
    );
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSelectedIds(new Set(parsed));
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const toggleCategory = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const selected = Array.from(selectedIds);
    // Save to localStorage
    localStorage.setItem(
      BLOCKED_PRACTICE_CONFIG.STORAGE_KEY_SELECTED_CATEGORIES,
      JSON.stringify(selected)
    );
    onSelect(selected);
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(categories.map((c) => c.id)));
  };

  const handleClearAll = () => {
    setSelectedIds(new Set());
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Choose your topics
        </h3>
        <button
          onClick={onDismiss}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          aria-label="Dismiss"
        >
          <X size={20} />
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Select the topics you want to focus on, or continue with all topics.
      </p>

      {/* Category grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {categories.map((category) => {
          const isSelected = selectedIds.has(category.id);
          return (
            <button
              key={category.id}
              onClick={() => toggleCategory(category.id)}
              className={`
                relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all
                ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              <CategoryIcon icon={category.icon} size="sm" />
              <span
                className={`text-sm font-medium ${
                  isSelected ? 'text-emerald-700' : 'text-gray-700'
                }`}
              >
                {category.name}
              </span>
              {isSelected && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 text-xs mb-4">
        <button
          onClick={handleSelectAll}
          className="text-emerald-600 hover:text-emerald-700 hover:underline"
        >
          Select all
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={handleClearAll}
          className="text-gray-500 hover:text-gray-700 hover:underline"
        >
          Clear
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onDismiss}
          className="flex-1 px-4 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
        >
          Keep all topics
        </button>
        <button
          onClick={handleConfirm}
          disabled={selectedIds.size === 0}
          className={`
            flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors
            ${
              selectedIds.size > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          Study {selectedIds.size > 0 ? `${selectedIds.size} topic${selectedIds.size > 1 ? 's' : ''}` : 'selected'}
        </button>
      </div>
    </div>
  );
}

/**
 * Inline prompt banner shown above flashcards
 */
export function CategoryPickerPrompt({
  onShowPicker,
  onDismiss,
}: {
  onShowPicker: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-4 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🎯</span>
        <div>
          <p className="text-sm font-medium text-gray-800">
            Want to focus on specific topics?
          </p>
          <p className="text-xs text-gray-500">
            Choose categories that interest you
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onDismiss}
          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
        >
          Not now
        </button>
        <button
          onClick={onShowPicker}
          className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
        >
          Choose topics
        </button>
      </div>
    </div>
  );
}
