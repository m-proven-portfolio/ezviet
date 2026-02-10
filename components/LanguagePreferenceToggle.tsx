'use client';

import { useState } from 'react';
import { Languages } from 'lucide-react';
import type { LanguagePreferences } from '@/lib/language-preferences';

interface LanguagePreferenceToggleProps {
  preferences: LanguagePreferences;
  onChange: (preferences: LanguagePreferences) => void;
}

export function LanguagePreferenceToggle({
  preferences,
  onChange,
}: LanguagePreferenceToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = <K extends keyof LanguagePreferences>(
    key: K,
    value: LanguagePreferences[K]
  ) => {
    // Validation: Prevent hiding both languages
    if (key === 'showVietnamese' && !value && !preferences.showEnglish) {
      return; // Can't hide Vietnamese if English is also hidden
    }
    if (key === 'showEnglish' && !value && !preferences.showVietnamese) {
      return; // Can't hide English if Vietnamese is also hidden
    }

    onChange({ ...preferences, [key]: value });
  };

  const closeModal = () => setIsOpen(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 flex items-center justify-center rounded-full bg-white/60 backdrop-blur-md border border-white/40 shadow-lg hover:bg-white/80 transition-all duration-200 text-gray-800"
        title="Language settings"
      >
        <Languages className="w-6 h-6" />
      </button>

      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-200"
          onClick={closeModal}
        />
      )}

      {/* Modal drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Modal header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <Languages className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Language Settings
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Settings content */}
        <div className="px-6 py-6 space-y-6">
          {/* Display options */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Display:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  handleToggle('showVietnamese', !preferences.showVietnamese)
                }
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  preferences.showVietnamese
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                Vietnamese {preferences.showVietnamese ? '✓' : ''}
              </button>
              <button
                onClick={() =>
                  handleToggle('showEnglish', !preferences.showEnglish)
                }
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  preferences.showEnglish
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                English {preferences.showEnglish ? '✓' : ''}
              </button>
              <button
                onClick={() =>
                  handleToggle('showRomanization', !preferences.showRomanization)
                }
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  preferences.showRomanization
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                Pronunciation {preferences.showRomanization ? '✓' : ''}
              </button>
            </div>
          </div>

          {/* Vietnamese dialect */}
          {preferences.showVietnamese && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                Vietnamese Dialect:
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggle('vietnameseDialect', 'south')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    preferences.vietnameseDialect === 'south'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  South (Saigon)
                </button>
                <button
                  onClick={() => handleToggle('vietnameseDialect', 'north')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    preferences.vietnameseDialect === 'north'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  North (Hanoi)
                </button>
              </div>
            </div>
          )}

          {/* Help text */}
          <p className="text-xs text-gray-500 italic">
            These settings control what appears on your flashcards. At least one
            language must be visible.
          </p>
        </div>
      </div>
    </>
  );
}
