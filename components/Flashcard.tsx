'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getStorageUrl } from '@/lib/utils';
import { AudioPlayer } from './AudioPlayer';
import { KaraokeLyrics } from './KaraokeLyrics';
import { PlayKaraokeButton } from './PlayKaraokeButton';
import { FlashcardMiniPlayer } from './FlashcardMiniPlayer';
import { LanguagePreferenceToggle } from './LanguagePreferenceToggle';
import { useAudioStore } from '@/lib/stores/audioStore';
import { useLanguagePreferences } from '@/hooks/useLanguagePreferences';
import type { CardWithTerms, CardSong } from '@/lib/supabase/types';

interface FlashcardProps {
  card: CardWithTerms;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  isFirstVisit?: boolean;
  onFirstInteraction?: () => void;
}

export function Flashcard({
  card,
  onSwipeLeft,
  onSwipeRight,
  isFirstVisit = false,
  onFirstInteraction,
}: FlashcardProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Language preferences
  const { preferences, setAllPreferences, hasMounted } = useLanguagePreferences();

  // Global audio store
  const {
    currentSong: globalCurrentSong,
    currentCardSlug,
    currentTime,
    duration,
    showMiniPlayer: globalShowMiniPlayer,
    showLyrics,
    seek,
    stop,
    nextSong: storeNextSong,
    prevSong: storePrevSong,
    toggleLyrics,
  } = useAudioStore();

  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  const isDraggingRef = useRef(false);

  // Select Vietnamese term based on dialect preference with fallback
  const viTerm =
    card.terms?.find(
      (t) => t.lang === 'vi' && t.region === preferences.vietnameseDialect
    ) ||
    card.terms?.find((t) => t.lang === 'vi' && t.region === 'south') ||
    card.terms?.find((t) => t.lang === 'vi');

  const enTerm = card.terms?.find((t) => t.lang === 'en');
  const imageUrl = getStorageUrl('cards-images', card.image_path);

  // Get all songs sorted by sort_order
  const songs = (card.songs || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const songCount = songs.length;
  const hasSongs = songCount > 0;

  const hasMultipleSongs = songCount > 1;

  // Determine if THIS card's song is currently active
  const isThisCardActive = currentCardSlug === card.slug && globalCurrentSong !== null;
  const showMiniPlayer = isThisCardActive && globalShowMiniPlayer;

  // Get the current song for this card from the global store
  const currentSong = isThisCardActive ? globalCurrentSong : songs[0];
  const currentSongIndex = isThisCardActive
    ? songs.findIndex(s => s.id === globalCurrentSong?.id)
    : 0;

  // Check if current song has lyrics (LRC or plain)
  const hasLyrics = !!(currentSong?.lyrics_lrc || currentSong?.lyrics_plain);

  // Build cover image URL
  const getCoverUrl = useCallback((song: CardSong) => {
    if (song.cover_image_path) {
      return getStorageUrl('cards-images', song.cover_image_path);
    }
    return null;
  }, []);

  // Touch/mouse handlers for swipe
  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    isDraggingRef.current = true;
    startX.current = clientX;
    startY.current = clientY;
    startTime.current = Date.now();
    isHorizontalSwipe.current = null;
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;

    const diffX = clientX - startX.current;
    const diffY = clientY - startY.current;

    if (isHorizontalSwipe.current === null) {
      const absDiffX = Math.abs(diffX);
      const absDiffY = Math.abs(diffY);
      if (absDiffX > 10 || absDiffY > 10) {
        isHorizontalSwipe.current = absDiffX > absDiffY;
      }
    }

    if (isHorizontalSwipe.current) {
      setOffsetX(diffX);
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    isDraggingRef.current = false;

    const elapsedTime = Date.now() - startTime.current;
    const velocity = Math.abs(offsetX) / elapsedTime;
    const threshold = velocity > 0.5 ? 30 : 80;

    // Check for swipe gesture
    if (isHorizontalSwipe.current) {
      if (offsetX > threshold && onSwipeRight) {
        onFirstInteraction?.();
        onSwipeRight();
      } else if (offsetX < -threshold && onSwipeLeft) {
        onFirstInteraction?.();
        onSwipeLeft();
      }
    } else if (Math.abs(offsetX) < 10) {
      // This was a tap (minimal movement) - check for edge tap zones
      const card = cardRef.current;
      if (card) {
        const rect = card.getBoundingClientRect();
        const tapX = startX.current;
        const edgeZone = rect.width * 0.15; // 15% of card width

        if (tapX < rect.left + edgeZone && onSwipeRight) {
          // Tapped left edge → go to previous
          onFirstInteraction?.();
          onSwipeRight();
        } else if (tapX > rect.right - edgeZone && onSwipeLeft) {
          // Tapped right edge → go to next
          onFirstInteraction?.();
          onSwipeLeft();
        }
      }
    }

    setOffsetX(0);
    isHorizontalSwipe.current = null;
  };

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY);
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => {
    if (isDragging) handleEnd();
  };

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  };
  const onTouchEnd = () => handleEnd();

  // Native touchmove listener with { passive: false }
  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;

      const clientX = e.touches[0].clientX;
      const clientY = e.touches[0].clientY;
      const diffX = clientX - startX.current;
      const diffY = clientY - startY.current;

      if (isHorizontalSwipe.current === null) {
        const absDiffX = Math.abs(diffX);
        const absDiffY = Math.abs(diffY);
        if (absDiffX > 10 || absDiffY > 10) {
          isHorizontalSwipe.current = absDiffX > absDiffY;
        }
      }

      if (isHorizontalSwipe.current) {
        setOffsetX(diffX);
        e.preventDefault();
      }
    };

    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => element.removeEventListener('touchmove', handleTouchMove);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && onSwipeLeft) {
        onFirstInteraction?.();
        onSwipeLeft();
      } else if (e.key === 'ArrowRight' && onSwipeRight) {
        onFirstInteraction?.();
        onSwipeRight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSwipeLeft, onSwipeRight, onFirstInteraction]);

  // Track previous card slug to detect card changes
  const prevCardSlugRef = useRef(card.slug);

  // Stop audio when swiping to a different card
  useEffect(() => {
    // If the card slug changed and audio was playing for the OLD card, stop it
    if (prevCardSlugRef.current !== card.slug && currentCardSlug === prevCardSlugRef.current) {
      stop();
    }
    prevCardSlugRef.current = card.slug;
  }, [card.slug, currentCardSlug, stop]);


  // Go to previous song
  const previousSong = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();

    if (!hasMultipleSongs || !isThisCardActive) return;
    storePrevSong();
  }, [hasMultipleSongs, isThisCardActive, storePrevSong]);

  // Go to next song
  const nextSong = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();

    if (!hasMultipleSongs || !isThisCardActive) return;
    storeNextSong();
  }, [hasMultipleSongs, isThisCardActive, storeNextSong]);

  // Handle seek
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newTime = parseFloat(e.target.value);
    seek(newTime);
  }, [seek]);

  // Close mini-player
  const closeMiniPlayer = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    stop();
  }, [stop]);

  const rotation = offsetX * 0.05;
  const opacity = 1 - Math.abs(offsetX) / 400;

  return (
    <div className="max-w-sm mx-auto">
      {/* Language Preference Toggle - only show after hydration */}
      {hasMounted && (
        <LanguagePreferenceToggle
          preferences={preferences}
          onChange={setAllPreferences}
        />
      )}

      <div
        ref={cardRef}
        className="relative select-none cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${offsetX}px) rotate(${rotation}deg)`,
          opacity,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out',
        }}
      >
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-sm mx-auto">
        {/* Vietnamese Text - conditionally shown based on preferences */}
        {preferences.showVietnamese && (
          <div className="pt-8 px-6 pb-2 text-center min-h-[140px] flex flex-col justify-start">
            <h2 className="text-4xl font-bold text-gray-900 leading-[1.35] pb-1">
              {viTerm?.text || 'Loading...'}
            </h2>
            {preferences.showRomanization && viTerm?.romanization && (
              <p className="text-lg text-gray-500 mt-1 leading-relaxed">
                /{viTerm.romanization}/
              </p>
            )}
            <div className="mt-auto pt-2">
              <div className={isFirstVisit ? 'animate-pulse' : ''}>
                <AudioPlayer
                  key={card.id}
                  audioPath={viTerm?.audio_path}
                  text={viTerm?.text || ''}
                />
              </div>
            </div>
          </div>
        )}

        {/* Image */}
        <div className="p-6">
          <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-white rounded-2xl overflow-hidden flex items-center justify-center">
            <img
              src={imageUrl}
              alt={`${enTerm?.text} - ${viTerm?.text}`}
              className="max-w-full max-h-full object-contain pointer-events-none"
              draggable={false}
            />
          </div>
        </div>

        {/* English with Music Controls Row - Fixed height for consistent card size */}
        <div className="pb-6 px-6">
          <div className="flex items-center justify-center gap-3 h-10">
            {/* Unified play button - LEFT of word, triggers Karaoke Hero */}
            {hasSongs && songs[0] && (
              <PlayKaraokeButton
                song={songs[0]}
                cardSlug={card.slug}
                playlist={songs}
                size="md"
                showHint={isFirstVisit}
              />
            )}

            {/* English word - conditionally shown based on preferences */}
            {preferences.showEnglish && (
              <p className="text-2xl text-gray-700">{enTerm?.text}</p>
            )}

            {/* Lyrics button - RIGHT of word, only when playing and has lyrics */}
            {isThisCardActive && hasLyrics && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLyrics();
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  showLyrics
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                }`}
              >
                Lyrics
              </button>
            )}
          </div>
        </div>

        {/* Mini Player - appears when playing */}
        {showMiniPlayer && currentSong && (
          <FlashcardMiniPlayer
            currentSong={currentSong}
            cardSlug={card.slug}
            songs={songs}
            currentSongIndex={currentSongIndex}
            songCount={songCount}
            hasMultipleSongs={hasMultipleSongs}
            currentTime={currentTime}
            duration={duration}
            getCoverUrl={getCoverUrl}
            onSeek={handleSeek}
            onPrevious={previousSong}
            onNext={nextSong}
            onClose={closeMiniPlayer}
          />
        )}

        {/* Karaoke Lyrics Panel - appears below mini-player */}
        {showMiniPlayer && (currentSong?.lyrics_lrc || currentSong?.lyrics_plain) && (
          <div onClick={(e) => e.stopPropagation()}>
            <KaraokeLyrics
              lrcLyrics={currentSong.lyrics_lrc}
              plainLyrics={currentSong.lyrics_plain}
              currentTime={currentTime}
              isExpanded={showLyrics}
              onToggle={toggleLyrics}
              onSeek={seek}
              maxHeight="max-h-48"
            />
          </div>
        )}

        {/* Link to full page */}
        <Link
          href={`/learn/${card.slug}`}
          className="block bg-gray-50 px-6 py-3 text-center text-sm text-emerald-600 hover:bg-gray-100 transition-colors border-t"
          onClick={(e) => e.stopPropagation()}
        >
          View full card →
        </Link>
      </div>

      {/* Swipe indicators */}
      {offsetX !== 0 && (
        <>
          {offsetX > 50 && (
            <div className="absolute top-1/2 left-4 -translate-y-1/2 bg-emerald-500 text-white px-4 py-2 rounded-full font-bold opacity-80">
              ← Previous
            </div>
          )}
          {offsetX < -50 && (
            <div className="absolute top-1/2 right-4 -translate-y-1/2 bg-blue-500 text-white px-4 py-2 rounded-full font-bold opacity-80">
              Next →
            </div>
          )}
        </>
      )}

      {/* First-visit edge tap hints - improved visibility */}
      {isFirstVisit && offsetX === 0 && (
        <>
          {/* Left edge hint */}
          <div className="absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none">
            <div className="flex flex-col items-center gap-1 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shadow-sm">
                <span className="text-emerald-600 text-lg font-bold">‹</span>
              </div>
              <span className="text-xs text-emerald-600/80 font-medium">Tap</span>
            </div>
          </div>
          {/* Right edge hint */}
          <div className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none">
            <div className="flex flex-col items-center gap-1 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shadow-sm">
                <span className="text-emerald-600 text-lg font-bold">›</span>
              </div>
              <span className="text-xs text-emerald-600/80 font-medium">Tap</span>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
