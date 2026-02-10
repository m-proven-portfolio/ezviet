'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Monitor, Moon, Sun, Globe } from 'lucide-react';
import Link from 'next/link';
import { useThemeContext } from '@/contexts/ThemeContext';
import type { ThemeMode } from '@/lib/theme-preferences';

const LANGUAGE_STORAGE_KEY = 'ezviet_language';

type LanguageCode = 'en' | 'vi';

interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
}

const languageOptions: LanguageOption[] = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'vi',
    label: 'Vietnamese',
    nativeLabel: 'Tiếng Việt',
    flag: '🇻🇳',
  },
];

const themeOptions: { mode: ThemeMode; label: string; icon: typeof Sun; description: string }[] = [
  {
    mode: 'system',
    label: 'System',
    icon: Monitor,
    description: 'Follow your device settings',
  },
  {
    mode: 'light',
    label: 'Light',
    icon: Sun,
    description: 'Always use light mode',
  },
  {
    mode: 'dark',
    label: 'Dark',
    icon: Moon,
    description: 'Always use dark mode',
  },
];

function getStoredLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'en' || stored === 'vi') return stored;
  } catch {
    // Ignore localStorage errors
  }
  return 'en';
}

function setStoredLanguage(code: LanguageCode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch {
    // Ignore localStorage errors
  }
}

export default function SettingsPage() {
  const { preferences, setMode, hasMounted } = useThemeContext();
  const [language, setLanguage] = useState<LanguageCode>('en');

  // Load language preference on mount
  useEffect(() => {
    setLanguage(getStoredLanguage());
  }, []);

  const handleLanguageChange = (code: LanguageCode) => {
    setLanguage(code);
    setStoredLanguage(code);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-(--surface-card) border-b border-(--border-default)">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 -ml-2 rounded-lg hover:bg-(--interactive-subtle) transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-(--text-secondary)" />
          </Link>
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Appearance Section */}
        <section>
          <h2 className="text-sm font-medium text-(--text-secondary) uppercase tracking-wider mb-4">
            Appearance
          </h2>

          <div className="bg-(--surface-card) rounded-xl border border-(--border-default) overflow-hidden">
            <div className="p-4 border-b border-(--border-subtle)">
              <h3 className="font-medium text-foreground">Theme</h3>
              <p className="text-sm text-(--text-secondary) mt-1">
                Choose how EZViet looks to you
              </p>
            </div>

            <div className="p-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = hasMounted && preferences.mode === option.mode;

                return (
                  <button
                    key={option.mode}
                    onClick={() => setMode(option.mode)}
                    className={`
                      w-full flex items-center gap-4 p-3 rounded-lg transition-colors
                      ${isSelected
                        ? 'bg-(--interactive-subtle) text-(--interactive)'
                        : 'hover:bg-(--surface-elevated) text-foreground'
                      }
                    `}
                  >
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        ${isSelected
                          ? 'bg-(--interactive) text-white'
                          : 'bg-(--surface-elevated) text-(--text-secondary)'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-(--text-secondary)">
                        {option.description}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-(--interactive)" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Language Section */}
        <section className="mt-8">
          <h2 className="text-sm font-medium text-(--text-secondary) uppercase tracking-wider mb-4">
            Language
          </h2>

          <div className="bg-(--surface-card) rounded-xl border border-(--border-default) overflow-hidden">
            <div className="p-4 border-b border-(--border-subtle)">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-(--text-secondary)" />
                <h3 className="font-medium text-foreground">Interface Language</h3>
              </div>
              <p className="text-sm text-(--text-secondary) mt-1">
                Choose your preferred language for the app interface
              </p>
            </div>

            <div className="p-2">
              {languageOptions.map((option) => {
                const isSelected = hasMounted && language === option.code;

                return (
                  <button
                    key={option.code}
                    onClick={() => handleLanguageChange(option.code)}
                    className={`
                      w-full flex items-center gap-4 p-3 rounded-lg transition-colors
                      ${isSelected
                        ? 'bg-(--interactive-subtle) text-(--interactive)'
                        : 'hover:bg-(--surface-elevated) text-foreground'
                      }
                    `}
                  >
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-xl
                        ${isSelected
                          ? 'bg-(--interactive)'
                          : 'bg-(--surface-elevated)'
                        }
                      `}
                    >
                      {option.flag}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-(--text-secondary)">
                        {option.nativeLabel}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-(--interactive)" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Preview Card */}
        <section className="mt-8">
          <h2 className="text-sm font-medium text-(--text-secondary) uppercase tracking-wider mb-4">
            Preview
          </h2>

          <div className="bg-(--surface-card) rounded-xl border border-(--border-default) p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-jade-400 to-jade-600 flex items-center justify-center text-white font-bold text-xl">
                V
              </div>
              <div>
                <div className="font-semibold text-foreground">Vietnamese</div>
                <div className="text-sm text-(--text-secondary)">Tieng Viet</div>
              </div>
            </div>
            <p className="text-foreground">
              This is how content will look with your selected theme.
            </p>
            <div className="mt-4 flex gap-2">
              <span className="px-3 py-1 rounded-full text-sm bg-(--feedback-success-subtle) text-(--feedback-success)">
                Easy
              </span>
              <span className="px-3 py-1 rounded-full text-sm bg-(--feedback-warning-subtle) text-(--feedback-warning)">
                Medium
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
