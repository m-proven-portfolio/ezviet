'use client';

import { useState } from 'react';
import { ImagePlus, Plus, Trash2, Loader2 } from 'lucide-react';
import { useVocabAutoComplete } from '@/hooks/useVocabAutoComplete';
import type { LessonPage, SimplifiedDialogueLine } from '@/lib/studio/types';
import { generateId } from '@/lib/studio/types';
import { ImageSourcePicker } from '../../ImageSourcePicker';

interface DialogueSectionEditorProps {
  dialogue: LessonPage['dialogue'];
  stylePrompt: string;
  onUpdate: (dialogue: LessonPage['dialogue']) => void;
}

export function DialogueSectionEditor({
  dialogue,
  stylePrompt,
  onUpdate,
}: DialogueSectionEditorProps) {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [translatingIndex, setTranslatingIndex] = useState<number | null>(null);
  const { translate } = useVocabAutoComplete();

  // Initialize dialogue if needed
  const currentDialogue = dialogue || {
    lines: [],
    showTranslations: true,
  };

  const handleSceneImageSelect = (imageUrl: string) => {
    onUpdate({ ...currentDialogue, sceneImage: imageUrl });
    setShowImagePicker(false);
  };

  const handleAddLine = () => {
    const newLine: SimplifiedDialogueLine = {
      id: generateId(),
      speaker: currentDialogue.lines.length % 2 === 0 ? 'A' : 'B',
      vietnamese: '',
      english: '',
    };
    onUpdate({ ...currentDialogue, lines: [...currentDialogue.lines, newLine] });
  };

  const handleLineChange = (
    index: number,
    field: keyof SimplifiedDialogueLine,
    value: string
  ) => {
    const newLines = [...currentDialogue.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    onUpdate({ ...currentDialogue, lines: newLines });
  };

  const handleRemoveLine = (index: number) => {
    const newLines = currentDialogue.lines.filter((_, i) => i !== index);
    onUpdate({ ...currentDialogue, lines: newLines });
  };

  const handleBlur = async (index: number, field: 'vietnamese' | 'english', value: string) => {
    if (!value.trim()) return;

    const line = currentDialogue.lines[index];
    const needsEnglish = field === 'vietnamese' && !line.english?.trim();
    const needsVietnamese = field === 'english' && !line.vietnamese?.trim();

    if (!needsEnglish && !needsVietnamese) return;

    setTranslatingIndex(index);
    const direction = field === 'vietnamese' ? 'vi-to-en' : 'en-to-vi';
    const result = await translate(value, direction);

    if (result) {
      const newLines = [...currentDialogue.lines];
      newLines[index] = {
        ...newLines[index],
        ...(needsVietnamese && { vietnamese: result.vietnamese }),
        ...(needsEnglish && { english: result.english }),
      };
      onUpdate({ ...currentDialogue, lines: newLines });
    }
    setTranslatingIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Scene Image */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Scene Image (optional)
        </label>
        <div
          onClick={() => setShowImagePicker(true)}
          className="relative flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-blue-500"
        >
          {currentDialogue.sceneImage ? (
            <>
              <img
                src={currentDialogue.sceneImage}
                alt="Scene"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                <span className="rounded bg-white px-2 py-1 text-xs font-medium">
                  Change Image
                </span>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-400">
              <ImagePlus className="mx-auto h-8 w-8" />
              <p className="mt-1 text-sm">Add scene image</p>
            </div>
          )}
        </div>
      </div>

      {/* Dialogue Lines */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Dialogue Lines</label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={currentDialogue.showTranslations}
              onChange={(e) =>
                onUpdate({ ...currentDialogue, showTranslations: e.target.checked })
              }
              className="rounded text-blue-600"
            />
            Show translations
          </label>
        </div>

        <div className="space-y-3">
          {currentDialogue.lines.map((line, index) => (
            <div
              key={line.id}
              className={`rounded-lg border p-3 ${
                line.speaker === 'A' ? 'border-blue-200 bg-blue-50/50' : 'border-amber-200 bg-amber-50/50'
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <select
                  value={line.speaker}
                  onChange={(e) => handleLineChange(index, 'speaker', e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                >
                  <option value="A">Speaker A</option>
                  <option value="B">Speaker B</option>
                  <option value="custom">Custom</option>
                </select>
                {line.speaker === 'custom' && (
                  <input
                    type="text"
                    value={line.speakerName || ''}
                    onChange={(e) => handleLineChange(index, 'speakerName', e.target.value)}
                    placeholder="Speaker name"
                    className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveLine(index)}
                  className="ml-auto rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={line.vietnamese}
                  onChange={(e) => handleLineChange(index, 'vietnamese', e.target.value)}
                  onBlur={(e) => handleBlur(index, 'vietnamese', e.target.value)}
                  placeholder="Vietnamese text"
                  className={`mb-2 w-full rounded border px-3 py-2 font-medium ${
                    translatingIndex === index && !line.english
                      ? 'animate-pulse border-blue-300 bg-blue-50'
                      : 'border-gray-300'
                  }`}
                />
                {translatingIndex === index && !line.english && (
                  <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-blue-500" />
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={line.english}
                  onChange={(e) => handleLineChange(index, 'english', e.target.value)}
                  onBlur={(e) => handleBlur(index, 'english', e.target.value)}
                  placeholder="English translation"
                  className={`w-full rounded border px-3 py-2 text-sm text-gray-600 ${
                    translatingIndex === index && !line.vietnamese
                      ? 'animate-pulse border-blue-300 bg-blue-50'
                      : 'border-gray-300'
                  }`}
                />
                {translatingIndex === index && !line.vietnamese && (
                  <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-blue-500" />
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddLine}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-blue-500 hover:text-blue-600"
        >
          <Plus className="h-4 w-4" />
          Add Dialogue Line
        </button>
      </div>

      {/* Image Picker Modal */}
      {showImagePicker && (
        <ImageSourcePicker
          stylePrompt={stylePrompt}
          contentPromptSuggestion="market scene, Vietnamese fruit shop"
          imageContext="scene"
          onSelect={handleSceneImageSelect}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </div>
  );
}
