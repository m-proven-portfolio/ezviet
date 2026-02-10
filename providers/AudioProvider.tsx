'use client';

import { useEffect } from 'react';
import { GlobalAudioPlayer } from '@/components/GlobalAudioPlayer';
import { GlobalKaraokeOverlay } from '@/components/GlobalKaraokeOverlay';
import { PersistentMiniPlayer, MiniPlayerSpacer } from '@/components/PersistentMiniPlayer';
import { useAudioStore } from '@/lib/stores/audioStore';
import { DEFAULT_LYRICS_OFFSET } from '@/lib/lrc-parser';

interface AudioProviderProps {
  children: React.ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
  const setLyricsOffset = useAudioStore((state) => state.setLyricsOffset);

  // Hydrate lyrics offset from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('ezviet-lyrics-offset');
    if (stored) {
      const offset = parseFloat(stored);
      if (!isNaN(offset)) {
        setLyricsOffset(offset);
      }
    }
  }, [setLyricsOffset]);

  return (
    <>
      {children}
      {/* Spacer to push content above the fixed mini-player */}
      <MiniPlayerSpacer />
      {/* Global audio element - always mounted, invisible */}
      <GlobalAudioPlayer />
      {/* Persistent mini-player - fixed at bottom when song is loaded */}
      <PersistentMiniPlayer />
      {/* Global karaoke overlay - appears when songs with lyrics play */}
      <GlobalKaraokeOverlay />
    </>
  );
}
