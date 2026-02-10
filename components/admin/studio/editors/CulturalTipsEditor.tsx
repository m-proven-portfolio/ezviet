'use client';

import { useState } from 'react';
import { ImagePlus, Plus, Trash2, Lightbulb } from 'lucide-react';
import type { CulturalTipsPage, CulturalSection } from '@/lib/studio/types';
import { generateId } from '@/lib/studio/types';
import { ImageSourcePicker } from '../ImageSourcePicker';

interface CulturalTipsEditorProps {
  page: CulturalTipsPage;
  stylePrompt: string;
  onUpdate: (page: CulturalTipsPage) => void;
  onStylePromptSave?: (newStylePrompt: string) => void;
}

export function CulturalTipsEditor({
  page,
  stylePrompt,
  onUpdate,
  onStylePromptSave,
}: CulturalTipsEditorProps) {
  const [showImagePicker, setShowImagePicker] = useState(false);

  const handleImageSelect = (imageUrl: string) => {
    onUpdate({ ...page, headerImage: imageUrl });
    setShowImagePicker(false);
  };

  const handleAddSection = () => {
    const newSection: CulturalSection = {
      id: generateId(),
      title: 'New Section',
      bullets: ['First point'],
    };
    onUpdate({ ...page, sections: [...page.sections, newSection] });
  };

  const handleUpdateSection = (index: number, field: keyof CulturalSection, value: string | string[]) => {
    const newSections = [...page.sections];
    newSections[index] = { ...newSections[index], [field]: value };
    onUpdate({ ...page, sections: newSections });
  };

  const handleRemoveSection = (index: number) => {
    const newSections = page.sections.filter((_, i) => i !== index);
    onUpdate({ ...page, sections: newSections });
  };

  const handleAddBullet = (sectionIndex: number) => {
    const newSections = [...page.sections];
    newSections[sectionIndex].bullets.push('New point');
    onUpdate({ ...page, sections: newSections });
  };

  const handleUpdateBullet = (sectionIndex: number, bulletIndex: number, value: string) => {
    const newSections = [...page.sections];
    newSections[sectionIndex].bullets[bulletIndex] = value;
    onUpdate({ ...page, sections: newSections });
  };

  const handleRemoveBullet = (sectionIndex: number, bulletIndex: number) => {
    const newSections = [...page.sections];
    newSections[sectionIndex].bullets = newSections[sectionIndex].bullets.filter((_, i) => i !== bulletIndex);
    onUpdate({ ...page, sections: newSections });
  };

  return (
    <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-semibold text-gray-900">
        Cultural Tips Editor
      </h2>

      {/* Page Title */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Page Title
        </label>
        <input
          type="text"
          value={page.title}
          onChange={(e) => onUpdate({ ...page, title: e.target.value })}
          placeholder="e.g., CULTURAL TIPS - UNIT 1"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 font-semibold focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* Header Image */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Header Illustration (optional)
        </label>
        <div
          className="relative flex h-36 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-amber-500"
          onClick={() => setShowImagePicker(true)}
        >
          {page.headerImage ? (
            <>
              <img src={page.headerImage} alt="Header" className="h-full w-full object-contain" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                <span className="rounded-lg bg-white px-4 py-2 text-sm font-medium">Change</span>
              </div>
            </>
          ) : (
            <div className="text-center">
              <ImagePlus className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-1 text-sm text-gray-500">Add illustration</p>
            </div>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Tip Sections
        </label>
        <div className="space-y-4">
          {page.sections.map((section, sectionIndex) => (
            <div key={section.id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => handleUpdateSection(sectionIndex, 'title', e.target.value)}
                  placeholder="Section Title"
                  className="flex-1 rounded border border-gray-300 px-3 py-1.5 font-semibold focus:border-emerald-500 focus:outline-none"
                />
                <button
                  onClick={() => handleRemoveSection(sectionIndex)}
                  className="ml-2 rounded p-1.5 text-gray-400 hover:bg-red-100 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                {section.bullets.map((bullet, bulletIndex) => (
                  <div key={bulletIndex} className="flex items-center gap-2">
                    <span className="text-amber-500">•</span>
                    <input
                      type="text"
                      value={bullet}
                      onChange={(e) => handleUpdateBullet(sectionIndex, bulletIndex, e.target.value)}
                      className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      onClick={() => handleRemoveBullet(sectionIndex, bulletIndex)}
                      className="rounded p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleAddBullet(sectionIndex)}
                  className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add bullet point
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleAddSection}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-amber-500 hover:text-amber-600"
        >
          <Plus className="h-4 w-4" />
          Add Section
        </button>
      </div>

      {/* Footer Tip */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Footer Tip (optional)
        </label>
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <Lightbulb className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
          <textarea
            value={page.footerTip || ''}
            onChange={(e) => onUpdate({ ...page, footerTip: e.target.value })}
            placeholder="Add a helpful tip for learners..."
            rows={2}
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Image Picker Modal */}
      {showImagePicker && (
        <ImageSourcePicker
          stylePrompt={stylePrompt}
          contentPromptSuggestion="Vietnamese cultural scene, people greeting or shopping"
          imageContext="scene"
          onSelect={handleImageSelect}
          onClose={() => setShowImagePicker(false)}
          onStylePromptSave={onStylePromptSave}
        />
      )}
    </div>
  );
}
