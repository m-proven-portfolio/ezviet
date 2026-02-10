/**
 * Language Display Preferences
 * Controls what languages/dialects are shown on flashcards
 */

const STORAGE_KEY = 'ezviet_language_prefs';

export interface LanguagePreferences {
  showVietnamese: boolean;
  showEnglish: boolean;
  showRomanization: boolean;
  vietnameseDialect: 'north' | 'south';
}

export const DEFAULT_PREFERENCES: LanguagePreferences = {
  showVietnamese: true,
  showEnglish: true,
  showRomanization: true,
  vietnameseDialect: 'south',
};

/**
 * Validate that stored preferences are well-formed
 */
function isValidPreferences(data: unknown): data is LanguagePreferences {
  if (!data || typeof data !== 'object') return false;

  const prefs = data as Record<string, unknown>;

  return (
    typeof prefs.showVietnamese === 'boolean' &&
    typeof prefs.showEnglish === 'boolean' &&
    typeof prefs.showRomanization === 'boolean' &&
    (prefs.vietnameseDialect === 'north' || prefs.vietnameseDialect === 'south')
  );
}

/**
 * Get language preferences from localStorage
 * Returns defaults if localStorage unavailable or data invalid
 */
export function getLanguagePreferences(): LanguagePreferences {
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
    console.error('Failed to parse language preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save language preferences to localStorage
 * Validates that at least one language is visible
 */
export function saveLanguagePreferences(prefs: LanguagePreferences): void {
  if (typeof window === 'undefined') return;

  // Validation: At least one language must be shown
  if (!prefs.showVietnamese && !prefs.showEnglish) {
    console.warn('Cannot hide both languages - at least one must be visible');
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error('Failed to save language preferences:', error);
  }
}
