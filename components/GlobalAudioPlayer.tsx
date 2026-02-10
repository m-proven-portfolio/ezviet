'use client';

import { useEffect, useRef } from 'react';
import { useAudioStore } from '@/lib/stores/audioStore';

export function GlobalAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentSrcRef = useRef<string | null>(null);
  const pendingPlayRef = useRef(false);
  const {
    currentSong,
    isPlaying,
    playlistIndex,
    playlist,
    _setCurrentTime,
    _setDuration,
    _setIsPlaying,
    _setAudioError,
    _setAudioRef,
    nextSong,
  } = useAudioStore();

  // Build audio URL from Supabase storage
  const audioUrl = currentSong
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cards-songs/${currentSong.storage_path}`
    : undefined;

  // Register audio ref with store on mount
  useEffect(() => {
    if (audioRef.current) {
      _setAudioRef(audioRef.current);
    }
    return () => {
      _setAudioRef(null);
    };
  }, [_setAudioRef]);

  // Handle song change - load new source
  useEffect(() => {
    if (!audioRef.current || !currentSong || !audioUrl) return;

    // Only reload if src actually changed
    if (currentSrcRef.current !== audioUrl) {
      currentSrcRef.current = audioUrl;
      pendingPlayRef.current = isPlaying; // Remember if we should play after load
      audioRef.current.src = audioUrl;
      audioRef.current.load();
    }
  }, [currentSong?.id, audioUrl, isPlaying]);

  // Sync play/pause state (only when source hasn't changed)
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;
    // Skip if we're waiting for canplay after a source change
    if (pendingPlayRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch(() => {
        // Ignore AbortError - happens during source changes
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSong]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      _setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      _setDuration(audioRef.current.duration);
    }
  };

  // Play after source is loaded (avoids AbortError race condition)
  const handleCanPlay = () => {
    if (pendingPlayRef.current && audioRef.current) {
      pendingPlayRef.current = false;
      audioRef.current.play().catch(() => {
        // Ignore errors - user may have paused before load completed
      });
    }
  };

  const handleEnded = () => {
    // Auto-advance to next song if available
    if (playlistIndex < playlist.length - 1) {
      nextSong();
    } else {
      _setIsPlaying(false);
    }
  };

  const handlePlay = () => _setIsPlaying(true);
  const handlePause = () => _setIsPlaying(false);

  // Handle audio load errors (e.g., deleted file, network issues)
  const handleError = () => {
    // Clear pending play flag to prevent freeze
    pendingPlayRef.current = false;
    // Update store state
    _setIsPlaying(false);
    _setAudioError('Audio file not found or failed to load. The song may have been deleted.');
    // Log for debugging
    console.error('Audio failed to load:', audioUrl);
  };

  // Hidden audio element - always mounted at root
  return (
    <audio
      ref={audioRef}
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onCanPlay={handleCanPlay}
      onEnded={handleEnded}
      onPlay={handlePlay}
      onPause={handlePause}
      onError={handleError}
      preload="metadata"
      playsInline
      className="hidden"
    />
  );
}
