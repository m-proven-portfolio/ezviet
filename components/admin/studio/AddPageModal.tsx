'use client';

import { X, BookOpen, Grid3X3, MessageSquare, Lightbulb, CheckSquare, List, FileText, MousePointerClick, LayoutTemplate } from 'lucide-react';
import type { PageType } from '@/lib/studio/types';
import { PAGE_TEMPLATES } from '@/lib/studio/types';

interface AddPageModalProps {
  onSelect: (type: PageType) => void;
  onClose: () => void;
}

const ICONS: Record<string, typeof BookOpen> = {
  BookOpen,
  Grid3X3,
  MessageSquare,
  Lightbulb,
  CheckSquare,
  List,
  FileText,
  MousePointerClick,
  LayoutTemplate,
};

const TEMPLATE_COLORS: Record<PageType, string> = {
  intro: 'hover:border-purple-300 hover:bg-purple-50',
  'vocabulary-grid': 'hover:border-emerald-300 hover:bg-emerald-50',
  conversation: 'hover:border-blue-300 hover:bg-blue-50',
  'cultural-tips': 'hover:border-amber-300 hover:bg-amber-50',
  revision: 'hover:border-pink-300 hover:bg-pink-50',
  lexics: 'hover:border-slate-300 hover:bg-slate-50',
  'free-form': 'hover:border-gray-300 hover:bg-gray-50',
  'image-labeling': 'hover:border-cyan-300 hover:bg-cyan-50',
  lesson: 'hover:border-indigo-300 hover:bg-indigo-50',
};

const ICON_COLORS: Record<PageType, string> = {
  intro: 'text-purple-500',
  'vocabulary-grid': 'text-emerald-500',
  conversation: 'text-blue-500',
  'cultural-tips': 'text-amber-500',
  revision: 'text-pink-500',
  lexics: 'text-slate-500',
  'free-form': 'text-gray-500',
  'image-labeling': 'text-cyan-500',
  lesson: 'text-indigo-500',
};

export function AddPageModal({ onSelect, onClose }: AddPageModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Choose Page Template
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 text-sm text-gray-500">
          Select a template to add a new page to your book
        </p>

        {/* Template Grid */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {PAGE_TEMPLATES.map((template) => {
            const Icon = ICONS[template.icon];
            return (
              <button
                key={template.type}
                onClick={() => onSelect(template.type)}
                className={`flex flex-col items-center rounded-xl border-2 border-gray-200 p-6 text-center transition-all ${TEMPLATE_COLORS[template.type]}`}
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 ${ICON_COLORS[template.type]}`}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mt-3 font-semibold text-gray-900">
                  {template.label}
                </h3>
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                  {template.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Cancel Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
