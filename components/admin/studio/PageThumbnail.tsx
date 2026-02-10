'use client';

import {
  Trash2,
  ChevronUp,
  ChevronDown,
  BookOpen,
  Grid3X3,
  MessageSquare,
  Lightbulb,
  CheckSquare,
  List,
  FileText,
  MousePointerClick,
  LayoutTemplate,
} from 'lucide-react';
import type { StudioPage, PageType } from '@/lib/studio/types';

interface PageThumbnailProps {
  page: StudioPage;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const PAGE_TYPE_ICONS: Record<PageType, typeof BookOpen> = {
  intro: BookOpen,
  'vocabulary-grid': Grid3X3,
  conversation: MessageSquare,
  'cultural-tips': Lightbulb,
  revision: CheckSquare,
  lexics: List,
  'free-form': FileText,
  'image-labeling': MousePointerClick,
  lesson: LayoutTemplate,
};

const PAGE_TYPE_LABELS: Record<PageType, string> = {
  intro: 'Intro',
  'vocabulary-grid': 'Vocab Grid',
  conversation: 'Conversation',
  'cultural-tips': 'Cultural Tips',
  revision: 'Revision',
  lexics: 'Lexics',
  'free-form': 'Free Form',
  'image-labeling': 'Image Label',
  lesson: 'Lesson',
};

const PAGE_TYPE_COLORS: Record<PageType, string> = {
  intro: 'bg-purple-100 text-purple-600',
  'vocabulary-grid': 'bg-emerald-100 text-emerald-600',
  conversation: 'bg-blue-100 text-blue-600',
  'cultural-tips': 'bg-amber-100 text-amber-600',
  revision: 'bg-pink-100 text-pink-600',
  lexics: 'bg-slate-100 text-slate-600',
  'free-form': 'bg-gray-100 text-gray-600',
  'image-labeling': 'bg-cyan-100 text-cyan-600',
  lesson: 'bg-indigo-100 text-indigo-600',
};

export function PageThumbnail({
  page,
  index,
  isSelected,
  onSelect,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: PageThumbnailProps) {
  const Icon = PAGE_TYPE_ICONS[page.type];
  const label = PAGE_TYPE_LABELS[page.type];
  const colorClass = PAGE_TYPE_COLORS[page.type];

  // Get page title based on type
  const getPageTitle = (): string => {
    switch (page.type) {
      case 'intro':
        return page.title || 'Untitled';
      case 'vocabulary-grid':
        return page.title || 'Vocabulary';
      case 'conversation':
        return page.title || 'Conversation';
      case 'cultural-tips':
        return page.title || 'Cultural Tips';
      case 'revision':
        return page.title || 'Revision';
      case 'lexics':
        return page.title || 'Lexics';
      case 'free-form':
        return page.title || 'Free Form';
      case 'image-labeling':
        return page.title || 'Image Labeling';
      case 'lesson':
        return page.title || 'Lesson';
      default:
        return 'Page';
    }
  };

  return (
    <div
      className={`group relative rounded-lg border transition-all ${
        isSelected
          ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {/* Main clickable area */}
      <button
        onClick={onSelect}
        className="w-full p-3 text-left"
      >
        <div className="flex items-start gap-3">
          {/* Page number */}
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-gray-100 text-xs font-medium text-gray-500">
            {index + 1}
          </div>

          {/* Page info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${colorClass}`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </span>
            </div>
            <p className="mt-1 truncate text-sm font-medium text-gray-700">
              {getPageTitle()}
            </p>
          </div>
        </div>
      </button>

      {/* Hover actions */}
      <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp();
          }}
          disabled={!canMoveUp}
          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
          title="Move up"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
          disabled={!canMoveDown}
          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
          title="Move down"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
          title="Delete page"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
