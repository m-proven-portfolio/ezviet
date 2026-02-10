'use client';

import { useState } from 'react';
import { X, Check, Music, Sparkles } from 'lucide-react';

const STORAGE_KEY_SHOWN = 'ezviet_karaoke_welcome_shown';
const STORAGE_KEY_PREFS = 'ezviet_karaoke_preferred_genres';

// Utility functions for localStorage
export function hasSeenWelcome(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(STORAGE_KEY_SHOWN) === 'true';
}

export function markWelcomeSeen(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_SHOWN, 'true');
}

export function getPreferredGenres(): string[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(STORAGE_KEY_PREFS);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

export function savePreferredGenres(genres: string[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(genres));
}

// Genre colors matching purple theme
const GENRE_STYLES: Record<string, { bg: string; selected: string }> = {
  'Lo-Fi': { bg: 'bg-violet-500/20', selected: 'border-violet-400 bg-violet-500/30' },
  'Hip-Hop': { bg: 'bg-pink-500/20', selected: 'border-pink-400 bg-pink-500/30' },
  'Vina House': { bg: 'bg-fuchsia-500/20', selected: 'border-fuchsia-400 bg-fuchsia-500/30' },
  Pop: { bg: 'bg-purple-500/20', selected: 'border-purple-400 bg-purple-500/30' },
  Ballad: { bg: 'bg-indigo-500/20', selected: 'border-indigo-400 bg-indigo-500/30' },
  EDM: { bg: 'bg-cyan-500/20', selected: 'border-cyan-400 bg-cyan-500/30' },
  'R&B': { bg: 'bg-rose-500/20', selected: 'border-rose-400 bg-rose-500/30' },
  Acoustic: { bg: 'bg-amber-500/20', selected: 'border-amber-400 bg-amber-500/30' },
};

interface KaraokeWelcomeModalProps {
  genres: string[]; // Only genres with songs
  onSelect: (genres: string[]) => void;
  onDismiss: () => void;
}

export function KaraokeWelcomeModal({ genres, onSelect, onDismiss }: KaraokeWelcomeModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (genre: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(genre)) {
        next.delete(genre);
      } else {
        next.add(genre);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const prefs = Array.from(selected);
    savePreferredGenres(prefs);
    markWelcomeSeen();
    onSelect(prefs);
  };

  const handleShowAll = () => {
    savePreferredGenres([]); // Empty = show all
    markWelcomeSeen();
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl border border-white/10 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Welcome to Karaoke!</h2>
          </div>
          <button
            onClick={handleShowAll}
            className="text-white/50 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-white/70 text-sm mb-6">
          What music styles do you enjoy? We&apos;ll show you songs that match your vibe.
        </p>

        {/* Genre Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {genres.map((genre) => {
            const isSelected = selected.has(genre);
            const style = GENRE_STYLES[genre] || GENRE_STYLES['Pop'];
            return (
              <button
                key={genre}
                onClick={() => toggle(genre)}
                className={`
                  relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all
                  ${isSelected ? style.selected + ' border-2' : 'border-transparent ' + style.bg}
                  hover:scale-[1.02] active:scale-[0.98]
                `}
              >
                <Music className="w-4 h-4 text-white/70" />
                <span className="text-sm font-medium text-white">{genre}</span>
                {isSelected && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleShowAll}
            className="flex-1 px-4 py-2.5 text-white/70 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors"
          >
            Show all styles
          </button>
          <button
            onClick={handleConfirm}
            disabled={selected.size === 0}
            className={`
              flex-1 px-4 py-2.5 rounded-xl font-medium transition-all
              ${
                selected.size > 0
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
              }
            `}
          >
            {selected.size > 0 ? `Continue with ${selected.size}` : 'Select styles'}
          </button>
        </div>
      </div>
    </div>
  );
}
