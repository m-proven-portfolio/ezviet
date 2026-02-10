'use client';

import { useState, useCallback } from 'react';
import { X, Sparkles, Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useVocabAutoComplete } from '@/hooks/useVocabAutoComplete';
import type { LexicsWord } from '@/lib/studio/types';
import { generateId } from '@/lib/studio/types';

interface BulkImportModalProps {
  onImport: (words: LexicsWord[]) => void;
  onClose: () => void;
}

interface ParsedWord {
  vietnamese: string;
  pronunciation: string;
  english: string;
  status: 'complete' | 'needs-ai' | 'processing' | 'error';
}

type DetectedFormat = 'tsv' | 'csv' | 'lines' | 'unknown';

function detectFormat(text: string): DetectedFormat {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length === 0) return 'unknown';

  const firstLine = lines[0];
  if (firstLine.includes('\t')) return 'tsv';
  if (firstLine.split(',').length >= 2) return 'csv';
  return 'lines';
}

function parseInput(text: string): ParsedWord[] {
  const format = detectFormat(text);
  const lines = text.trim().split('\n').filter(l => l.trim());

  return lines.map(line => {
    let parts: string[];

    if (format === 'tsv') {
      parts = line.split('\t').map(p => p.trim());
    } else if (format === 'csv') {
      parts = line.split(',').map(p => p.trim());
    } else {
      parts = [line.trim()];
    }

    const [vietnamese = '', pronunciation = '', english = ''] = parts;
    const isComplete = vietnamese && pronunciation && english;

    return {
      vietnamese,
      pronunciation,
      english,
      status: isComplete ? 'complete' : 'needs-ai',
    };
  });
}

