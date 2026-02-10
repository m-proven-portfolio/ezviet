'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { getCachedAudio, cacheAudio } from '@/lib/market/audioCache';

interface UseMarketAudioReturn {
  /** Play Vietnamese text via TTS */
  playText: (text: string) => Promise<void>;
  /** Stop current playback */
  stopAudio: () => void;
  /** Whether audio is currently loading */
  isLoading: boolean;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** The text currently being played */
  currentText: string | null;
  /** Any error that occurred */
  error: string | null;
}

export function useMarketAudio(): UseMarketAudioReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      abortControllerRef.current?.abort();
    };
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    abortControllerRef.current?.abort();
    setIsPlaying(false);
    setIsLoading(false);
    setCurrentText(null);
  }, []);

  const playText = useCallback(
    async (text: string) => {
      // Stop any current playback
      stopAudio();

      // If same text is playing, just stop (toggle behavior)
      if (currentText === text) {
        return;
      }

      setIsLoading(true);
      setError(null);
      setCurrentText(text);

      try {
        // Check cache first
        let audioUrl = getCachedAudio(text);

        if (!audioUrl) {
          // Generate TTS
          abortControllerRef.current = new AbortController();

          const response = await fetch('/api/generate/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
            signal: abortControllerRef.current.signal,
          });

          if (!response.ok) {
            throw new Error('Failed to generate audio');
          }

          const data = await response.json();

          // Convert base64 to blob URL
          const audioBlob = await fetch(
            `data:${data.mimeType};base64,${data.audioContent}`
          ).then((r) => r.blob());
          audioUrl = URL.createObjectURL(audioBlob);

          // Cache it
          cacheAudio(text, audioUrl);
        }

        // Play the audio
        if (!audioRef.current) {
          audioRef.current = new Audio();
          audioRef.current.onended = () => {
            setIsPlaying(false);
            setCurrentText(null);
          };
          audioRef.current.onerror = () => {
            setIsPlaying(false);
            setError('Playback error');
            setCurrentText(null);
          };
        }

        audioRef.current.src = audioUrl;
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Request was aborted, ignore
          return;
        }
        const message = err instanceof Error ? err.message : 'Audio error';
        setError(message);
        setCurrentText(null);
      } finally {
        setIsLoading(false);
      }
    },
    [stopAudio, currentText]
  );

  return {
    playText,
    stopAudio,
    isLoading,
    isPlaying,
    currentText,
    error,
  };
}
