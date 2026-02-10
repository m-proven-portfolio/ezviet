'use client';

import { useState } from 'react';
import { ImagePlus, Sparkles, Upload, FolderOpen } from 'lucide-react';
import type { IntroPage } from '@/lib/studio/types';
import { ImageSourcePicker } from '../ImageSourcePicker';

interface IntroPageEditorProps {
  page: IntroPage;
  stylePrompt: string;
  onUpdate: (page: IntroPage) => void;
  onStylePromptSave?: (newStylePrompt: string) => void;
}

export function IntroPageEditor({
  page,
  stylePrompt,
  onUpdate,
  onStylePromptSave,
}: IntroPageEditorProps) {
  const [showImagePicker, setShowImagePicker] = useState(false);

  const handleChange = (field: keyof IntroPage, value: string) => {
    onUpdate({ ...page, [field]: value });
  };

  const handleImageSelect = (imageUrl: string) => {
    onUpdate({ ...page, illustration: imageUrl });
    setShowImagePicker(false);
  };

  return (
    <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-semibold text-gray-900">
        Intro Page Editor
      </h2>

      {/* Hero Image */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Hero Illustration
        </label>
        <div
          className="relative flex h-48 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-emerald-500 hover:bg-emerald-50"
          onClick={() => setShowImagePicker(true)}
        >
          {page.illustration ? (
            <>
              <img
                src={page.illustration}
                alt="Hero illustration"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                <span className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700">
                  Change Image
                </span>
              </div>
            </>
          ) : (
            <div className="text-center">
              <ImagePlus className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                Click to add illustration
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Generate, select from cards, or upload
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Unit Number */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Unit/Chapter Number (optional)
        </label>
        <input
          type="text"
          value={page.unitNumber || ''}
          onChange={(e) => handleChange('unitNumber', e.target.value)}
          placeholder="e.g., Unit 6 or Chapter 1"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Title (English)
        </label>
        <input
          type="text"
          value={page.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g., FRUITS"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-lg font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {/* Vietnamese Title */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Vietnamese Title (optional)
        </label>
        <input
          type="text"
          value={page.titleVietnamese || ''}
          onChange={(e) => handleChange('titleVietnamese', e.target.value)}
          placeholder="e.g., Trái Cây"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {/* Subtitle */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Subtitle/Description (optional)
        </label>
        <textarea
          value={page.subtitle || ''}
          onChange={(e) => handleChange('subtitle', e.target.value)}
          placeholder="e.g., Learn to buy fruit at the Vietnamese market!"
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {/* Preview */}
      <div className="mt-8 rounded-lg border bg-gray-50 p-6">
        <h3 className="mb-4 text-sm font-medium text-gray-500">Preview</h3>
        <div className="aspect-[3/4] max-w-xs mx-auto rounded-lg bg-white shadow-lg overflow-hidden">
          {page.illustration && (
            <div className="h-1/2 bg-gray-100">
              <img
                src={page.illustration}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="flex flex-col items-center justify-center p-4 text-center">
            {page.unitNumber && (
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">
                {page.unitNumber}
              </p>
            )}
            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              {page.title || 'Title'}
            </h1>
            {page.titleVietnamese && (
              <p className="mt-1 text-lg text-gray-600">
                ({page.titleVietnamese})
              </p>
            )}
            {page.subtitle && (
              <p className="mt-3 text-sm text-gray-500">{page.subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Image Picker Modal */}
      {showImagePicker && (
        <ImageSourcePicker
          stylePrompt={stylePrompt}
          contentPromptSuggestion={`${page.title || 'intro'} page illustration for Vietnamese learning book`}
          imageContext="intro"
          onSelect={handleImageSelect}
          onClose={() => setShowImagePicker(false)}
          onStylePromptSave={onStylePromptSave}
        />
      )}
    </div>
  );
}
