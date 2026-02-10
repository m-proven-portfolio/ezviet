'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ThemePreferences,
  ThemeMode,
  ThemeStyle,
  DEFAULT_PREFERENCES,
  getThemePreferences,
  saveThemePreferences,
  applyTheme,
  getResolvedTheme,
} from '@/lib/theme-preferences';

/**
 * React hook for managing theme preferences
 * Handles localStorage persistence, hydration safety, and system preference changes
 */
export function useThemePreferences() {
  const [preferences, setPreferences] = useState<ThemePreferences>(DEFAULT_PREFERENCES);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [hasMounted, setHasMounted] = useState(false);

  // Load preferences from localStorage on mount (after hydration)
  useEffect(() => {
    setHasMounted(true);
    const prefs = getThemePreferences();
    setPreferences(prefs);
    setResolvedTheme(getResolvedTheme(prefs.mode));
    applyTheme(prefs);
  }, []);

  // Listen for system theme changes when mode is 'system'
  useEffect(() => {
    if (preferences.mode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const newResolvedTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(newResolvedTheme);
      document.documentElement.setAttribute('data-theme', newResolvedTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preferences.mode]);

  // Update theme mode (light/dark/system)
  const setMode = useCallback((mode: ThemeMode) => {
    const newPreferences = { ...preferences, mode };
    setPreferences(newPreferences);
    saveThemePreferences(newPreferences);
    setResolvedTheme(getResolvedTheme(mode));
    applyTheme(newPreferences);
  }, [preferences]);

  // Update theme style (default/tet/christmas)
  const setStyle = useCallback((style: ThemeStyle) => {
    const newPreferences = { ...preferences, style };
    setPreferences(newPreferences);
    saveThemePreferences(newPreferences);
    applyTheme(newPreferences);
  }, [preferences]);

  // Update all preferences at once
  const setAllPreferences = useCallback((newPreferences: ThemePreferences) => {
    setPreferences(newPreferences);
    saveThemePreferences(newPreferences);
    setResolvedTheme(getResolvedTheme(newPreferences.mode));
    applyTheme(newPreferences);
  }, []);

  // Toggle between light and dark (useful for quick toggle buttons)
  const toggleTheme = useCallback(() => {
    const newMode: ThemeMode = resolvedTheme === 'dark' ? 'light' : 'dark';
    setMode(newMode);
  }, [resolvedTheme, setMode]);

  return {
    preferences,
    resolvedTheme,
    setMode,
    setStyle,
    setAllPreferences,
    toggleTheme,
    hasMounted,
    isDark: resolvedTheme === 'dark',
  };
}
