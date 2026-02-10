'use client';

import { useState, useRef, useCallback } from 'react';

export type TranslationDirection = 'vi-to-en' | 'en-to-vi';

export interface VocabAutoCompleteResult {
  vietnamese: string;
  english: string;
  pronunciation: string;
}

interface AIGenerateResponse {
  english?: string;
  vietnamese_south: string;
  vietnamese_south_phonetic: string;
}

export function useVocabAutoComplete() {
  const [isLoading, setIsLoading] = useState(false);
  const abortController = useRef<AbortController | null>(null);

  const translate = useCallback(
    async (
      input: string,
      direction: TranslationDirection
    ): Promise<VocabAutoCompleteResult | null> => {
      const trimmed = input.trim();
      if (!trimmed) return null;

      // Cancel any in-flight request
      if (abortController.current) {
        abortController.current.abort();
      }

      abortController.current = new AbortController();
      setIsLoading(true);

      try {
        const endpoint =
          direction === 'vi-to-en' ? '/api/generate/vi-to-en' : '/api/generate';
        const bodyKey = direction === 'vi-to-en' ? 'vietnamese' : 'english';

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [bodyKey]: trimmed }),
          signal: abortController.current.signal,
        });

        if (!response.ok) {
          return null;
        }

        const result: AIGenerateResponse = await response.json();

        return {
          vietnamese: result.vietnamese_south,
          english: result.english ?? trimmed, // In en-to-vi, english is the input
          pronunciation: result.vietnamese_south_phonetic,
        };
      } catch (err) {
        // Silently ignore errors (including aborts)
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const cancel = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
    setIsLoading(false);
  }, []);

  return { translate, isLoading, cancel };
}
