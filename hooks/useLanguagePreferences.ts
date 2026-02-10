'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LanguagePreferences,
  DEFAULT_PREFERENCES,
  getLanguagePreferences,
  saveLanguagePreferences,
} from '@/lib/language-preferences';

/**
 * React hook for managing language display preferences
 * Handles localStorage persistence and hydration safety
 */
export function useLanguagePreferences() {
  const [preferences, setPreferences] = useState<LanguagePreferences>(DEFAULT_PREFERENCES);
  const [hasMounted, setHasMounted] = useState(false);

  // Load preferences from localStorage on mount (after hydration)
  useEffect(() => {
    setHasMounted(true);
    setPreferences(getLanguagePreferences());
  }, []);

  // Update a single preference field
  const updatePreference = useCallback(
    <K extends keyof LanguagePreferences>(
      key: K,
      value: LanguagePreferences[K]
    ) => {
      const newPreferences = { ...preferences, [key]: value };
      setPreferences(newPreferences);
      saveLanguagePreferences(newPreferences);
    },
    [preferences]
  );

  // Update all preferences at once
  const setAllPreferences = useCallback((newPreferences: LanguagePreferences) => {
    setPreferences(newPreferences);
    saveLanguagePreferences(newPreferences);
  }, []);

  return {
    preferences,
    updatePreference,
    setAllPreferences,
    hasMounted,
  };
}
