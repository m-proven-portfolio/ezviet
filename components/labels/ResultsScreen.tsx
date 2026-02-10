'use client';

import { useEffect, useRef } from 'react';
import { Trophy, Clock, Target, RotateCcw, Compass, Check, X, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { QuizResult, LabelSetWithLabels } from '@/lib/labels/types';

interface ResultsScreenProps {
  result: QuizResult;
  labelSet: LabelSetWithLabels;
  onRetry: () => void;
  onExplore: () => void;
}

export function ResultsScreen({
  result,
  labelSet,
  onRetry,
  onExplore,
}: ResultsScreenProps) {
  const confettiTriggered = useRef(false);

  // Trigger confetti for good scores
  useEffect(() => {
    if (confettiTriggered.current) return;

    if (result.score >= 80) {
      confettiTriggered.current = true;

      // Celebrate!
      const duration = result.isNewBest ? 3000 : 1500;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#10b981', '#3b82f6', '#f59e0b'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#10b981', '#3b82f6', '#f59e0b'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [result.score, result.isNewBest]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Score message
  const getScoreMessage = () => {
    if (result.score === 100) return 'Perfect!';
    if (result.score >= 90) return 'Excellent!';
    if (result.score >= 80) return 'Great job!';
    if (result.score >= 70) return 'Good effort!';
    if (result.score >= 50) return 'Keep practicing!';
    return 'Don\'t give up!';
  };

  // Score color
  const getScoreColor = () => {
    if (result.score >= 80) return 'text-emerald-500';
    if (result.score >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Main score card */}
      <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-6 shadow-lg text-center">
        {/* Trophy/star icon */}
        <div className="mb-4">
          {result.score >= 80 ? (
            <Trophy className="w-16 h-16 mx-auto text-amber-500" />
          ) : (
            <Target className="w-16 h-16 mx-auto text-slate-400" />
          )}
        </div>

        {/* Score */}
        <h2 className="text-4xl font-bold mb-2">
          <span className={getScoreColor()}>{result.score}%</span>
        </h2>
        <p className="text-xl text-slate-600 mb-4">{getScoreMessage()}</p>

        {/* New best badge */}
        {result.isNewBest && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold mb-4">
            <Star className="w-4 h-4" />
            New Personal Best!
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-50 rounded-xl p-3">
            <Check className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
            <p className="text-2xl font-bold text-slate-800">{result.correct}</p>
            <p className="text-xs text-slate-500">Correct</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <X className="w-5 h-5 mx-auto text-red-400 mb-1" />
            <p className="text-2xl font-bold text-slate-800">
              {result.total - result.correct}
            </p>
            <p className="text-xs text-slate-500">Wrong</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <Clock className="w-5 h-5 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold text-slate-800">
              {formatTime(result.timeSeconds)}
            </p>
            <p className="text-xs text-slate-500">Time</p>
          </div>
        </div>

        {/* Best stats (if logged in) */}
        {result.attempts > 1 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Best: {result.bestScore}%
              {result.bestTime && ` in ${formatTime(result.bestTime)}`}
              {' · '}
              Attempt #{result.attempts}
            </p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg"
        >
          <RotateCcw size={20} />
          Try Again
        </button>
        <button
          type="button"
          onClick={onExplore}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
        >
          <Compass size={20} />
          Review Words
        </button>
      </div>

      {/* Answer breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Answer Breakdown
        </h3>
        <div className="space-y-2">
          {result.answers.map((answer, index) => {
            const label = labelSet.labels.find((l) => l.id === answer.labelId);
            return (
              <div
                key={answer.labelId}
                className={`
                  flex items-center gap-3 p-3 rounded-lg
                  ${answer.isCorrect ? 'bg-emerald-50' : 'bg-red-50'}
                `}
              >
                <span
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white
                    ${answer.isCorrect ? 'bg-emerald-500' : 'bg-red-400'}
                  `}
                >
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">
                      {label?.vietnamese}
                    </span>
                    {answer.isCorrect ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <X className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{label?.english}</p>
                  {!answer.isCorrect && (
                    <p className="text-xs text-red-500 mt-1">
                      You answered: {answer.userAnswer || '(empty)'}
                    </p>
                  )}
                </div>
                <span className="text-sm text-slate-400">
                  {answer.score > 0 ? `+${answer.score}` : '0'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
