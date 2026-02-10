'use client';

import { useRouter } from 'next/navigation';
import { Sparkles, Target, Flame, Headphones, Zap, TrendingUp, ChevronRight } from 'lucide-react';
import type { ToneGymProgress } from '@/lib/tone-gym/types';
import { DIFFICULTY_INFO } from '@/lib/tone-gym/types';

interface ToneGymHubProps {
  progress: ToneGymProgress | null;
  recommendedDifficulty: 1 | 2 | 3;
}

const DIFFICULTY_ICONS = {
  1: Sparkles,
  2: Target,
  3: Flame,
};

const DIFFICULTY_COLORS = {
  1: {
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/50',
    hover: 'hover:border-emerald-500',
    text: 'text-emerald-400',
    icon: 'text-emerald-400',
  },
  2: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/50',
    hover: 'hover:border-blue-500',
    text: 'text-blue-400',
    icon: 'text-blue-400',
  },
  3: {
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/50',
    hover: 'hover:border-orange-500',
    text: 'text-orange-400',
    icon: 'text-orange-400',
  },
};

/**
 * ToneGymHub - Entry point for tone training
 *
 * Shows:
 * - Feature introduction
 * - User stats (if logged in)
 * - Difficulty selection
 */
export function ToneGymHub({ progress, recommendedDifficulty }: ToneGymHubProps) {
  const router = useRouter();

  const handleStartSession = (difficulty: 1 | 2 | 3) => {
    router.push(`/tone-gym/${difficulty}`);
  };

  const overallAccuracy = progress && progress.total_exercises > 0
    ? Math.round((progress.correct_answers / progress.total_exercises) * 100)
    : null;

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-8">
      <div className="max-w-md mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
            <Headphones className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Tone Gym</h1>
          <p className="text-slate-400">
            Train your ear to distinguish Vietnamese tones
          </p>
        </div>

        {/* Stats (if user has progress) */}
        {progress && progress.total_exercises > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-white">{progress.total_exercises}</div>
              <div className="text-xs text-slate-400">Exercises</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-emerald-400">{overallAccuracy}%</div>
              <div className="text-xs text-slate-400">Accuracy</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xl font-bold text-white">{progress.best_streak}</span>
              </div>
              <div className="text-xs text-slate-400">Best Streak</div>
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="bg-slate-800/50 rounded-xl p-4">
          <h2 className="text-sm font-medium text-slate-300 mb-3">How it works</h2>
          <div className="space-y-2 text-sm text-slate-400">
            <div className="flex items-start gap-2">
              <span className="text-emerald-400">1.</span>
              <span>Listen to a Vietnamese word</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400">2.</span>
              <span>Tap options to preview their sounds</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400">3.</span>
              <span>Select which tone you heard</span>
            </div>
          </div>
        </div>

        {/* Difficulty selection */}
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-white">Choose Difficulty</h2>

          {([1, 2, 3] as const).map((level) => {
            const info = DIFFICULTY_INFO[level];
            const colors = DIFFICULTY_COLORS[level];
            const Icon = DIFFICULTY_ICONS[level];
            const isRecommended = level === recommendedDifficulty;

            return (
              <button
                key={level}
                onClick={() => handleStartSession(level)}
                className={`
                  w-full p-4 rounded-xl border-2 transition-all text-left
                  ${colors.bg} ${colors.border} ${colors.hover}
                  active:scale-[0.98]
                `}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-slate-800 ${colors.icon}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{info.name}</span>
                      {isRecommended && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">{info.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Tip */}
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-purple-300 text-sm">Pro Tip</h3>
              <p className="text-sm text-purple-300/70 mt-1">
                Start with Easy to build your ear. The hardest pair to distinguish is
                <span className="text-purple-200"> hỏi (ả) </span>vs
                <span className="text-purple-200"> ngã (ã)</span> - both have a &ldquo;break&rdquo; in the middle!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
