'use client';

import { useState } from 'react';
import { X, Zap, Check, BookOpen, MessageSquare, List, Lightbulb, CheckSquare, MousePointerClick } from 'lucide-react';
import { UNIT_TEMPLATES, generateTemplatePages, type UnitTemplate } from '@/lib/studio/unit-templates';
import type { StudioPage, PageType } from '@/lib/studio/types';

interface QuickUnitModalProps {
  onCreateUnit: (title: string, pages: StudioPage[]) => void;
  onClose: () => void;
}

const PAGE_TYPE_ICONS: Record<PageType, React.ReactNode> = {
  'intro': <BookOpen className="h-3 w-3" />,
  'vocabulary-grid': <span className="text-xs">📝</span>,
  'conversation': <MessageSquare className="h-3 w-3" />,
  'cultural-tips': <Lightbulb className="h-3 w-3" />,
  'revision': <CheckSquare className="h-3 w-3" />,
  'lexics': <List className="h-3 w-3" />,
  'free-form': <span className="text-xs">📄</span>,
  'image-labeling': <MousePointerClick className="h-3 w-3" />,
  'lesson': <span className="text-xs">📚</span>,
};

const PAGE_TYPE_LABELS: Record<PageType, string> = {
  'intro': 'Intro',
  'vocabulary-grid': 'Vocab',
  'conversation': 'Dialog',
  'cultural-tips': 'Culture',
  'revision': 'Quiz',
  'lexics': 'Lexics',
  'free-form': 'Free',
  'image-labeling': 'Label',
  'lesson': 'Lesson',
};

export function QuickUnitModal({ onCreateUnit, onClose }: QuickUnitModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('standard');
  const [unitTitle, setUnitTitle] = useState('');

  const handleCreate = () => {
    if (!unitTitle.trim()) return;

    const pages = generateTemplatePages(selectedTemplate, unitTitle.trim());
    onCreateUnit(unitTitle.trim(), pages);
  };

  const selectedTemplateData = UNIT_TEMPLATES.find((t) => t.id === selectedTemplate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg shadow-orange-500/30">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Quick Unit</h2>
              <p className="text-sm text-gray-500">Create a complete unit in one click</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Unit Title Input */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Unit Title
            </label>
            <input
              type="text"
              value={unitTitle}
              onChange={(e) => setUnitTitle(e.target.value)}
              placeholder="e.g., Fruits, At the Market, Family Members"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              autoFocus
            />
          </div>

          {/* Template Selection */}
          <div className="mb-6">
            <label className="mb-3 block text-sm font-medium text-gray-700">
              Choose Template
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {UNIT_TEMPLATES.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplate === template.id}
                  onSelect={() => setSelectedTemplate(template.id)}
                />
              ))}
            </div>
          </div>

          {/* Preview of pages */}
          {selectedTemplateData && (
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Pages that will be created:
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedTemplateData.pages.map((pageType, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm border"
                  >
                    {PAGE_TYPE_ICONS[pageType]}
                    <span>{PAGE_TYPE_LABELS[pageType]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t bg-gray-50 px-6 py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!unitTitle.trim()}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="h-4 w-4" />
            Create Unit
          </button>
        </div>
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: UnitTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`relative flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
        isSelected
          ? 'border-orange-500 bg-orange-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white shadow-md">
          <Check className="h-4 w-4" />
        </div>
      )}

      {/* Icon */}
      <span className="text-2xl">{template.icon}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900">{template.name}</h3>
        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
          {template.description}
        </p>
        <div className="mt-2 flex items-center gap-1">
          <span className="text-xs font-medium text-gray-400">
            {template.pages.length} pages
          </span>
        </div>
      </div>
    </button>
  );
}
