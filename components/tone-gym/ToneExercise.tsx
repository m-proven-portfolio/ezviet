'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, Loader2, RotateCcw, ArrowRight, Zap } from 'lucide-react';
import { useToneGymStore } from '@/lib/stores/toneGymStore';
import { ToneOptionButton } from './ToneOptionButton';
import type { ToneQuestion, VietnameseTone } from '@/lib/tone-gym/types';
import confetti from 'canvas-confetti';

// Audio cache for target audio
const targetAudioCache = new Map<string, string>();

interface ToneExerciseProps {
  question: ToneQuestion;
}

/**
 * ToneExercise - Core UI for a single tone discrimination question
 *
 * Flow:
 * 1. Audio plays automatically on mount
 * 2. User taps options to preview their audio
 * 3. User taps to select, then confirms
 * 4. Feedback shows correct/incorrect
 * 5. User advances to next question
 */
export function ToneExercise({ question }: ToneExerciseProps) {
  const phase = useToneGymStore((state) => state.phase);
  const selectedOption = useToneGymStore((state) => state.selectedOption);
  const currentStreak = useToneGymStore((state) => state.currentStreak);
  const selectAnswer = useToneGymStore((state) => state.selectAnswer);
  const confirmAnswer = useToneGymStore((state) => state.confirmAnswer);
  const nextQuestion = useToneGymStore((state) => state.nextQuestion);
  const incrementReplays = useToneGymStore((state) => state.incrementReplays);
  const getProgress = useToneGymStore((state) => state.getProgress);
  const isLastQuestion = useToneGymStore((state) => state.isLastQuestion);

  const [isLoadingTargetAudio, setIsLoadingTargetAudio] = useState(false);
  const [isPlayingTargetAudio, setIsPlayingTargetAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastQuestionIdRef = useRef<string | null>(null);
  const hasPlayedForCurrentQuestion = useRef(false);

  const progress = getProgress();
  const showFeedback = phase === 'feedback';
  const lastAnswer = useToneGymStore((state) => {
    const session = state.session;
    if (!session || session.answers.length === 0) return null;
    return session.answers[session.answers.length - 1];
  });
  const wasCorrect = lastAnswer?.isCorrect;

  // Get target audio URL
  const getTargetAudioUrl = useCallback(async (): Promise<string | null> => {
    const variant = question.correctVariant;
    const cacheKey = `target_${variant.word}`;

    if (targetAudioCache.has(cacheKey)) {
      return targetAudioCache.get(cacheKey)!;
    }

    // Check for pre-recorded audio
    if (variant.audio_path) {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tone-gym-audio/${variant.audio_path}`;
      targetAudioCache.set(cacheKey, url);
      return url;
    }

    // Generate via TTS
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: variant.word,
          filenameHint: `tone-gym-target-${variant.word}`,
        }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      const url = data.publicUrl as string;
      targetAudioCache.set(cacheKey, url);
      return url;
    } catch {
      return null;
    }
  }, [question.correctVariant]);

  // Play target audio
  const playTargetAudio = useCallback(async () => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    // If already playing, stop
    if (isPlayingTargetAudio) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlayingTargetAudio(false);
      return;
    }

    setIsLoadingTargetAudio(true);
    const url = await getTargetAudioUrl();
    setIsLoadingTargetAudio(false);

    if (!url) return;

    audioRef.current.src = url;
    audioRef.current.play();
    setIsPlayingTargetAudio(true);
    hasPlayedForCurrentQuestion.current = true;

    audioRef.current.onended = () => setIsPlayingTargetAudio(false);
    audioRef.current.onerror = () => setIsPlayingTargetAudio(false);
  }, [getTargetAudioUrl, isPlayingTargetAudio]);

  // Auto-play when question changes
  const currentQuestionId = `${question.exercise.id}_${question.correctTone}`;
  useEffect(() => {
    // Reset tracking when question changes
    if (lastQuestionIdRef.current !== currentQuestionId) {
      hasPlayedForCurrentQuestion.current = false;
      lastQuestionIdRef.current = currentQuestionId;
    }

    // Auto-play if not played yet for this question
    if (!hasPlayedForCurrentQuestion.current && phase === 'playing') {
      const timer = setTimeout(() => {
        hasPlayedForCurrentQuestion.current = true;
        playTargetAudio();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentQuestionId, phase, playTargetAudio]);

  // Confetti on correct answer with streak
  useEffect(() => {
    if (showFeedback && wasCorrect && currentStreak >= 3) {
      confetti({
        particleCount: currentStreak >= 10 ? 150 : currentStreak >= 5 ? 100 : 50,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [showFeedback, wasCorrect, currentStreak]);

  // Handle replay button
  const handleReplay = () => {
    incrementReplays();
    playTargetAudio();
  };

  // Handle select
  const handleSelect = (tone: VietnameseTone) => {
    if (phase !== 'playing') return;

    if (selectedOption === tone) {
      // Second tap - confirm
      confirmAnswer();
    } else {
      // First tap - select
      selectAnswer(tone);
    }
  };

  // Handle next/finish
  const handleNext = () => {
    nextQuestion();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Progress bar */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
          <span>
            Question {progress.current} of {progress.total}
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-4 h-4 text-amber-400" />
            {currentStreak} streak
          </span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
        </div>
      </div>

      {/* Target audio section */}
      <div className="flex-shrink-0 px-4 py-6">
        <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-6 text-center">
          <p className="text-slate-400 text-sm mb-4">
            {showFeedback ? 'The correct answer was:' : 'Listen and identify the tone'}
          </p>

          {/* Show word only during feedback */}
          {showFeedback && (
            <p className="text-3xl font-bold text-white mb-4">
              {question.correctVariant.word}
              <span className="text-lg text-slate-400 ml-2">
                ({question.correctVariant.meaning_en})
              </span>
            </p>
          )}

          {/* Play button */}
          <button
            onClick={handleReplay}
            disabled={isLoadingTargetAudio}
            className={`
              inline-flex items-center gap-3 px-6 py-4 rounded-2xl
              transition-all text-lg font-medium
              ${
                isPlayingTargetAudio
                  ? 'bg-emerald-500 text-white scale-105'
                  : isLoadingTargetAudio
                    ? 'bg-slate-700 text-slate-400'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
              }
            `}
          >
            {isLoadingTargetAudio ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Volume2 className="w-6 h-6" />
            )}
            {isPlayingTargetAudio ? 'Playing...' : 'Play Audio'}
            {!showFeedback && (
              <RotateCcw className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Hint about base word during playing */}
          {!showFeedback && (
            <p className="mt-4 text-slate-500 text-sm">
              Base syllable: <span className="text-slate-300">{question.exercise.base_word}</span>
            </p>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="px-4 pb-2">
        <p className="text-center text-slate-400 text-sm">
          {phase === 'playing'
            ? selectedOption
              ? 'Tap again to confirm'
              : 'Tap to preview, tap again to select'
            : showFeedback && wasCorrect
              ? 'Correct!'
              : showFeedback
                ? 'Not quite - keep practicing!'
                : ''}
        </p>
      </div>

      {/* Options */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        <div className="space-y-3">
          {question.options.map((variant) => (
            <ToneOptionButton
              key={variant.tone}
              variant={variant}
              isSelected={selectedOption === variant.tone}
              isCorrect={
                showFeedback
                  ? variant.tone === question.correctTone
                    ? true
                    : selectedOption === variant.tone
                      ? false
                      : undefined
                  : undefined
              }
              isDisabled={phase !== 'playing'}
              showFeedback={showFeedback}
              onSelect={handleSelect}
              onPlayAudio={() => incrementReplays()}
            />
          ))}
        </div>
      </div>

      {/* Next button (during feedback) */}
      {showFeedback && (
        <div className="flex-shrink-0 px-4 pb-6">
          <button
            onClick={handleNext}
            className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white
                       rounded-xl font-medium text-lg flex items-center justify-center gap-2
                       transition-all active:scale-[0.98]"
          >
            {isLastQuestion() ? 'See Results' : 'Next Question'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
