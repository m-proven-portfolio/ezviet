'use client';

import { useEffect } from 'react';
import { useAudioStore } from '@/lib/stores/audioStore';
import type { CardSong } from '@/lib/supabase/types';

interface UseAudioHandoffOptions {
  cardSlug: string;
  songs: CardSong[];
  source: 'flashcard' | 'fullpage';
}

/**
 * Hook to handle audio handoff when navigating between flashcard and full card page.
 * Detects if audio is playing for the current card and updates the source.
 */
export function useAudioHandoff({ cardSlug, songs, source }: UseAudioHandoffOptions) {
  const {
    currentCardSlug,
    currentSong,
    isPlaying,
    setSource,
    showLyrics,
  } = useAudioStore();

  // Check if audio is active for this card
  const isAudioActiveForThisCard = currentCardSlug === cardSlug && currentSong !== null;

  // Update source when this component takes control
  useEffect(() => {
    if (isAudioActiveForThisCard) {
      setSource(source);
    }
  }, [isAudioActiveForThisCard, source, setSource]);

  // Find the active song index in this card's songs
  const activeSongIndex = isAudioActiveForThisCard
    ? songs.findIndex(s => s.id === currentSong?.id)
    : -1;

  return {
    isAudioActiveForThisCard,
    isPlaying: isAudioActiveForThisCard && isPlaying,
    activeSongIndex,
    activeSong: isAudioActiveForThisCard ? currentSong : null,
    showLyrics: isAudioActiveForThisCard && showLyrics,
  };
}
