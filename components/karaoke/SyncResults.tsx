'use client';

import { useState } from 'react';
import { Trophy, RotateCcw, Send, SkipForward, X, Sparkles } from 'lucide-react';
import type { SyncSessionStats } from '@/lib/lrc-sync';
import type { VoteType } from '@/lib/lrc-voting';
import { InlineRatingPrompt } from './InlineRatingPrompt';
import { KaraokeShareButton } from './KaraokeShareButton';

interface SyncResultsProps {
  stats: SyncSessionStats;
  songId: string;
  songTitle: string;
  onSubmit: (userRating: VoteType) => void;
  onRetry: () => void;
  onClose: () => void;
  onNextSong?: () => void;
  onOpenEditor?: () => void;
  hasNextSong?: boolean;
  isSubmitting: boolean;
}

export function SyncResults({
  stats,
  songId,
  songTitle,
  onSubmit,
  onRetry,
  onClose,
  onNextSong,
  onOpenEditor,
  hasNextSong,
  isSubmitting,
}: SyncResultsProps) {
  const [hasRated, setHasRated] = useState(false);
  const [userRating, setUserRating] = useState<VoteType | null>(null);

  const getGrade = (accuracy: number): { grade: string; color: string } => {
    // Grade thresholds based on tap rating distribution:
    // - S (95%+): Nearly all Perfects - elite tier!
    // - A (85%+): Mostly Perfects with some Goods
    // - B (70%+): Solid mix of Perfect/Good
    // - C (55%+): Decent performance with some OKs
    // - D (40%+): Learning, but keep practicing!
    // - F (<40%): Lots of misses - try again!
    if (accuracy >= 95) return { grade: 'S', color: 'text-yellow-400' };
    if (accuracy >= 85) return { grade: 'A', color: 'text-green-400' };
    if (accuracy >= 70) return { grade: 'B', color: 'text-blue-400' };
    if (accuracy >= 55) return { grade: 'C', color: 'text-purple-400' };
    if (accuracy >= 40) return { grade: 'D', color: 'text-orange-400' };
    return { grade: 'F', color: 'text-red-400' };
  };

  const { grade, color } = getGrade(stats.accuracyPercent);

  const handleRating = (voteType: VoteType) => {
    setUserRating(voteType);
    setHasRated(true);
  };

  const handleSubmit = () => {
    if (userRating) {
      onSubmit(userRating);
    }
  };

  return (
    <div className="absolute inset-0 z-20 bg-gradient-to-b from-purple-900 via-indigo-950 to-black overflow-y-auto">
      <div className="min-h-full flex flex-col items-center justify-center p-6 py-12">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-3xl p-6 sm:p-8 text-center">
          {/* Header */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">Sync Complete!</h2>
          </div>

          {/* Song title */}
          <p className="text-purple-300 mb-6 truncate">{songTitle}</p>

          {/* Grade - always visible */}
          <div className={`text-8xl font-black ${color} mb-4`}>{grade}</div>

          {/* Stage 1: Rating prompt (before full reveal) */}
          {!hasRated && (
            <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <InlineRatingPrompt
                songId={songId}
                accuracyScore={stats.accuracyPercent}
                onRate={handleRating}
                onOpenEditor={onOpenEditor}
              />
            </div>
          )}

          {/* Stage 2: Full stats (revealed after rating) */}
          {hasRated && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Celebration message */}
              <div className="flex items-center justify-center gap-2 text-emerald-400 mb-4">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Thanks for your feedback!</span>
                <Sparkles className="w-4 h-4" />
              </div>

              {/* Score */}
              <div className="text-4xl font-bold text-white mb-4">
                {stats.totalPoints.toLocaleString()} pts
              </div>

              {/* Share score */}
              <div className="mb-6">
                <KaraokeShareButton
                  title={`${grade} Grade on "${songTitle}" - Karaoke Hero`}
                  text={`I scored ${stats.totalPoints.toLocaleString()} pts with ${stats.accuracyPercent.toFixed(0)}% accuracy on "${songTitle}" in Karaoke Hero! 🎤🔥 Learn Vietnamese through music on EZViet.`}
                  url="https://ezviet.org/karaoke"
                  variant="inline"
                />
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                <StatItem label="Accuracy" value={`${stats.accuracyPercent.toFixed(1)}%`} />
                <StatItem label="Best Streak" value={stats.bestStreak.toString()} />
                <StatItem label="Perfect" value={stats.perfectCount.toString()} subtext="green" />
                <StatItem label="Good" value={stats.goodCount.toString()} subtext="yellow" />
                <StatItem label="OK" value={stats.okCount.toString()} subtext="gray" />
                <StatItem label="Miss" value={stats.missCount.toString()} subtext="red" />
              </div>

              {/* Average timing */}
              <div className="text-sm text-white/60 mb-8">
                Average timing difference: {stats.averageDelta >= 0 ? '+' : ''}
                {stats.averageDelta.toFixed(2)}s
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                {/* Primary CTA - Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-purple-900 font-semibold rounded-xl hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  <Send className="w-5 h-5" />
                  {isSubmitting ? 'Submitting...' : 'Submit & Earn Points'}
                </button>

                {/* Secondary actions */}
                <div className="flex gap-3">
                  <button
                    onClick={onRetry}
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/15 text-white font-medium rounded-xl border border-white/20 hover:bg-white/25 disabled:opacity-50 transition-all"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Play Again
                  </button>
                  {hasNextSong && onNextSong && (
                    <button
                      onClick={onNextSong}
                      disabled={isSubmitting}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/15 text-white font-medium rounded-xl border border-white/20 hover:bg-white/25 disabled:opacity-50 transition-all"
                    >
                      <SkipForward className="w-5 h-5" />
                      Next Song
                    </button>
                  )}
                </div>

                {/* Close */}
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-white/50 rounded-xl hover:text-white/70 hover:bg-white/5 disabled:opacity-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Pre-rating action buttons (Play Again / Close only) */}
          {!hasRated && (
            <div className="flex flex-col gap-3 mt-6 animate-in fade-in duration-300">
              <div className="flex gap-3">
                <button
                  onClick={onRetry}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white/70 font-medium rounded-xl border border-white/10 hover:bg-white/15 transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                  Play Again
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 text-white/50 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext?: string;
}) {
  const dotColors: Record<string, string> = {
    green: 'bg-green-400',
    yellow: 'bg-yellow-400',
    gray: 'bg-gray-400',
    red: 'bg-red-400',
  };

  return (
    <div className="bg-white/5 rounded-lg p-3">
      <div className="flex items-center gap-2">
        {subtext && <div className={`w-2 h-2 rounded-full ${dotColors[subtext]}`} />}
        <span className="text-white/60 text-sm">{label}</span>
      </div>
      <div className="text-white font-bold text-xl">{value}</div>
    </div>
  );
}
