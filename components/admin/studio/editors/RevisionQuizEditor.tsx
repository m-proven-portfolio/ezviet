'use client';

import { useState } from 'react';
import { ImagePlus, Plus, Trash2 } from 'lucide-react';
import type { RevisionPage, RevisionAnswer } from '@/lib/studio/types';
import { generateId } from '@/lib/studio/types';
import { ImageSourcePicker } from '../ImageSourcePicker';

interface RevisionQuizEditorProps {
  page: RevisionPage;
  stylePrompt: string;
  onUpdate: (page: RevisionPage) => void;
  onStylePromptSave?: (newStylePrompt: string) => void;
}

export function RevisionQuizEditor({
  page,
  stylePrompt,
  onUpdate,
  onStylePromptSave,
}: RevisionQuizEditorProps) {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [activeAnswerIndex, setActiveAnswerIndex] = useState<number | null>(null);
  const [imageTarget, setImageTarget] = useState<'header' | 'answer'>('header');

  const handleImageSelect = (imageUrl: string) => {
    if (imageTarget === 'header') {
      onUpdate({ ...page, headerImage: imageUrl });
    } else if (activeAnswerIndex !== null) {
      const newAnswers = [...page.answers];
      newAnswers[activeAnswerIndex] = { ...newAnswers[activeAnswerIndex], image: imageUrl };
      onUpdate({ ...page, answers: newAnswers });
    }
    setShowImagePicker(false);
    setActiveAnswerIndex(null);
  };

  const handleAddAnswer = () => {
    const newAnswer: RevisionAnswer = {
      id: generateId(),
      text: '',
    };
    onUpdate({ ...page, answers: [...page.answers, newAnswer] });
  };

  const handleUpdateAnswer = (index: number, field: keyof RevisionAnswer, value: string) => {
    const newAnswers = [...page.answers];
    newAnswers[index] = { ...newAnswers[index], [field]: value };
    onUpdate({ ...page, answers: newAnswers });
  };

  const handleRemoveAnswer = (index: number) => {
    const newAnswers = page.answers.filter((_, i) => i !== index);
    onUpdate({ ...page, answers: newAnswers });
  };

  const openAnswerImagePicker = (index: number) => {
    setImageTarget('answer');
    setActiveAnswerIndex(index);
    setShowImagePicker(true);
  };

  return (
    <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-semibold text-gray-900">
        Revision Quiz Editor
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
          placeholder="e.g., REVISION - FRUITS"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 font-semibold focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* Header Image (optional - boy/girl asking) */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Header Illustration (optional)
        </label>
        <div
          className="relative flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-pink-500"
          onClick={() => {
            setImageTarget('header');
            setShowImagePicker(true);
          }}
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

      {/* Prompt */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Question Prompt
        </label>
        <input
          type="text"
          value={page.prompt}
          onChange={(e) => onUpdate({ ...page, prompt: e.target.value })}
          placeholder="e.g., What fruit is it?"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* Romanization */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Romanization (optional)
        </label>
        <input
          type="text"
          value={page.promptRomanization || ''}
          onChange={(e) => onUpdate({ ...page, promptRomanization: e.target.value })}
          placeholder="e.g., /wot frut iz it/"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-500 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* Answer Options */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Answer Options
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {page.answers.map((answer, index) => (
            <div
              key={answer.id}
              className="relative rounded-lg border border-gray-200 bg-gray-50 p-3"
            >
              {/* Answer Image */}
              <div
                className="mb-2 flex h-20 cursor-pointer items-center justify-center overflow-hidden rounded border-2 border-dashed border-gray-300 bg-white transition-colors hover:border-pink-500"
                onClick={() => openAnswerImagePicker(index)}
              >
                {answer.image ? (
                  <img src={answer.image} alt="" className="h-full w-full object-contain" />
                ) : (
                  <ImagePlus className="h-6 w-6 text-gray-400" />
                )}
              </div>

              {/* Answer Text */}
              <input
                type="text"
                value={answer.text}
                onChange={(e) => handleUpdateAnswer(index, 'text', e.target.value)}
                placeholder="Answer"
                className="w-full rounded border border-gray-300 px-2 py-1 text-center text-sm focus:border-emerald-500 focus:outline-none"
              />

              {/* Delete Button */}
              <button
                onClick={() => handleRemoveAnswer(index)}
                className="absolute -right-2 -top-2 rounded-full bg-red-100 p-1 text-red-600 hover:bg-red-200"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleAddAnswer}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-pink-500 hover:text-pink-600"
        >
          <Plus className="h-4 w-4" />
          Add Answer Option
        </button>
      </div>

      {/* Preview */}
      <div className="mt-8 rounded-lg border bg-gray-50 p-6">
        <h3 className="mb-4 text-sm font-medium text-gray-500">Preview</h3>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h4 className="text-center text-lg font-bold text-gray-900">{page.title}</h4>
          <p className="mt-2 text-center text-gray-700">{page.prompt}</p>
          {page.promptRomanization && (
            <p className="text-center text-sm text-gray-400">{page.promptRomanization}</p>
          )}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {page.answers.map((answer) => (
              <div key={answer.id} className="rounded border bg-gray-50 p-2 text-center">
                {answer.image && (
                  <img src={answer.image} alt="" className="mx-auto h-12 w-12 object-contain" />
                )}
                <p className="mt-1 text-xs">{answer.text || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Image Picker Modal */}
      {showImagePicker && (
        <ImageSourcePicker
          stylePrompt={stylePrompt}
          contentPromptSuggestion={
            imageTarget === 'header'
              ? 'children asking questions, cartoon style'
              : page.answers[activeAnswerIndex || 0]?.text || 'quiz answer item'
          }
          imageContext={imageTarget === 'header' ? 'header' : 'vocab'}
          onSelect={handleImageSelect}
          onClose={() => {
            setShowImagePicker(false);
            setActiveAnswerIndex(null);
          }}
          onStylePromptSave={onStylePromptSave}
        />
      )}
    </div>
  );
}
