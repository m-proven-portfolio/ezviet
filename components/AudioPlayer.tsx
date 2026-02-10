'use client';

import { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  audioPath?: string | null;
  text: string;
  lang?: string;
}

/**
 * AudioPlayer component with fallback to Web Speech API
 *
 * Priority:
 * 1. Pre-recorded audio from Supabase storage (if audioPath exists)
 * 2. Browser's Web Speech API (fallback)
 */
export function AudioPlayer({ audioPath, text, lang = 'vi-VN' }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasNativeSupport, setHasNativeSupport] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up audio when audioPath changes or component unmounts
  useEffect(() => {
    // Stop any playing audio when the audio source changes
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // Reset the ref so a new Audio object is created with the new URL
    audioRef.current = null;
    setIsPlaying(false);

    // Also cancel any speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }, [audioPath]);

  useEffect(() => {
    // Check if browser supports speech synthesis with Vietnamese
    if ('speechSynthesis' in window) {
      const voices = speechSynthesis.getVoices();
      const hasVietnamese = voices.some(v => v.lang.startsWith('vi'));
      setHasNativeSupport(hasVietnamese || voices.length > 0);

      // Voice list may load async
      speechSynthesis.onvoiceschanged = () => {
        const updatedVoices = speechSynthesis.getVoices();
        setHasNativeSupport(updatedVoices.some(v => v.lang.startsWith('vi')) || updatedVoices.length > 0);
      };
    }
  }, []);

  const playAudio = async () => {
    if (isPlaying) return;
    setIsPlaying(true);

    try {
      // Option 1: Pre-recorded audio
      if (audioPath) {
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cards-audio/${audioPath}`;

        if (!audioRef.current) {
          audioRef.current = new Audio(url);
        }

        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.onerror = () => {
          // Fallback to speech synthesis if audio fails
          speakText();
        };

        await audioRef.current.play();
        return;
      }

      // Option 2: Web Speech API fallback
      speakText();
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsPlaying(false);
    }
  };

  const speakText = () => {
    if (!('speechSynthesis' in window)) {
      setIsPlaying(false);
      return;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.8; // Slower for learning
    utterance.pitch = 1;

    // Try to find Vietnamese voice
    const voices = speechSynthesis.getVoices();
    const vietnameseVoice = voices.find(v => v.lang.startsWith('vi'));
    if (vietnameseVoice) {
      utterance.voice = vietnameseVoice;
    }

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    speechSynthesis.speak(utterance);
  };

  // Don't show button if no audio support
  if (!audioPath && !hasNativeSupport) {
    return null;
  }

  return (
    <button
      onClick={playAudio}
      disabled={isPlaying}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-full
        text-sm font-medium transition-all
        ${isPlaying
          ? 'bg-emerald-200 text-emerald-800 cursor-wait'
          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
        }
      `}
      aria-label={isPlaying ? 'Playing audio' : 'Play pronunciation'}
    >
      {isPlaying ? (
        <>
          <span className="animate-pulse">🔊</span>
          Playing...
        </>
      ) : (
        <>
          🔊 Listen
        </>
      )}
    </button>
  );
}
