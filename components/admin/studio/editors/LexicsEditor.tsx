'use client';

import { useState } from 'react';
import { Plus, Trash2, QrCode, Loader2, Upload, Sparkles, Library } from 'lucide-react';
import { useVocabAutoComplete } from '@/hooks/useVocabAutoComplete';
import type { LexicsPage, LexicsWord } from '@/lib/studio/types';
import { generateId } from '@/lib/studio/types';
import { BulkImportModal } from './BulkImportModal';
import { CardLibraryModal, type ImportedCard } from './CardLibraryModal';

interface LexicsEditorProps {
  page: LexicsPage;
  stylePrompt: string;
  onUpdate: (page: LexicsPage) => void;
  onStylePromptSave?: (newStylePrompt: string) => void;
}

export function LexicsEditor({
  page,
  stylePrompt,
  onUpdate,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onStylePromptSave,
}: LexicsEditorProps) {
  const [loadingWordIndex, setLoadingWordIndex] = useState<number | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const { translate } = useVocabAutoComplete();

  const handleBulkImport = (words: LexicsWord[]) => {
    onUpdate({ ...page, words: [...page.words, ...words] });
  };

  const handleLibraryImport = (imported: ImportedCard[]) => {
    // Convert ImportedCard to LexicsWord format (no image in Lexics)
    const newWords: LexicsWord[] = imported.map((card) => ({
      id: generateId(),
      vietnamese: card.vietnamese,
      pronunciation: card.pronunciation || '',
      english: card.english,
      audioSlug: card.audioSlug,
    }));
    onUpdate({ ...page, words: [...page.words, ...newWords] });
    setShowLibrary(false);
  };

  const handleAddWord = () => {
    const newWord: LexicsWord = {
      id: generateId(),
      vietnamese: '',
      pronunciation: '',
      english: '',
    };
    onUpdate({ ...page, words: [...page.words, newWord] });
  };

  const handleUpdateWord = (index: number, field: keyof LexicsWord, value: string) => {
    const newWords = [...page.words];
    newWords[index] = { ...newWords[index], [field]: value };
    onUpdate({ ...page, words: newWords });
  };

  const handleRemoveWord = (index: number) => {
    const newWords = page.words.filter((_, i) => i !== index);
    onUpdate({ ...page, words: newWords });
  };

  const handleAddMultiple = () => {
    // Add 5 empty rows at once for quick entry
    const newWords: LexicsWord[] = Array.from({ length: 5 }, () => ({
      id: generateId(),
      vietnamese: '',
      pronunciation: '',
      english: '',
    }));
    onUpdate({ ...page, words: [...page.words, ...newWords] });
  };

  const handleBlur = async (
    index: number,
    field: 'vietnamese' | 'english',
    value: string
  ) => {
    const word = page.words[index];
    if (!word || !value.trim()) return;

    // Determine what needs to be filled
    const needsEnglish = field === 'vietnamese' && !word.english?.trim();
    const needsVietnamese = field === 'english' && !word.vietnamese?.trim();

    if (!needsEnglish && !needsVietnamese) return;

    setLoadingWordIndex(index);

    const direction = field === 'vietnamese' ? 'vi-to-en' : 'en-to-vi';
    const result = await translate(value, direction);

    if (result) {
      const newWords = [...page.words];
      newWords[index] = {
        ...newWords[index],
        ...(needsVietnamese && { vietnamese: result.vietnamese }),
        ...(needsEnglish && { english: result.english }),
        ...(!newWords[index].pronunciation && { pronunciation: result.pronunciation }),
      };
      onUpdate({ ...page, words: newWords });
    }

    setLoadingWordIndex(null);
  };

  return (
    <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-semibold text-gray-900">
        Lexics (Glossary) Editor
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
          placeholder="e.g., LEXICS - UNIT 6: FRUITS"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 font-semibold focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* AI Tip Banner */}
      {page.words.length === 0 && (
        <div className="mb-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-500" />
            <div className="text-sm">
              <p className="font-medium text-purple-900">AI-Powered Entry</p>
              <p className="mt-1 text-purple-700">
                Type Vietnamese → get English + pronunciation auto-filled, or vice versa!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Word Table */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Word List ({page.words.length} words)
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLibrary(true)}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-1 text-xs font-medium text-white shadow-sm transition-all hover:shadow-md"
            >
              <Library className="h-3.5 w-3.5" />
              From Library
            </button>
            <button
              onClick={() => setShowBulkImport(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-700"
            >
              <Upload className="h-3.5 w-3.5" />
              Bulk Import
            </button>
            <button
              onClick={handleAddMultiple}
              className="text-xs text-emerald-600 hover:text-emerald-700"
            >
              + Add 5 rows
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-600">
            <div className="col-span-4">Vietnamese</div>
            <div className="col-span-3">Pronunciation</div>
            <div className="col-span-4">English</div>
            <div className="col-span-1"></div>
          </div>

          {/* Table Body */}
          <div className="max-h-96 overflow-y-auto">
            {page.words.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No words yet. Click &quot;Add Word&quot; to start.
              </div>
            ) : (
              page.words.map((word, index) => (
                <div
                  key={word.id}
                  className="grid grid-cols-12 gap-2 border-t border-gray-100 px-4 py-2"
                >
                  <div className="col-span-4 relative">
                    <input
                      type="text"
                      value={word.vietnamese}
                      onChange={(e) => handleUpdateWord(index, 'vietnamese', e.target.value)}
                      onBlur={(e) => handleBlur(index, 'vietnamese', e.target.value)}
                      placeholder="Chuối"
                      className={`w-full rounded border px-2 py-1.5 text-sm font-medium focus:border-emerald-500 focus:outline-none ${
                        loadingWordIndex === index && !word.vietnamese
                          ? 'animate-pulse border-emerald-300 bg-emerald-50'
                          : 'border-gray-300'
                      }`}
                    />
                    {loadingWordIndex === index && !word.vietnamese && (
                      <Loader2 className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-emerald-500" />
                    )}
                  </div>
                  <div className="col-span-3 relative">
                    <input
                      type="text"
                      value={word.pronunciation}
                      onChange={(e) => handleUpdateWord(index, 'pronunciation', e.target.value)}
                      placeholder="/chwoy/"
                      className={`w-full rounded border px-2 py-1.5 text-sm text-gray-500 focus:border-emerald-500 focus:outline-none ${
                        loadingWordIndex === index && !word.pronunciation
                          ? 'animate-pulse border-emerald-300 bg-emerald-50'
                          : 'border-gray-300'
                      }`}
                    />
                    {loadingWordIndex === index && !word.pronunciation && (
                      <Loader2 className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-emerald-500" />
                    )}
                  </div>
                  <div className="col-span-4 relative">
                    <input
                      type="text"
                      value={word.english}
                      onChange={(e) => handleUpdateWord(index, 'english', e.target.value)}
                      onBlur={(e) => handleBlur(index, 'english', e.target.value)}
                      placeholder="Banana"
                      className={`w-full rounded border px-2 py-1.5 text-sm focus:border-emerald-500 focus:outline-none ${
                        loadingWordIndex === index && !word.english
                          ? 'animate-pulse border-emerald-300 bg-emerald-50'
                          : 'border-gray-300'
                      }`}
                    />
                    {loadingWordIndex === index && !word.english && (
                      <Loader2 className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-emerald-500" />
                    )}
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <button
                      onClick={() => handleRemoveWord(index)}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={handleAddWord}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-emerald-500 hover:text-emerald-600"
        >
          <Plus className="h-4 w-4" />
          Add Word
        </button>
      </div>

      {/* QR Code Toggle */}
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={page.showQRCode}
          onChange={(e) => onUpdate({ ...page, showQRCode: e.target.checked })}
          className="rounded text-emerald-600 focus:ring-emerald-500"
        />
        <QrCode className="h-4 w-4" />
        Show QR code for audio playlist
      </label>

      {/* Preview */}
      <div className="mt-8 rounded-lg border bg-gray-50 p-6">
        <h3 className="mb-4 text-sm font-medium text-gray-500">Preview</h3>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h4 className="mb-4 text-center text-lg font-bold text-gray-900">{page.title}</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-semibold">Vietnamese</th>
                <th className="pb-2 font-semibold">Pronunciation</th>
                <th className="pb-2 font-semibold">English</th>
              </tr>
            </thead>
            <tbody>
              {page.words.slice(0, 10).map((word) => (
                <tr key={word.id} className="border-b border-gray-100">
                  <td className="py-1.5 font-medium">{word.vietnamese || '—'}</td>
                  <td className="py-1.5 text-gray-500">{word.pronunciation || '—'}</td>
                  <td className="py-1.5">{word.english || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {page.words.length > 10 && (
            <p className="mt-2 text-center text-xs text-gray-400">
              + {page.words.length - 10} more words
            </p>
          )}
        </div>
      </div>

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkImportModal
          onImport={handleBulkImport}
          onClose={() => setShowBulkImport(false)}
        />
      )}

      {/* Card Library Modal */}
      {showLibrary && (
        <CardLibraryModal
          onImport={handleLibraryImport}
          onClose={() => setShowLibrary(false)}
          maxCards={50}
        />
      )}
    </div>
  );
}