export function BulkImportModal({ onImport, onClose }: BulkImportModalProps) {
  const [rawInput, setRawInput] = useState('');
  const [parsedWords, setParsedWords] = useState<ParsedWord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const { translate } = useVocabAutoComplete();

  const handleParse = useCallback(() => {
    const words = parseInput(rawInput);
    setParsedWords(words);
    setStep('preview');
  }, [rawInput]);

  const handleAIComplete = useCallback(async () => {
    setIsProcessing(true);
    const updated = [...parsedWords];

    for (let i = 0; i < updated.length; i++) {
      const word = updated[i];
      if (word.status !== 'needs-ai') continue;

      updated[i] = { ...word, status: 'processing' };
      setParsedWords([...updated]);

      // Determine what we have and what we need
      const hasVietnamese = word.vietnamese.trim();
      const hasEnglish = word.english.trim();

      if (hasVietnamese) {
        const result = await translate(word.vietnamese, 'vi-to-en');
        if (result) {
          updated[i] = {
            vietnamese: word.vietnamese,
            english: word.english || result.english,
            pronunciation: word.pronunciation || result.pronunciation,
            status: 'complete',
          };
        } else {
          updated[i] = { ...word, status: 'error' };
        }
      } else if (hasEnglish) {
        const result = await translate(word.english, 'en-to-vi');
        if (result) {
          updated[i] = {
            vietnamese: result.vietnamese,
            english: word.english,
            pronunciation: word.pronunciation || result.pronunciation,
            status: 'complete',
          };
        } else {
          updated[i] = { ...word, status: 'error' };
        }
      }

      setParsedWords([...updated]);
    }

    setIsProcessing(false);
  }, [parsedWords, translate]);

  const handleImport = useCallback(() => {
    const validWords: LexicsWord[] = parsedWords
      .filter(w => w.vietnamese && w.english)
      .map(w => ({
        id: generateId(),
        vietnamese: w.vietnamese,
        pronunciation: w.pronunciation,
        english: w.english,
      }));

    onImport(validWords);
    onClose();
  }, [parsedWords, onImport, onClose]);

  const format = detectFormat(rawInput);
  const needsAI = parsedWords.filter(w => w.status === 'needs-ai').length;
  const complete = parsedWords.filter(w => w.status === 'complete').length;
  const validCount = parsedWords.filter(w => w.vietnamese && w.english).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Bulk Import Words</h2>
            <p className="text-sm text-gray-500">Paste your vocabulary list from spreadsheets or docs</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="max-h-[calc(90vh-180px)] overflow-y-auto p-6">
          {step === 'input' ? (
            <>
              {/* Format Tips */}
              <div className="mb-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 text-purple-500" />
                  <div className="text-sm">
                    <p className="font-medium text-purple-900">AI-Powered Import</p>
                    <p className="mt-1 text-purple-700">
                      Just paste Vietnamese or English words - AI will auto-fill translations & pronunciation!
                    </p>
                  </div>
                </div>
              </div>

              {/* Format Examples */}
              <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Supported Formats
                </p>
                <div className="space-y-2 text-xs text-gray-600 font-mono">
                  <div><span className="text-emerald-600">Tab-separated:</span> Chuối⇥chooi⇥Banana</div>
                  <div><span className="text-emerald-600">Comma-separated:</span> Chuối, chooi, Banana</div>
                  <div><span className="text-emerald-600">Just Vietnamese:</span> Chuối (AI fills rest)</div>
                  <div><span className="text-emerald-600">Just English:</span> Banana (AI fills rest)</div>
                </div>
              </div>

              {/* Input Area */}
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="Paste your word list here...&#10;&#10;Example:&#10;Chuối&#9;chooi&#9;Banana&#10;Xoài&#9;soai&#9;Mango&#10;Măng cụt&#9;mang coot&#9;Mangosteen"
                rows={10}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-emerald-500 focus:outline-none"
              />

              {rawInput && (
                <p className="mt-2 text-xs text-gray-500">
                  Detected format: <span className="font-medium text-emerald-600">
                    {format === 'tsv' ? 'Tab-separated' : format === 'csv' ? 'Comma-separated' : 'Single column'}
                  </span>
                </p>
              )}
            </>
          ) : (
            <>
              {/* Preview Header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" /> {complete} complete
                  </span>
                  {needsAI > 0 && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <Sparkles className="h-4 w-4" /> {needsAI} need AI
                    </span>
                  )}
                </div>
                {needsAI > 0 && !isProcessing && (
                  <button
                    onClick={handleAIComplete}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 text-sm font-medium text-white hover:from-purple-600 hover:to-blue-600"
                  >
                    <Sparkles className="h-4 w-4" />
                    Auto-fill with AI
                  </button>
                )}
              </div>

              {/* Preview Table */}
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="grid grid-cols-12 gap-2 bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-600">
                  <div className="col-span-4">Vietnamese</div>
                  <div className="col-span-3">Pronunciation</div>
                  <div className="col-span-4">English</div>
                  <div className="col-span-1">Status</div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {parsedWords.map((word, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 border-t border-gray-100 px-4 py-2 text-sm">
                      <div className="col-span-4 font-medium">{word.vietnamese || <span className="text-gray-300">—</span>}</div>
                      <div className="col-span-3 text-gray-500">{word.pronunciation || <span className="text-gray-300">—</span>}</div>
                      <div className="col-span-4">{word.english || <span className="text-gray-300">—</span>}</div>
                      <div className="col-span-1 flex items-center justify-center">
                        {word.status === 'complete' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        {word.status === 'needs-ai' && <Sparkles className="h-4 w-4 text-amber-500" />}
                        {word.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                        {word.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-4">
          {step === 'input' ? (
            <>
              <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
                Cancel
              </button>
              <button
                onClick={handleParse}
                disabled={!rawInput.trim()}
                className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-gray-300"
              >
                Preview Import
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep('input')} className="text-sm text-gray-500 hover:text-gray-700">
                ← Back to edit
              </button>
              <button
                onClick={handleImport}
                disabled={validCount === 0 || isProcessing}
                className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-gray-300"
              >
                Import {validCount} words
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
