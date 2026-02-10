'use client';

import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize2,
  Minimize2,
  ChevronDown,
  Settings,
  Gamepad2,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { SyncMode } from './karaoke/SyncMode';
import { SandboxLrcEditor } from './karaoke/SandboxLrcEditor';
import { PreviewMode } from './karaoke/PreviewMode';
import { EditSuccessAnimation } from './karaoke/EditSuccessAnimation';
import type { TimingEntry, SyncSessionStats } from '@/lib/lrc-sync';
import type { VoteType } from '@/lib/lrc-voting';
import { useAudioStore } from '@/lib/stores/audioStore';
import { parseLrc, getCurrentLineIndex, isLrcFormat } from '@/lib/lrc-parser';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function GlobalKaraokeOverlay() {
  const {
    currentSong,
    currentCardSlug,
    isPlaying,
    currentTime,
    duration,
    audioError,
    karaokeMode,
    karaokeLevel,
    playlist,
    playlistIndex,
    lyricsOffset,
    pause,
    resume,
    seek,
    nextSong,
    prevSong,
    setKaraokeMode,
    toggleKaraokeMode,
    setLyricsOffset,
    stepDownKaraoke,
    setKaraokeLevel,
    clearAudioError,
  } = useAudioStore();

  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);
  const lastScrolledIndexRef = useRef<number>(-1);
  const [showTimingSettings, setShowTimingSettings] = useState(false);

  // Use global sync mode state
  const showSyncMode = useAudioStore((s) => s.showSyncMode);
  const setShowSyncMode = useAudioStore((s) => s.setShowSyncMode);
  const launchKaraokeHero = useAudioStore((s) => s.launchKaraokeHero);

  // Editor mode state
  const editorMode = useAudioStore((s) => s.editorMode);
  const draftTimings = useAudioStore((s) => s.draftTimings);
  const draftEdits = useAudioStore((s) => s.draftEdits);
  const enterPreviewMode = useAudioStore((s) => s.enterPreviewMode);
  const exitPreviewMode = useAudioStore((s) => s.exitPreviewMode);
  const exitSandboxEditor = useAudioStore((s) => s.exitSandboxEditor);

  // Success animation state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successPoints, setSuccessPoints] = useState(0);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Handle sync submission with user rating
  const handleSyncSubmit = async (timings: TimingEntry[], stats: SyncSessionStats, userRating: VoteType) => {
    if (!currentSong) return;

    const response = await fetch('/api/lrc-sync/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        songId: currentSong.id,
        timingData: timings,
        accuracyScore: stats.accuracyPercent,
        linesCount: stats.linesAttempted,
        bestStreak: stats.bestStreak,
        userRating, // Include the user's timing feedback
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit');
    }

    setShowSyncMode(false);
  };

  // Handle edit submission from preview mode
  // Uses pre-computed draftEdits from SandboxLrcEditor to ensure correct
  // edit detection even when lines are deleted from the middle
  const handlePreviewSubmit = useCallback(async () => {
    if (!currentSong?.id || !draftEdits || draftEdits.length === 0) {
      alert('No changes detected');
      return;
    }

    setIsSubmittingEdit(true);

    try {
      const response = await fetch('/api/lrc-edits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songId: currentSong.id,
          edits: draftEdits,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit edits');
      }

      // Show success animation
      setSuccessPoints(data.pointsEarned || 0);
      setShowSuccess(true);
      exitSandboxEditor();
    } catch (error) {
      console.error('Submit error:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit. Please try again.');
    } finally {
      setIsSubmittingEdit(false);
    }
  }, [currentSong, draftEdits, exitSandboxEditor]);

  // Handle sandbox editor submit success
  const handleSandboxSubmitSuccess = useCallback((points: number) => {
    setSuccessPoints(points);
    setShowSuccess(true);
    exitSandboxEditor();
  }, [exitSandboxEditor]);

  // Handle closing success animation
  const handleSuccessClose = useCallback(() => {
    setShowSuccess(false);
    setSuccessPoints(0);
  }, []);

  // Parse lyrics
  const { lines, hasTimestamps } = useMemo(() => {
    if (!currentSong) return { lines: [], hasTimestamps: false };

    const lrcLyrics = currentSong.lyrics_lrc;
    const plainLyrics = currentSong.lyrics_plain;

    if (lrcLyrics && isLrcFormat(lrcLyrics)) {
      const parsed = parseLrc(lrcLyrics);
      if (parsed.length > 0) {
        return { lines: parsed, hasTimestamps: true };
      }
    }

    if (plainLyrics) {
      const plainLines = plainLyrics
        .split('\n')
        .filter((line) => line.trim())
        .map((text, idx) => ({ time: idx * 3, text })); // Fake timing for plain
      return { lines: plainLines, hasTimestamps: false };
    }

    return { lines: [], hasTimestamps: false };
  }, [currentSong]);

  // Determine effective offset (per-song override or global)
  const effectiveOffset = useMemo(() => {
    // Check if song has a per-song timing_offset set
    const songOffset = (currentSong as { timing_offset?: number | null })?.timing_offset;
    if (songOffset !== null && songOffset !== undefined) {
      return songOffset;
    }
    return lyricsOffset;
  }, [currentSong, lyricsOffset]);

  // Get current line index (with user-adjustable offset)
  const currentLineIndex = useMemo(() => {
    if (!hasTimestamps || lines.length === 0) return -1;
    return getCurrentLineIndex(lines, currentTime, effectiveOffset);
  }, [hasTimestamps, lines, currentTime, effectiveOffset]);

  // Auto-scroll to current line
  useEffect(() => {
    if (
      karaokeMode === 'hidden' ||
      currentLineIndex < 0 ||
      currentLineIndex === lastScrolledIndexRef.current
    ) {
      return;
    }

    lastScrolledIndexRef.current = currentLineIndex;

    requestAnimationFrame(() => {
      currentLineRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }, [currentLineIndex, karaokeMode]);

  // Reset scroll tracking when song changes
  useEffect(() => {
    lastScrolledIndexRef.current = -1;
  }, [currentSong?.id]);

  // Only render at levels 2 (theater) and 3 (hero)
  // At level 3, this component renders the background while SyncMode handles the game
  if (karaokeLevel < 2 || !currentSong) return null;

  // Level 3 = immersive (with SyncMode on top), Level 2 = sheet (theater)
  const isImmersive = karaokeLevel === 3;
  const hasMultipleSongs = playlist.length > 1;
  const coverUrl = currentSong.cover_image_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cards-images/${currentSong.cover_image_path}`
    : null;

  const handleSeek = (time: number) => {
    if (hasTimestamps) seek(time);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seek(percent * duration);
  };

  return (
    <>
      {/* Backdrop for immersive mode - click to step down */}
      {isImmersive && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 animate-karaoke-expand"
          onClick={stepDownKaraoke}
        />
      )}

      {/* Main overlay */}
      <div
        className={`
          fixed left-0 right-0 z-50 flex flex-col
          bg-gradient-to-b from-purple-900 via-purple-950 to-indigo-950
          ${isImmersive
            ? 'inset-0 animate-karaoke-expand'
            : 'bottom-0 h-[35vh] rounded-t-3xl animate-karaoke-slide-up'
          }
        `}
      >
        {/* Drag handle (sheet mode only) */}
        {!isImmersive && (
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 bg-white/30 rounded-full" />
          </div>
        )}

        {/* Header - compact in sheet mode */}
        <div className={`flex items-center gap-3 px-4 shrink-0 ${isImmersive ? 'py-3' : 'py-2'}`}>
          {/* Album art - larger in immersive */}
          <div className={`relative rounded-xl overflow-hidden bg-purple-800/50 shrink-0 shadow-lg ${isImmersive ? 'w-14 h-14' : 'w-10 h-10'}`}>
            {coverUrl ? (
              <Image src={coverUrl} alt={currentSong.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl">🎵</div>
            )}
          </div>

          {/* Song info */}
          <div className="flex-1 min-w-0">
            <h3 className={`text-white font-semibold truncate ${isImmersive ? '' : 'text-sm'}`}>{currentSong.title}</h3>
            {isImmersive && (
              <p className="text-purple-200/70 text-sm truncate">
                {currentSong.artist || 'EZViet'}
                {currentSong.level && ` • Level ${currentSong.level}`}
              </p>
            )}
            {/* Learn this word link */}
            {currentCardSlug && (
              <Link
                href={`/learn/${currentCardSlug}`}
                className="inline-flex items-center gap-1.5 mt-1.5 group/learn"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span className="text-xs text-amber-400 font-medium group-hover/learn:text-amber-300 transition-colors">
                  Learn this word
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-amber-400/60 group-hover/learn:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Sync Mode button - show if song has LRC lyrics */}
            {hasTimestamps && (
              <button
                onClick={launchKaraokeHero}
                className={`flex items-center gap-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg ${
                  isImmersive ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'
                }`}
                aria-label="Play Karaoke Hero"
              >
                <Gamepad2 className={isImmersive ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
                <span className={isImmersive ? 'hidden sm:inline' : 'hidden'}>Play</span>
              </button>
            )}
            <button
              onClick={() => setShowTimingSettings(!showTimingSettings)}
              className={`p-2 rounded-lg transition-colors ${showTimingSettings ? 'text-white bg-white/20' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
              aria-label="Timing settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => setKaraokeLevel(karaokeLevel === 2 ? 3 : 2)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label={isImmersive ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isImmersive ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={stepDownKaraoke}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Minimize karaoke"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Timing settings panel */}
        {showTimingSettings && (() => {
          const songOffset = (currentSong as { timing_offset?: number | null })?.timing_offset;
          const hasSongOffset = songOffset !== null && songOffset !== undefined;
          return (
            <div className="px-4 py-3 bg-black/30 border-y border-white/10">
              {hasSongOffset && (
                <p className="text-center text-purple-300 text-xs mb-2">
                  Using per-song offset ({songOffset >= 0 ? '+' : ''}{songOffset.toFixed(1)}s) • Adjust global below
                </p>
              )}
              <div className="flex items-center gap-4 max-w-md mx-auto">
                <span className="text-white/70 text-sm whitespace-nowrap">
                  {hasSongOffset ? 'Global:' : 'Sync:'}
                </span>
                <button
                  onClick={() => setLyricsOffset(Math.max(-2, lyricsOffset - 0.1))}
                  className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold transition-colors"
                >
                  −
                </button>
                <input
                  type="range"
                  min={-2}
                  max={3}
                  step={0.1}
                  value={lyricsOffset}
                  onChange={(e) => setLyricsOffset(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
                />
                <button
                  onClick={() => setLyricsOffset(Math.min(3, lyricsOffset + 0.1))}
                  className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold transition-colors"
                >
                  +
                </button>
                <span className="text-white/90 text-sm font-mono w-16 text-right">
                  {lyricsOffset >= 0 ? '+' : ''}{lyricsOffset.toFixed(1)}s
                </span>
                <button
                  onClick={() => setLyricsOffset(0.8)}
                  className="text-xs text-purple-300 hover:text-purple-200 transition-colors"
                >
                  Reset
                </button>
              </div>
              <p className="text-center text-white/40 text-xs mt-2">
                Positive = lyrics appear earlier • Negative = later
              </p>
            </div>
          );
        })()}

        {/* Lyrics area */}
        <div
          ref={lyricsContainerRef}
          className={`flex-1 overflow-y-auto scroll-smooth px-4 ${isImmersive ? 'py-6' : 'py-2'}`}
        >
          <div className={`flex flex-col items-center ${isImmersive ? 'gap-4 py-12' : 'gap-2 py-1'}`}>
            {/* Audio error state */}
            {audioError ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="text-4xl">🎵❌</div>
                <p className="text-red-300 text-center max-w-md">{audioError}</p>
                <div className="flex gap-3">
                  <button
                    onClick={clearAudioError}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={stepDownKaraoke}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                  >
                    Back to Songs
                  </button>
                </div>
              </div>
            ) : lines.length === 0 ? (
              <p className="text-purple-300/60 text-center">No lyrics available</p>
            ) : (
              lines.map((line, index) => {
                const isCurrent = index === currentLineIndex;
                const isPast = currentLineIndex >= 0 && index < currentLineIndex;

                return (
                  <div
                    key={index}
                    ref={isCurrent ? currentLineRef : null}
                    onClick={() => handleSeek(line.time)}
                    className={`
                      text-center max-w-lg px-3 py-1 rounded-lg transition-all duration-300
                      ${hasTimestamps ? 'cursor-pointer hover:bg-white/5' : ''}
                      ${isCurrent
                        ? `text-white font-bold karaoke-glow ${isImmersive ? 'text-3xl scale-105' : 'text-lg'}`
                        : isPast
                          ? `text-purple-300/40 ${isImmersive ? 'text-lg' : 'text-sm'}`
                          : `text-purple-200/60 ${isImmersive ? 'text-lg' : 'text-sm'}`
                      }
                    `}
                  >
                    {line.text}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 py-2 shrink-0">
          <div
            className="h-1.5 bg-white/20 rounded-full cursor-pointer group"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full relative transition-all"
              style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="flex justify-between text-xs text-purple-300/70 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback controls - only in immersive mode */}
        {isImmersive && (
          <>
            <div className="flex items-center justify-center gap-6 px-4 py-4 shrink-0">
              <button
                onClick={prevSong}
                disabled={!hasMultipleSongs || playlistIndex === 0}
                className="p-3 text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous song"
              >
                <SkipBack className="w-6 h-6" />
              </button>

              <button
                onClick={isPlaying ? pause : resume}
                className="p-4 bg-white rounded-full text-purple-900 hover:scale-105 active:scale-95 transition-transform shadow-lg"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
              </button>

              <button
                onClick={nextSong}
                disabled={!hasMultipleSongs || playlistIndex === playlist.length - 1}
                className="p-3 text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next song"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>

            {/* Song counter */}
            {hasMultipleSongs && (
              <div className="text-center text-purple-300/60 text-xs pb-4">
                {playlistIndex + 1} of {playlist.length}
              </div>
            )}
          </>
        )}
      </div>

      {/* Editor Mode Overlays - takes precedence over SyncMode */}
      {editorMode === 'sandbox' && (
        <SandboxLrcEditor
          onClose={exitSandboxEditor}
          onPreview={enterPreviewMode}
          onSubmitSuccess={handleSandboxSubmitSuccess}
        />
      )}

      {editorMode === 'preview' && (
        <PreviewMode
          onBackToEditor={exitPreviewMode}
          onSubmit={handlePreviewSubmit}
          isSubmitting={isSubmittingEdit}
        />
      )}

      {/* Sync Mode overlay - shows at level 3 (Hero) when not in editor mode */}
      {karaokeLevel === 3 && editorMode === 'none' && (
        <SyncMode
          onClose={stepDownKaraoke}
          onSubmit={handleSyncSubmit}
        />
      )}

      {/* Success Animation - shows after successful edit submission */}
      {showSuccess && (
        <EditSuccessAnimation
          pointsEarned={successPoints}
          onClose={handleSuccessClose}
        />
      )}
    </>
  );
}
