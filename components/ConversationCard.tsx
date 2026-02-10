'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getStorageUrl } from '@/lib/utils';
import { ConversationBubble } from './ConversationBubble';
import type { ConversationCardWithLines } from '@/lib/types/conversation';

interface ConversationCardProps {
  conversation: ConversationCardWithLines;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

/**
 * ConversationCard
 *
 * An interactive dialogue card with swipe gestures.
 * Clean, modern design with smooth animations.
 */
export function ConversationCard({
  conversation,
  onSwipeLeft,
  onSwipeRight,
}: ConversationCardProps) {
  // Swipe state
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Which lines have been revealed (translation shown)
  const [revealedLines, setRevealedLines] = useState<Set<string>>(new Set());

  // Currently playing audio line
  const [playingLineId, setPlayingLineId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  const isDraggingRef = useRef(false);

  const imageUrl = getStorageUrl('cards-images', conversation.scene_image_path);
  const lines = conversation.lines.sort((a, b) => a.sort_order - b.sort_order);
  const totalLines = lines.length;

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

    if (isHorizontalSwipe.current) {
      if (offsetX > threshold && onSwipeRight) {
        onSwipeRight();
      } else if (offsetX < -threshold && onSwipeLeft) {
        onSwipeLeft();
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

  // Native touchmove with { passive: false }
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
        onSwipeLeft();
      } else if (e.key === 'ArrowRight' && onSwipeRight) {
        onSwipeRight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSwipeLeft, onSwipeRight]);

  // Play audio for a specific line
  const playLineAudio = useCallback((line: typeof lines[0]) => {
    // Stop any current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (!line.audio_path) {
      // Fallback to speech synthesis
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(line.vietnamese);
        utterance.lang = 'vi-VN';
        utterance.rate = 0.85;
        utterance.onend = () => setPlayingLineId(null);
        utterance.onerror = () => setPlayingLineId(null);
        setPlayingLineId(line.id);
        speechSynthesis.speak(utterance);
      }
      return;
    }

    const url = getStorageUrl('cards-audio', line.audio_path);
    audioRef.current = new Audio(url);
    audioRef.current.onended = () => setPlayingLineId(null);
    audioRef.current.onerror = () => setPlayingLineId(null);
    setPlayingLineId(line.id);
    audioRef.current.play();
  }, []);

  // Toggle line reveal and play audio
  const handleBubbleTap = useCallback((line: typeof lines[0]) => {
    setRevealedLines((prev) => {
      const next = new Set(prev);
      if (next.has(line.id)) {
        // Already revealed, just play audio again
        playLineAudio(line);
        return prev;
      }
      // Reveal and play
      next.add(line.id);
      playLineAudio(line);
      return next;
    });
  }, [playLineAudio]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  // Transform for swipe animation
  const rotation = offsetX * 0.02;
  const scale = Math.max(0.98, 1 - Math.abs(offsetX) / 1000);

  return (
    <div
      ref={cardRef}
      className={`
        relative w-full max-w-md mx-auto
        bg-(--surface-card)
        rounded-2xl
        shadow-lg
        overflow-hidden
        select-none touch-pan-y
        border border-(--border-subtle)
      `}
      style={{
        transform: `translateX(${offsetX}px) rotate(${rotation}deg) scale(${scale})`,
        transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Scene Image with elegant gradient overlay */}
      <div className="relative h-44 bg-neutral-200">
        <img
          src={imageUrl}
          alt={conversation.title}
          className="w-full h-full object-cover"
          draggable={false}
        />
        {/* Sophisticated gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(
                to bottom,
                transparent 0%,
                transparent 30%,
                hsla(24, 8%, 10%, 0.4) 70%,
                hsla(24, 8%, 10%, 0.7) 100%
              )
            `,
          }}
        />
        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h2 className="text-white font-bold text-xl tracking-tight">
            {conversation.title}
          </h2>
          {conversation.title_vi && (
            <p className="text-white/80 text-sm mt-0.5 font-medium">
              {conversation.title_vi}
            </p>
          )}
        </div>
      </div>

      {/* Dialogue Bubbles */}
      <div className="p-4 space-y-4 max-h-80 overflow-y-auto bg-background">
        {lines.map((line, index) => (
          <ConversationBubble
            key={line.id}
            line={line}
            isRevealed={revealedLines.has(line.id)}
            isPlaying={playingLineId === line.id}
            onTap={() => handleBubbleTap(line)}
            isLeft={index % 2 === 0}
          />
        ))}
      </div>

      {/* Progress indicator - Clean dot style */}
      <div className="px-4 pb-4 pt-2 bg-background border-t border-(--border-subtle)">
        <div className="flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {lines.map((line) => (
              <div
                key={line.id}
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${revealedLines.has(line.id)
                    ? 'bg-jade-500 scale-100'
                    : 'bg-neutral-300 scale-90'
                  }
                `}
              />
            ))}
          </div>
          {/* Helper text */}
          <span className="text-xs text-neutral-400">
            {revealedLines.size}/{totalLines} revealed
          </span>
        </div>
      </div>

      {/* Swipe indicators with icons */}
      {Math.abs(offsetX) > 40 && (
        <>
          {offsetX > 0 && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-jade-500/90 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 shadow-lg backdrop-blur-sm">
              <ChevronLeft className="w-4 h-4" />
              Back
            </div>
          )}
          {offsetX < 0 && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-jade-500/90 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 shadow-lg backdrop-blur-sm">
              Next
              <ChevronRight className="w-4 h-4" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
