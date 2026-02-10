'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Target, Clock, Zap, RotateCcw, Home, TrendingUp, AlertTriangle } from 'lucide-react';
import { useToneGymStore } from '@/lib/stores/toneGymStore';
import type { ToneSessionResults, VietnameseTone } from '@/lib/tone-gym/types';
import { TONE_DISPLAY_NAMES } from '@/lib/tone-gym/types';
import confetti from 'canvas-confetti';

interface ToneSessionCompleteProps {
  results: ToneSessionResults;
  difficulty: 1 | 2 | 3;
}

/**
 * ToneSessionComplete - Session results screen
 *
 * Shows:
 * - Overall accuracy
 * - Time stats
 * - Streak info
 * - Per-tone breakdown
 * - Confused pairs (areas to practice)
 */
export function ToneSessionComplete({ results, difficulty }: ToneSessionCompleteProps) {
  const router = useRouter();
  const resetSession = useToneGymStore((state) => state.resetSession);

  // Celebration confetti for good performance
  useEffect(() => {
    if (results.accuracy >= 80) {
      const duration = results.newBestStreak ? 3000 : 1500;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: results.accuracy >= 90 ? 5 : 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: results.accuracy >= 90 ? 5 : 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [results.accuracy, results.newBestStreak]);

  // Calculate grade
  const getGrade = () => {
    if (results.accuracy >= 90) return { letter: 'A', color: 'text-emerald-400' };
    if (results.accuracy >= 80) return { letter: 'B', color: 'text-blue-400' };
    if (results.accuracy >= 70) return { letter: 'C', color: 'text-yellow-400' };
    if (results.accuracy >= 60) return { letter: 'D', color: 'text-orange-400' };
    return { letter: 'F', color: 'text-red-400' };
  };

  const grade = getGrade();

  // Handle try again
  const handleTryAgain = () => {
    resetSession();
    router.push(`/tone-gym/${difficulty}`);
  };

  // Handle go home
  const handleGoHome = () => {
    resetSession();
    router.push('/tone-gym');
  };

  // Get confused pairs summary
  const getConfusedPairsSummary = () => {
    const pairs = new Map<string, number>();
    for (const { selected, correct } of results.confusedPairs) {
      const key = `${selected}_${correct}`;
      pairs.set(key, (pairs.get(key) || 0) + 1);
    }
    return Array.from(pairs.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  };

  const confusedPairs = getConfusedPairsSummary();

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-8">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className={`text-7xl font-bold ${grade.color} mb-2`}>{grade.letter}</div>
          <h1 className="text-2xl font-bold text-white">Session Complete!</h1>
          {results.newBestStreak && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm">
              <Trophy className="w-4 h-4" />
              New Best Streak!
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Accuracy */}
          <div className="bg-slate-800 rounded-xl p-4 text-center">
            <Target className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{Math.round(results.accuracy)}%</div>
            <div className="text-sm text-slate-400">Accuracy</div>
          </div>

          {/* Correct */}
          <div className="bg-slate-800 rounded-xl p-4 text-center">
            <TrendingUp className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {results.correctAnswers}/{results.totalQuestions}
            </div>
            <div className="text-sm text-slate-400">Correct</div>
          </div>

          {/* Time */}
          <div className="bg-slate-800 rounded-xl p-4 text-center">
            <Clock className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {Math.round(results.avgTimePerQuestion)}s
            </div>
            <div className="text-sm text-slate-400">Avg per Q</div>
          </div>

          {/* Streak */}
          <div className="bg-slate-800 rounded-xl p-4 text-center">
            <Zap className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{results.currentStreak}</div>
            <div className="text-sm text-slate-400">Final Streak</div>
          </div>
        </div>

        {/* Tone breakdown */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-lg font-medium text-white mb-3">Tone Breakdown</h2>
          <div className="space-y-2">
            {(Object.entries(results.toneBreakdown) as [VietnameseTone, { correct: number; total: number }][])
              .filter(([, stats]) => stats.total > 0)
              .map(([tone, stats]) => {
                const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
                return (
                  <div key={tone} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-slate-300 truncate">
                      {TONE_DISPLAY_NAMES[tone].split(' ')[0]}
                    </div>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          accuracy >= 80
                            ? 'bg-emerald-500'
                            : accuracy >= 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${accuracy}%` }}
                      />
                    </div>
                    <div className="w-12 text-sm text-slate-400 text-right">
                      {stats.correct}/{stats.total}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Confused pairs (if any) */}
        {confusedPairs.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-medium text-white">Practice These Pairs</h2>
            </div>
            <div className="space-y-2">
              {confusedPairs.map(([pair, count]) => {
                const [selected, correct] = pair.split('_') as [VietnameseTone, VietnameseTone];
                return (
                  <div key={pair} className="flex items-center justify-between text-sm">
                    <div className="text-slate-300">
                      You heard <span className="text-emerald-400">{TONE_DISPLAY_NAMES[correct].split(' ')[0]}</span>,
                      picked <span className="text-red-400">{TONE_DISPLAY_NAMES[selected].split(' ')[0]}</span>
                    </div>
                    <div className="text-slate-500">{count}x</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <button
            onClick={handleTryAgain}
            className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white
                       rounded-xl font-medium text-lg flex items-center justify-center gap-2
                       transition-all active:scale-[0.98]"
          >
            <RotateCcw className="w-5 h-5" />
            Try Again
          </button>

          <button
            onClick={handleGoHome}
            className="w-full py-4 px-6 bg-slate-700 hover:bg-slate-600 text-white
                       rounded-xl font-medium text-lg flex items-center justify-center gap-2
                       transition-all active:scale-[0.98]"
          >
            <Home className="w-5 h-5" />
            Back to Tone Gym
          </button>
        </div>
      </div>
    </div>
  );
}
