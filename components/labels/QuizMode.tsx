'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Check, X, ArrowRight, Volume2 } from 'lucide-react';
import { LabelMarker } from './LabelMarker';
import { HintPanel } from './HintPanel';
import { AutoCorrectTooltip } from './AutoCorrectTooltip';
import {
  matchVietnameseWithConfig,
  isCloseAnswer,
  checkAutoCorrect,
} from '@/lib/labels/matching';
import {
  type LabelSetWithLabels,
  type QuizAnswer,
  type HintType,
} from '@/lib/labels/types';
import { useIntensityConfig } from '@/hooks/useIntensityConfig';
import { PRESET_METADATA } from '@/lib/intensity';

interface QuizModeProps {
  labelSet: LabelSetWithLabels;
  currentIndex: number;
  answers: QuizAnswer[];
  onAnswer: (answer: QuizAnswer) => void;
  onComplete: () => void;
}

export function QuizMode({
  labelSet,
  currentIndex,
  answers: _answers, // Used by parent for result calculation
  onAnswer,
  onComplete,
}: QuizModeProps) {
  const [userInput, setUserInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<QuizAnswer | null>(null);
  const [hintsUsed, setHintsUsed] = useState<HintType[]>([]);
  const [hintPenalty, setHintPenalty] = useState(0);
  const [autoCorrectSpelling, setAutoCorrectSpelling] = useState<string | null>(
    null
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const questionStartTime = useRef<number>(0);

  // Resolve intensity config from new system or legacy difficulty
  const intensityConfig = useIntensityConfig({
    intensityConfig: labelSet.intensity_config,
    difficulty: labelSet.difficulty,
  });

  const currentLabel = labelSet.labels[currentIndex];
  const isLastQuestion = currentIndex >= labelSet.labels.length - 1;
  const imageUrl = labelSet.image_url;

  // Focus input when question changes
  useEffect(() => {
    if (!showResult && inputRef.current) {
      inputRef.current.focus();
    }
    questionStartTime.current = Date.now();
  }, [currentIndex, showResult]);

  // Play audio for current label
  const playAudio = useCallback(() => {
    if (currentLabel?.audio_url) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(currentLabel.audio_url);
      audioRef.current.play().catch(console.error);
    }
  }, [currentLabel]);

  // Handle using a hint
  const handleUseHint = useCallback(
    (type: HintType) => {
      if (hintsUsed.includes(type)) return;

      // Get penalty from intensity config
      const penalty = intensityConfig.hints.penalties[type] ?? 0;

      setHintsUsed((prev) => [...prev, type]);
      setHintPenalty((prev) => prev + penalty);
    },
    [hintsUsed, intensityConfig.hints.penalties]
  );

  // Handle answer submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!currentLabel || userInput.trim() === '') return;

      const timeSpent = Date.now() - questionStartTime.current;
      const matchResult = matchVietnameseWithConfig(
        userInput,
        currentLabel.vietnamese,
        intensityConfig
      );

      // Check for auto-correct (diacritic-insensitive match)
      const autoCorrect = checkAutoCorrect(userInput, currentLabel.vietnamese);
      const wasAutoCorrect =
        matchResult.matchType === 'diacritic_insensitive' && autoCorrect !== null;

      if (wasAutoCorrect) {
        setAutoCorrectSpelling(autoCorrect);
      }

      // Calculate final score with hint penalty
      const finalScore = Math.max(0, matchResult.score - hintPenalty);

      const answer: QuizAnswer = {
        labelId: currentLabel.id,
        userAnswer: userInput,
        correctAnswer: currentLabel.vietnamese,
        isCorrect: matchResult.isMatch,
        matchType: matchResult.matchType,
        score: finalScore,
        timeSpent,
        hintsUsed,
        hintPenalty,
        wasAutoCorrect,
      };

      setLastAnswer(answer);
      setShowResult(true);
    },
    [currentLabel, userInput, intensityConfig, hintsUsed, hintPenalty]
  );

  // Move to next question
  const handleNext = useCallback(() => {
    if (lastAnswer) {
      onAnswer(lastAnswer);
    }

    if (isLastQuestion) {
      onComplete();
    } else {
      // Reset state for next question
      setUserInput('');
      setShowResult(false);
      setLastAnswer(null);
      setHintsUsed([]);
      setHintPenalty(0);
      setAutoCorrectSpelling(null);
    }
  }, [lastAnswer, onAnswer, isLastQuestion, onComplete]);

  // Handle Enter key in result view
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && showResult) {
        handleNext();
      }
    },
    [showResult, handleNext]
  );

  if (!currentLabel) return null;

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown}>
      {/* Progress bar */}
      <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-amber-500 transition-all duration-300"
          style={{
            width: `${((currentIndex + (showResult ? 1 : 0)) / labelSet.labels.length) * 100}%`,
          }}
        />
      </div>

      {/* Image with current marker highlighted - breakout for larger display */}
      <div className="relative rounded-xl overflow-hidden shadow-lg bg-slate-100 -mx-4 md:-mx-8 lg:-mx-12">
        <Image
          src={imageUrl}
          alt={labelSet.title}
          width={1200}
          height={900}
          className="w-full h-auto object-contain"
          priority
        />

        {/* Only show current label marker */}
        <div data-label-marker>
          <LabelMarker
            label={currentLabel}
            index={currentIndex}
            isExplored={false}
            isActive={true}
            onClick={() => {}}
            mode="quiz"
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="text-center mb-4">
          <p className="text-sm text-slate-500 mb-1">
            Question {currentIndex + 1} of {labelSet.labels.length}
          </p>
          <p className="text-xl font-semibold text-slate-700">
            What is the Vietnamese word for:
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {currentLabel.english}
          </p>
          {currentLabel.pronunciation && (
            <p className="text-sm text-slate-400 mt-1">
              Hint: pronounced /{currentLabel.pronunciation}/
            </p>
          )}
        </div>

        {!showResult ? (
          /* Input form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type the Vietnamese word..."
                className="w-full px-4 py-3 text-lg border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition-colors"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>

            {/* Progressive hint panel */}
            <HintPanel
              label={currentLabel}
              hintsUsed={hintsUsed}
              hintPenalty={hintPenalty}
              onUseHint={handleUseHint}
              onPlayAudio={playAudio}
              intensityConfig={intensityConfig}
            />

            <button
              type="submit"
              disabled={userInput.trim() === ''}
              className={`
                w-full py-3 rounded-xl font-semibold transition-all duration-200
                ${
                  userInput.trim() === ''
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-amber-500 text-white hover:bg-amber-600 shadow-md hover:shadow-lg'
                }
              `}
            >
              Check Answer
            </button>
          </form>
        ) : (
          /* Result display */
          <div className="space-y-4">
            {/* Auto-correct tooltip for diacritic-insensitive matches */}
            {autoCorrectSpelling && lastAnswer?.wasAutoCorrect && (
              <AutoCorrectTooltip
                userAnswer={lastAnswer.userAnswer}
                correctSpelling={autoCorrectSpelling}
                onDismiss={() => setAutoCorrectSpelling(null)}
              />
            )}

            {/* Standard result feedback (skip if showing auto-correct) */}
            {!(autoCorrectSpelling && lastAnswer?.wasAutoCorrect) && (
              <div
                className={`
                  p-4 rounded-xl border-2
                  ${
                    lastAnswer?.isCorrect
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-red-50 border-red-200'
                  }
                `}
              >
                <div className="flex items-center gap-3 mb-2">
                  {lastAnswer?.isCorrect ? (
                    <Check className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <X className="w-6 h-6 text-red-500" />
                  )}
                  <span
                    className={`font-semibold ${
                      lastAnswer?.isCorrect ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {lastAnswer?.matchType === 'exact'
                      ? 'Perfect!'
                      : lastAnswer?.matchType === 'fuzzy'
                        ? 'Close enough! Check the spelling.'
                        : 'Not quite. Try again!'}
                  </span>
                </div>

                {/* Show correct answer if wrong */}
                {!lastAnswer?.isCorrect && (
                  <div className="mt-2">
                    <p className="text-sm text-slate-500">Correct answer:</p>
                    <p className="text-xl font-bold text-slate-800">
                      {currentLabel.vietnamese}
                    </p>
                  </div>
                )}

                {/* Your answer */}
                <div className="mt-2">
                  <p className="text-sm text-slate-500">Your answer:</p>
                  <p
                    className={`text-lg font-medium ${
                      lastAnswer?.isCorrect ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {lastAnswer?.userAnswer || '(empty)'}
                  </p>
                </div>

                {/* Close match hint */}
                {!lastAnswer?.isCorrect &&
                  lastAnswer?.userAnswer &&
                  isCloseAnswer(lastAnswer.userAnswer, currentLabel.vietnamese) && (
                    <p className="mt-2 text-sm text-amber-600">
                      You were close! Check the diacritics.
                    </p>
                  )}
              </div>
            )}

            {/* Show hint penalty if any */}
            {lastAnswer?.hintPenalty && lastAnswer.hintPenalty > 0 && (
              <p className="text-center text-sm text-amber-600">
                Hint penalty: -{lastAnswer.hintPenalty} pts
              </p>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {isLastQuestion ? 'See Results' : 'Next Question'}
              <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Intensity indicator */}
      <div className="text-center text-xs text-slate-400">
        <span className="font-medium">
          {PRESET_METADATA[intensityConfig.preset].title}
        </span>
        {' mode • '}
        {intensityConfig.matching === 'fuzzy' && 'fuzzy matching'}
        {intensityConfig.matching === 'diacritic_insensitive' && 'diacritics optional'}
        {intensityConfig.matching === 'exact' && 'exact match required'}
      </div>
    </div>
  );
}
