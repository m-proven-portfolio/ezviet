'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Volume2, Mic, Play, RotateCcw, Check } from 'lucide-react';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useMarketAudio } from '@/hooks/useMarketAudio';
import { audioManager } from '@/lib/vietquest/audioManager';
import type { NegotiationPhrase } from '@/lib/market/types';

interface PracticePromptProps {
  phrase: NegotiationPhrase;
  onClose: () => void;
  onPracticeComplete: (practiced: boolean) => void;
}

const ENCOURAGEMENTS = [
  'Nice try! Keep practicing!',
  'Great effort!',
  "You're getting the hang of it!",
  'Vietnamese tones take time - you did great!',
  'Well done! Practice makes perfect!',
  'Sounds good! Keep it up!',
];

function getRandomEncouragement(): string {
  return ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
}

type PracticeState = 'intro' | 'recording' | 'preview' | 'done';

export function PracticePrompt({
  phrase,
  onClose,
  onPracticeComplete,
}: PracticePromptProps) {
  const [state, setState] = useState<PracticeState>('intro');
  const [encouragement, setEncouragement] = useState('');

  // TTS playback
  const { playText, isLoading: ttsLoading, isPlaying: ttsPlaying } = useMarketAudio();

  // Voice recording
  const voice = useVoiceRecording({
    context: 'market',
    phraseText: phrase.vietnamese,
    phraseId: phrase.id,
    maxDuration: 10,
    onComplete: () => {
      setEncouragement(getRandomEncouragement());
      setState('preview');
      audioManager.playSound('success'); // Play success sound
    },
  });

  // Auto-dismiss after preview (5s)
  useEffect(() => {
    if (state === 'preview') {
      const timer = setTimeout(() => {
        handleDone(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const handleListen = useCallback(() => {
    playText(phrase.vietnamese);
  }, [playText, phrase.vietnamese]);

  const handleStartRecording = useCallback(async () => {
    audioManager.playSound('tap');
    setState('recording');
    await voice.startRecording();
  }, [voice]);

  const handleStopRecording = useCallback(() => {
    voice.stopRecording();
    // State will transition to 'preview' via onComplete callback
  }, [voice]);

  const handlePlayback = useCallback(() => {
    voice.playRecording();
  }, [voice]);

  const handleTryAgain = useCallback(() => {
    voice.reset();
    setState('intro');
    setEncouragement('');
  }, [voice]);

  const handleDone = useCallback(
    (practiced: boolean) => {
      onPracticeComplete(practiced);
      onClose();
    },
    [onPracticeComplete, onClose]
  );

  const handleSkip = useCallback(() => {
    handleDone(false);
  }, [handleDone]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md animate-slide-up rounded-t-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Try saying it!</h3>
          <button
            onClick={handleSkip}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Phrase display */}
        <div className="mb-6 rounded-xl bg-amber-50 p-4">
          <p className="text-xl font-medium text-gray-900">{phrase.vietnamese}</p>
          <p className="mt-1 text-sm italic text-gray-500">{phrase.romanization}</p>
          <p className="mt-2 text-sm text-gray-600">{phrase.english}</p>
        </div>

        {/* State-based content */}
        {state === 'intro' && (
          <div className="space-y-3">
            {/* Listen button */}
            <button
              onClick={handleListen}
              disabled={ttsLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 font-medium text-gray-700 transition-all hover:bg-gray-200 disabled:opacity-50"
            >
              <Volume2 className="h-5 w-5" />
              {ttsLoading ? 'Loading...' : ttsPlaying ? 'Playing...' : 'Listen first'}
            </button>

            {/* Record button */}
            <button
              onClick={handleStartRecording}
              disabled={!voice.isSupported}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-medium text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
            >
              <Mic className="h-5 w-5" />
              {voice.isSupported ? 'Record yourself' : 'Recording not supported'}
            </button>

            {/* Skip link */}
            <button
              onClick={handleSkip}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Skip for now
            </button>
          </div>
        )}

        {state === 'recording' && (
          <div className="space-y-4">
            {/* Recording indicator */}
            <div className="flex flex-col items-center py-4">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <div className="h-4 w-4 animate-pulse rounded-full bg-red-500" />
              </div>
              <p className="text-lg font-medium text-gray-900">Recording...</p>
              <p className="text-sm text-gray-500">{voice.duration}s</p>
            </div>

            {/* Stop button */}
            <button
              onClick={handleStopRecording}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 py-3 font-medium text-white transition-all hover:bg-red-600"
            >
              Stop recording
            </button>
          </div>
        )}

        {state === 'preview' && (
          <div className="space-y-4">
            {/* Encouragement */}
            <div className="rounded-xl bg-emerald-50 p-4 text-center">
              <p className="text-lg font-medium text-emerald-700">{encouragement}</p>
            </div>

            {/* Playback and actions */}
            <div className="flex gap-2">
              <button
                onClick={handlePlayback}
                disabled={voice.isPlaying || voice.isUploading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 font-medium text-gray-700 transition-all hover:bg-gray-200 disabled:opacity-50"
              >
                <Play className="h-5 w-5" />
                {voice.isPlaying ? 'Playing...' : 'Hear yourself'}
              </button>

              <button
                onClick={handleTryAgain}
                className="flex items-center justify-center rounded-xl bg-gray-100 px-4 py-3 text-gray-700 transition-all hover:bg-gray-200"
                title="Try again"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
            </div>

            {/* Done button */}
            <button
              onClick={() => handleDone(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-medium text-white transition-all hover:bg-emerald-700"
            >
              <Check className="h-5 w-5" />
              Done
            </button>

            {/* Upload status */}
            {voice.isUploading && (
              <p className="text-center text-xs text-gray-400">Saving recording...</p>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
