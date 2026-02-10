/**
 * Theme Preferences
 * Controls light/dark mode and future seasonal themes (Tet, etc.)
 */

const STORAGE_KEY = 'ezviet_theme_prefs';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ThemeStyle = 'default' | 'tet' | 'christmas';

export interface ThemePreferences {
  mode: ThemeMode;
  style: ThemeStyle;
}

export const DEFAULT_PREFERENCES: ThemePreferences = {
  mode: 'system',
  style: 'default',
};

/**
 * Validate that stored preferences are well-formed
 */
function isValidPreferences(data: unknown): data is ThemePreferences {
  if (!data || typeof data !== 'object') return false;

  const prefs = data as Record<string, unknown>;

  const validModes: ThemeMode[] = ['system', 'light', 'dark'];
  const validStyles: ThemeStyle[] = ['default', 'tet', 'christmas'];

  return (
    validModes.includes(prefs.mode as ThemeMode) &&
    validStyles.includes(prefs.style as ThemeStyle)
  );
}

/**
 * Get theme preferences from localStorage
 * Returns defaults if localStorage unavailable or data invalid
 */
export function getThemePreferences(): ThemePreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_PREFERENCES;
    }

    const parsed: unknown = JSON.parse(stored);

    if (!isValidPreferences(parsed)) {
      // Invalid data - reset to defaults
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PREFERENCES));
      return DEFAULT_PREFERENCES;
    }

    return parsed;
  } catch (error) {
    // Parse error - reset to defaults
    console.error('Failed to parse theme preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save theme preferences to localStorage
 */
export function saveThemePreferences(prefs: ThemePreferences): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error('Failed to save theme preferences:', error);
  }
}

/**
 * Get the resolved theme (light or dark) based on mode and system preference
 */
export function getResolvedTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'light' || mode === 'dark') {
    return mode;
  }

  // mode === 'system'
  if (typeof window === 'undefined') {
    return 'light'; // SSR default
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * Apply theme to document
 * Sets data-theme and data-style attributes on <html>
 */
export function applyTheme(prefs: ThemePreferences): void {
  if (typeof document === 'undefined') return;

  const resolvedTheme = getResolvedTheme(prefs.mode);
  document.documentElement.setAttribute('data-theme', resolvedTheme);
  document.documentElement.setAttribute('data-style', prefs.style);
}
