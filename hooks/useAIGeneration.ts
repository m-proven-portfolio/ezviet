'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// Translation direction type
export type TranslationDirection = 'en-to-vi' | 'vi-to-en';

// Response from /api/generate endpoints (unified structure)
export interface AIGeneratedFields {
  english?: string; // Only present in vi-to-en mode
  vietnamese_south: string;
  vietnamese_south_phonetic: string;
  vietnamese_north: string | null;
  vietnamese_north_phonetic: string | null;
  slug: string;
  meta_description: string;
  prompt_version: string;
}

// Track which fields have been manually edited by the admin
export interface FieldDirtyState {
  english: boolean;
  vietnamese_south: boolean;
  vietnamese_south_romanization: boolean;
  vietnamese_north: boolean;
  vietnamese_north_romanization: boolean;
  slug: boolean;
  meta_description: boolean;
}

interface UseAIGenerationOptions {
  direction?: TranslationDirection;
  debounceMs?: number;
  onGenerated?: (fields: AIGeneratedFields) => void;
  onError?: (error: string) => void;
}

const initialDirtyState: FieldDirtyState = {
  english: false,
  vietnamese_south: false,
  vietnamese_south_romanization: false,
  vietnamese_north: false,
  vietnamese_north_romanization: false,
  slug: false,
  meta_description: false,
};

export function useAIGeneration(options: UseAIGenerationOptions = {}) {
  const { direction = 'en-to-vi', debounceMs = 600, onGenerated, onError } = options;

  const [isGenerating, setIsGenerating] = useState(false);
  const [lastInput, setLastInput] = useState('');
  const [generatedFields, setGeneratedFields] = useState<AIGeneratedFields | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track which fields have been manually edited
  const [dirtyFields, setDirtyFields] = useState<FieldDirtyState>(initialDirtyState);

  // Refs for debounce timer and abort controller
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // Mark a field as manually edited (dirty)
  const markFieldDirty = useCallback((field: keyof FieldDirtyState) => {
    setDirtyFields(prev => ({ ...prev, [field]: true }));
  }, []);

  // Reset all dirty state (when English word changes significantly)
  const resetDirtyFields = useCallback(() => {
    setDirtyFields(initialDirtyState);
  }, []);

  // Check if a specific field should be auto-updated
  const shouldUpdateField = useCallback((field: keyof FieldDirtyState) => {
    return !dirtyFields[field];
  }, [dirtyFields]);

  // Generate translations based on direction
  const generate = useCallback(async (inputWord: string) => {
    const trimmed = inputWord.trim();

    // Skip if empty
    if (trimmed.length === 0) {
      return;
    }

    // Skip if same as last input
    if (trimmed === lastInput) {
      return;
    }

    // Cancel any pending debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Cancel any in-flight request
    if (abortController.current) {
      abortController.current.abort();
    }

    // Check if the word root changed significantly (first 3 chars)
    // If so, reset dirty fields since it's essentially a new word
    const wordRoot = trimmed.toLowerCase().slice(0, 3);
    const lastWordRoot = lastInput.toLowerCase().slice(0, 3);
    if (wordRoot !== lastWordRoot && lastInput.length > 0) {
      resetDirtyFields();
    }

    setLastInput(trimmed);

    // Debounce the API call
    debounceTimer.current = setTimeout(async () => {
      setIsGenerating(true);
      setError(null);

      abortController.current = new AbortController();

      try {
        // Route to correct endpoint based on direction
        const endpoint = direction === 'vi-to-en' ? '/api/generate/vi-to-en' : '/api/generate';
        const bodyKey = direction === 'vi-to-en' ? 'vietnamese' : 'english';

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [bodyKey]: trimmed }),
          signal: abortController.current.signal,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Generation failed');
        }

        const result: AIGeneratedFields = await response.json();
        setGeneratedFields(result);
        onGenerated?.(result);
      } catch (err) {
        // Ignore abort errors (user typed again before request completed)
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        const message = err instanceof Error ? err.message : 'Generation failed';
        setError(message);
        onError?.(message);
      } finally {
        setIsGenerating(false);
      }
    }, debounceMs);
  }, [direction, lastInput, debounceMs, onGenerated, onError, resetDirtyFields]);

  // Reset all state (useful when direction changes)
  const resetAll = useCallback(() => {
    setLastInput('');
    setGeneratedFields(null);
    setError(null);
    resetDirtyFields();
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    if (abortController.current) {
      abortController.current.abort();
    }
  }, [resetDirtyFields]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  return {
    generate,
    isGenerating,
    generatedFields,
    error,
    direction,
    dirtyFields,
    markFieldDirty,
    shouldUpdateField,
    resetDirtyFields,
    resetAll,
  };
}
