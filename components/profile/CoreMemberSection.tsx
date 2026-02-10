'use client';

import { Music, Zap, Trophy, TrendingUp } from 'lucide-react';
import { CoreBadge } from '@/components/badges/CoreBadge';
import {
  getCoreTier,
  getTierProgress,
  getCoreTierConfig,
  isCoreMember,
} from '@/lib/core-tiers';

interface LrcStats {
  total_points: number;
  level: number;
  songs_synced: number;
  accuracy_rate?: number;
  best_streak: number;
}

interface CoreMemberSectionProps {
  lrcStats: LrcStats | null;
  recentSongsSlot?: React.ReactNode; // Slot for RecentSyncedSongs component
}

/**
 * CoreMemberSection - Displays EZViet Core contributor status and stats
 *
 * Features:
 * - Tier badge with progress bar to next tier
 * - Stats grid (points, level, songs, streak)
 * - Slot for recent synced songs
 */
export function CoreMemberSection({
  lrcStats,
  recentSongsSlot,
}: CoreMemberSectionProps) {
  // Don't show if user hasn't contributed
  if (!lrcStats || !isCoreMember(lrcStats.total_points)) {
    return null;
  }

  const tier = getCoreTier(lrcStats.total_points);
  const tierConfig = getCoreTierConfig(tier);
  const { nextTier, progress, pointsToNext } = getTierProgress(lrcStats.total_points);
  const nextTierConfig = nextTier ? getCoreTierConfig(nextTier) : null;

  return (
    <section aria-label="EZViet Core contributor statistics" className="mt-6">
      {/* Header with tier badge */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span className="text-lg">🎤</span> EZViet Core
        </h2>
        <CoreBadge tier={tier} size="md" />
      </div>

      {/* Progress to next tier */}
      {nextTier && (
        <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Progress to {nextTierConfig?.label}</span>
            <span className="font-medium text-gray-700">
              {pointsToNext.toLocaleString()} pts to go
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${tierConfig.bgGradient.replace('/20', '')} transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              {tierConfig.icon} {tierConfig.label}
            </span>
            <span className="flex items-center gap-1">
              {nextTierConfig?.icon} {nextTierConfig?.label}
            </span>
          </div>
        </div>
      )}

      {/* Max tier celebration */}
      {!nextTier && (
        <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
          <p className="text-sm text-yellow-800 font-medium flex items-center gap-2">
            <span>👑</span> You&apos;ve reached the highest tier! Thank you for your incredible contributions.
          </p>
        </div>
      )}

      {/* Stats grid */}
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<Zap className="w-4 h-4" />}
          label="Points"
          value={lrcStats.total_points.toLocaleString()}
          colorClass="from-yellow-50 to-orange-50 border-yellow-100 text-yellow-600"
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Level"
          value={lrcStats.level.toString()}
          colorClass="from-purple-50 to-pink-50 border-purple-100 text-purple-600"
        />
        <StatCard
          icon={<Music className="w-4 h-4" />}
          label="Songs"
          value={lrcStats.songs_synced.toString()}
          colorClass="from-blue-50 to-cyan-50 border-blue-100 text-blue-600"
        />
        <StatCard
          icon={<Trophy className="w-4 h-4" />}
          label="Best Streak"
          value={lrcStats.best_streak.toString()}
          colorClass="from-green-50 to-emerald-50 border-green-100 text-green-600"
        />
      </dl>

      {/* Recent synced songs slot */}
      {recentSongsSlot}
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colorClass: string;
}) {
  // Extract text color from colorClass
  const textColorMatch = colorClass.match(/text-(\w+-\d+)/);
  const textColor = textColorMatch ? textColorMatch[0] : 'text-gray-600';
  const labelColor = textColor.replace('-600', '-700');

  return (
    <div className={`bg-gradient-to-br ${colorClass} rounded-xl p-3 text-center border`}>
      <dd className="text-xl font-bold flex items-center justify-center gap-1.5">
        <span className={textColor}>{icon}</span>
        <span>{value}</span>
      </dd>
      <dt className={`text-xs ${labelColor} mt-1`}>{label}</dt>
    </div>
  );
}
