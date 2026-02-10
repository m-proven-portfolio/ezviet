'use client';

import { ChevronDown, ChevronRight, MessageSquare, Grid3X3, Palette, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import type { LessonPage } from '@/lib/studio/types';
import { DialogueSectionEditor } from './LessonPageEditor/DialogueSectionEditor';
import { VocabSectionEditor } from './LessonPageEditor/VocabSectionEditor';
import { TastesSectionEditor } from './LessonPageEditor/TastesSectionEditor';
import { TipsSectionEditor } from './LessonPageEditor/TipsSectionEditor';

interface LessonPageEditorProps {
  page: LessonPage;
  stylePrompt: string;
  onUpdate: (page: LessonPage) => void;
  onStylePromptSave?: (newStylePrompt: string) => void;
}

const SECTION_CONFIG = [
  { key: 'dialogue' as const, label: 'Dialogue', icon: MessageSquare, color: 'blue' },
  { key: 'vocabulary' as const, label: 'Vocabulary', icon: Grid3X3, color: 'emerald' },
  { key: 'tastes' as const, label: 'Tastes', icon: Palette, color: 'purple' },
  { key: 'culturalTips' as const, label: 'Cultural Tips', icon: Lightbulb, color: 'amber' },
] as const;

export function LessonPageEditor({ page, stylePrompt, onUpdate, onStylePromptSave }: LessonPageEditorProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(Object.entries(page.sections).filter(([, v]) => v).map(([k]) => k))
  );

  const handleTitleChange = (title: string) => {
    onUpdate({ ...page, title });
  };

  const handleSubtitleChange = (subtitle: string) => {
    onUpdate({ ...page, subtitle });
  };

  const handleSectionToggle = (sectionKey: keyof LessonPage['sections']) => {
    const newSections = { ...page.sections, [sectionKey]: !page.sections[sectionKey] };

    // Update expanded state
    const newExpanded = new Set(expandedSections);
    if (newSections[sectionKey]) {
      newExpanded.add(sectionKey);
    } else {
      newExpanded.delete(sectionKey);
    }
    setExpandedSections(newExpanded);

    onUpdate({ ...page, sections: newSections });
  };

  const toggleExpand = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey);
    } else {
      newExpanded.add(sectionKey);
    }
    setExpandedSections(newExpanded);
  };

  const getColorClasses = (color: string, isActive: boolean) => {
    if (!isActive) return 'bg-gray-100 text-gray-400 border-gray-200';
    switch (color) {
      case 'blue': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'emerald': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'purple': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'amber': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-semibold text-gray-900">Lesson Page Editor</h2>

      {/* Title & Subtitle */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Lesson Title
          </label>
          <input
            type="text"
            value={page.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g., Bài 6: Trái cây (Fruits)"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Subtitle (optional)
          </label>
          <input
            type="text"
            value={page.subtitle || ''}
            onChange={(e) => handleSubtitleChange(e.target.value)}
            placeholder="e.g., At the fruit market"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Section Toggles */}
      <div className="mb-6">
        <label className="mb-3 block text-sm font-medium text-gray-700">
          Sections to Include
        </label>
        <div className="flex flex-wrap gap-2">
          {SECTION_CONFIG.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSectionToggle(key)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                page.sections[key]
                  ? getColorClasses(color, true)
                  : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {page.sections[key] && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/50 text-xs">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Section Editors */}
      <div className="space-y-4">
        {SECTION_CONFIG.map(({ key, label, icon: Icon, color }) => {
          if (!page.sections[key]) return null;
          const isExpanded = expandedSections.has(key);

          return (
            <div key={key} className={`rounded-lg border ${getColorClasses(color, true)}`}>
              {/* Section Header */}
              <button
                type="button"
                onClick={() => toggleExpand(key)}
                className="flex w-full items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-2 font-medium">
                  <Icon className="h-5 w-5" />
                  {label}
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </button>

              {/* Section Content */}
              {isExpanded && (
                <div className="border-t border-current/10 bg-white p-4">
                  {key === 'dialogue' && (
                    <DialogueSectionEditor
                      dialogue={page.dialogue}
                      stylePrompt={stylePrompt}
                      onUpdate={(dialogue) => onUpdate({ ...page, dialogue })}
                    />
                  )}
                  {key === 'vocabulary' && (
                    <VocabSectionEditor
                      vocabulary={page.vocabulary}
                      stylePrompt={stylePrompt}
                      onUpdate={(vocabulary) => onUpdate({ ...page, vocabulary })}
                    />
                  )}
                  {key === 'tastes' && (
                    <TastesSectionEditor
                      tastes={page.tastes}
                      stylePrompt={stylePrompt}
                      onUpdate={(tastes) => onUpdate({ ...page, tastes })}
                    />
                  )}
                  {key === 'culturalTips' && (
                    <TipsSectionEditor
                      culturalTips={page.culturalTips}
                      onUpdate={(culturalTips) => onUpdate({ ...page, culturalTips })}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {!Object.values(page.sections).some(Boolean) && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
          <p>Toggle sections above to start building your lesson page</p>
        </div>
      )}
    </div>
  );
}
