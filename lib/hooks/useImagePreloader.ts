'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { getStorageUrl } from '@/lib/utils';
import type { CardWithTerms } from '@/lib/supabase/types';

/**
 * Preloads images for upcoming cards to eliminate loading delays.
 * Uses browser's image cache - once loaded, images display instantly.
 */
export function useImagePreloader(
  cards: CardWithTerms[],
  currentIndex: number,
  preloadAhead: number = 5
) {
  // Track which images we've already started preloading
  const preloadedUrls = useRef<Set<string>>(new Set());
  // Use state for the count so it can be safely accessed during render
  const [preloadedCount, setPreloadedCount] = useState(0);

  const preloadImage = useCallback((url: string) => {
    if (preloadedUrls.current.has(url)) return;

    preloadedUrls.current.add(url);
    setPreloadedCount(preloadedUrls.current.size);
    const img = new Image();
    img.src = url;
    // Image loads in background, browser caches it
  }, []);

  useEffect(() => {
    // Preload images for the next N cards
    const startIdx = currentIndex;
    const endIdx = Math.min(currentIndex + preloadAhead, cards.length);

    for (let i = startIdx; i < endIdx; i++) {
      const card = cards[i];
      if (card?.image_path) {
        const imageUrl = getStorageUrl('cards-images', card.image_path);
        preloadImage(imageUrl);
      }

      // Also preload song cover images if they exist
      card?.songs?.forEach(song => {
        if (song.cover_image_path) {
          const coverUrl = getStorageUrl('cards-images', song.cover_image_path);
          preloadImage(coverUrl);
        }
      });
    }
  }, [cards, currentIndex, preloadAhead, preloadImage]);

  // Also preload audio pronunciation files
  useEffect(() => {
    const startIdx = currentIndex;
    const endIdx = Math.min(currentIndex + 3, cards.length); // Preload fewer audio files

    for (let i = startIdx; i < endIdx; i++) {
      const card = cards[i];
      const viTerm = card?.terms?.find(t => t.lang === 'vi' && t.region === 'south');
      if (viTerm?.audio_path) {
        const audioUrl = getStorageUrl('cards-audio', viTerm.audio_path);
        if (!preloadedUrls.current.has(audioUrl)) {
          preloadedUrls.current.add(audioUrl);
          setPreloadedCount(preloadedUrls.current.size);
          // Use link preload for audio
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = audioUrl;
          link.as = 'audio';
          document.head.appendChild(link);
        }
      }
    }
  }, [cards, currentIndex]);

  return { preloadedCount };
}
