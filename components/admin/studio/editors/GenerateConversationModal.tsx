'use client';

import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import type { DialogueLine, ConversationLayoutStyle } from '@/lib/studio/types';
import { generateId } from '@/lib/studio/types';

interface GeneratedDialogue {
  speaker: 'buyer' | 'seller';
  vietnamese: string;
  english: string;
  position: 'left' | 'right';
}

interface ConversationResponse {
  dialogues: GeneratedDialogue[];
  suggestedTitle: string;
  suggestedLayoutStyle: ConversationLayoutStyle;
}

interface GenerateConversationModalProps {
  onGenerate: (dialogues: DialogueLine[], title: string, layoutStyle: ConversationLayoutStyle) => void;
  onClose: () => void;
}

const TOPIC_SUGGESTIONS = [
  'At the fruit market',
  'Ordering coffee',
  'Buying clothes',
  'At the restaurant',
  'Asking for directions',
  'At the pharmacy',
];

export function GenerateConversationModal({
  onGenerate,
  onClose,
}: GenerateConversationModalProps) {
  const [topic, setTopic] = useState('');
  const [vocabularyWords, setVocabularyWords] = useState('');
  const [exchangeCount, setExchangeCount] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const vocabArray = vocabularyWords
        .split(',')
        .map((w) => w.trim())
        .filter((w) => w.length > 0);

      const response = await fetch('/api/studio/generate-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          vocabularyWords: vocabArray.length > 0 ? vocabArray : undefined,
          exchangeCount,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate conversation');
      }

      const data: ConversationResponse = await response.json();

      // Convert to DialogueLine format with IDs
      const dialogues: DialogueLine[] = data.dialogues.map((d) => ({
        id: generateId(),
        speaker: d.speaker,
        vietnamese: d.vietnamese,
        english: d.english,
        position: d.position,
      }));

      onGenerate(dialogues, data.suggestedTitle, data.suggestedLayoutStyle);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate conversation');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Magic Conversation</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Topic Input */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Conversation Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., At the fruit market"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              autoFocus
            />
            {/* Quick suggestions */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TOPIC_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setTopic(suggestion)}
                  className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600 hover:bg-purple-100 hover:text-purple-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Vocabulary Words (optional) */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Include Vocabulary <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={vocabularyWords}
              onChange={(e) => setVocabularyWords(e.target.value)}
              placeholder="e.g., banana, mango, how much"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
            <p className="mt-1 text-xs text-gray-500">
              Comma-separated words to include in the conversation
            </p>
          </div>

          {/* Exchange Count */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Number of Exchanges
            </label>
            <div className="flex gap-2">
              {[3, 4, 5, 6].map((count) => (
                <button
                  key={count}
                  onClick={() => setExchangeCount(count)}
                  className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-colors ${
                    exchangeCount === count
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-600 hover:border-purple-300'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating magic...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate Conversation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
