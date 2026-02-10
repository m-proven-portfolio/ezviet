'use client';

import { useState } from 'react';
import { ImagePlus, Trash2, Plus, Type, Image } from 'lucide-react';
import type { LessonPage, TastesImage } from '@/lib/studio/types';
import { generateId } from '@/lib/studio/types';
import { ImageSourcePicker } from '../../ImageSourcePicker';

interface TastesSectionEditorProps {
  tastes: LessonPage['tastes'];
  stylePrompt: string;
  onUpdate: (tastes: LessonPage['tastes']) => void;
}

export function TastesSectionEditor({
  tastes,
  stylePrompt,
  onUpdate,
}: TastesSectionEditorProps) {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  // Initialize tastes if needed
  const currentTastes = tastes || {
    sectionTitle: 'Tastes',
    contentType: 'text' as const,
    textContent: '',
    images: [],
  };

  const handleContentTypeChange = (contentType: 'text' | 'images') => {
    onUpdate({ ...currentTastes, contentType });
  };

  const handleTextChange = (textContent: string) => {
    onUpdate({ ...currentTastes, textContent });
  };

  const handleAddImage = () => {
    const newImage: TastesImage = {
      id: generateId(),
      image: '',
      caption: '',
      captionVietnamese: '',
    };
    onUpdate({
      ...currentTastes,
      images: [...(currentTastes.images || []), newImage],
    });
  };

  const handleImageChange = (
    index: number,
    field: keyof TastesImage,
    value: string
  ) => {
    const newImages = [...(currentTastes.images || [])];
    newImages[index] = { ...newImages[index], [field]: value };
    onUpdate({ ...currentTastes, images: newImages });
  };

  const handleRemoveImage = (index: number) => {
    const newImages = (currentTastes.images || []).filter((_, i) => i !== index);
    onUpdate({ ...currentTastes, images: newImages });
  };

  const handleImageSelect = (imageUrl: string) => {
    if (activeImageIndex !== null) {
      handleImageChange(activeImageIndex, 'image', imageUrl);
      setActiveImageIndex(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Section Title
        </label>
        <input
          type="text"
          value={currentTastes.sectionTitle || ''}
          onChange={(e) => onUpdate({ ...currentTastes, sectionTitle: e.target.value })}
          placeholder="e.g., Tastes, Did You Know?"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none"
        />
      </div>

      {/* Content Type Toggle */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Content Type
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleContentTypeChange('text')}
            className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
              currentTastes.contentType === 'text'
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Type className="h-4 w-4" />
            Text
          </button>
          <button
            type="button"
            onClick={() => handleContentTypeChange('images')}
            className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
              currentTastes.contentType === 'images'
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Image className="h-4 w-4" />
            Images
          </button>
        </div>
      </div>

      {/* Text Content */}
      {currentTastes.contentType === 'text' && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Text Content
          </label>
          <textarea
            value={currentTastes.textContent || ''}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Enter descriptive text about tastes, characteristics, etc."
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none"
          />
        </div>
      )}

      {/* Images Content */}
      {currentTastes.contentType === 'images' && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Images
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(currentTastes.images || []).map((img, index) => (
              <div key={img.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                {/* Image */}
                <div
                  onClick={() => setActiveImageIndex(index)}
                  className="relative mb-2 flex h-24 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-white transition-colors hover:border-purple-500"
                >
                  {img.image ? (
                    <img src={img.image} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <ImagePlus className="h-6 w-6 text-gray-400" />
                  )}
                </div>

                {/* Caption English */}
                <input
                  type="text"
                  value={img.caption || ''}
                  onChange={(e) => handleImageChange(index, 'caption', e.target.value)}
                  placeholder="Caption (English)"
                  className="mb-1 w-full rounded border px-2 py-1 text-xs"
                />

                {/* Caption Vietnamese */}
                <input
                  type="text"
                  value={img.captionVietnamese || ''}
                  onChange={(e) => handleImageChange(index, 'captionVietnamese', e.target.value)}
                  placeholder="Caption (Vietnamese)"
                  className="mb-1 w-full rounded border px-2 py-1 text-xs"
                />

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="mt-1 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddImage}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-purple-500 hover:text-purple-600"
          >
            <Plus className="h-4 w-4" />
            Add Image
          </button>
        </div>
      )}

      {/* Image Picker Modal */}
      {activeImageIndex !== null && (
        <ImageSourcePicker
          stylePrompt={stylePrompt}
          contentPromptSuggestion="taste illustration, food characteristic"
          imageContext="vocab"
          onSelect={handleImageSelect}
          onClose={() => setActiveImageIndex(null)}
        />
      )}
    </div>
  );
}
