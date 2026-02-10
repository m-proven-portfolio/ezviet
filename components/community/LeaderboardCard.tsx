'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Trophy, Zap, Music } from 'lucide-react';
import { type CoreTier, getCoreTierConfig } from '@/lib/core-tiers';
import type { LeaderboardEntry } from '@/app/api/leaderboard/route';

interface LeaderboardCardProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
}

/**
 * LeaderboardCard - Displays a single leaderboard entry
 *
 * Shows rank, avatar, username, tier badge, and weekly stats.
 * Highlights differently for top 3 and current user.
 */
export function LeaderboardCard({
  entry,
  isCurrentUser = false,
}: LeaderboardCardProps) {
  const tierConfig = getCoreTierConfig(entry.tier.id as CoreTier);

  // Rank styling
  const getRankStyles = () => {
    switch (entry.rank) {
      case 1:
        return {
          badge: 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900',
          ring: 'ring-2 ring-yellow-400/50',
          icon: '🥇',
        };
      case 2:
        return {
          badge: 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700',
          ring: 'ring-2 ring-gray-300/50',
          icon: '🥈',
        };
      case 3:
        return {
          badge: 'bg-gradient-to-r from-amber-600 to-amber-700 text-amber-100',
          ring: 'ring-2 ring-amber-500/50',
          icon: '🥉',
        };
      default:
        return {
          badge: 'bg-gray-100 text-gray-600',
          ring: '',
          icon: null,
        };
    }
  };

  const rankStyles = getRankStyles();

  return (
    <Link
      href={`/@${entry.username}`}
      className={`
        flex items-center gap-4 p-4 rounded-xl transition-all
        hover:bg-gray-50 hover:scale-[1.01]
        ${isCurrentUser ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-white border border-gray-100'}
        ${rankStyles.ring}
      `}
    >
      {/* Rank */}
      <div
        className={`
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          font-bold text-lg ${rankStyles.badge}
        `}
      >
        {rankStyles.icon || `#${entry.rank}`}
      </div>

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {entry.avatarUrl ? (
          <Image
            src={entry.avatarUrl}
            alt={entry.username}
            width={48}
            height={48}
            className="rounded-full"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-lg text-gray-500">
              {entry.username[0]?.toUpperCase()}
            </span>
          </div>
        )}
        {/* Tier badge */}
        <span
          className="absolute -bottom-1 -right-1 text-base"
          title={tierConfig.label}
        >
          {entry.tier.icon}
        </span>
      </div>

      {/* User info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900 truncate">
            @{entry.username}
          </p>
          {isCurrentUser && (
            <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
              You
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 truncate">
          {entry.displayName || tierConfig.label}
        </p>
      </div>

      {/* Stats */}
      <div className="flex-shrink-0 text-right">
        <div className="flex items-center gap-1 text-emerald-600">
          <Zap className="w-4 h-4" />
          <span className="font-bold">{entry.weeklyPoints.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-400 text-sm mt-0.5">
          <Music className="w-3 h-3" />
          <span>{entry.weeklySubmissions} syncs</span>
        </div>
      </div>
    </Link>
  );
}

/**
 * LeaderboardHeader - Top section of the leaderboard
 */
export function LeaderboardHeader({
  weekStart,
  weekEnd,
  totalContributors,
}: {
  weekStart: string;
  weekEnd: string;
  totalContributors: number;
}) {
  const startDate = new Date(weekStart);
  const endDate = new Date(weekEnd);

  // Calculate time until reset
  const now = new Date();
  const msUntilReset = endDate.getTime() - now.getTime();
  const hoursUntilReset = Math.floor(msUntilReset / (1000 * 60 * 60));
  const daysUntilReset = Math.floor(hoursUntilReset / 24);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-yellow-100 px-4 py-2 rounded-full mb-4">
        <Trophy className="w-5 h-5 text-amber-600" />
        <span className="font-semibold text-amber-800">Weekly Leaderboard</span>
      </div>

      <p className="text-gray-500 text-sm">
        {formatDate(startDate)} - {formatDate(endDate)}
      </p>

      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div>
          <span className="text-gray-400">Contributors:</span>{' '}
          <span className="font-medium text-gray-700">{totalContributors}</span>
        </div>
        <div>
          <span className="text-gray-400">Resets in:</span>{' '}
          <span className="font-medium text-emerald-600">
            {daysUntilReset > 0
              ? `${daysUntilReset}d ${hoursUntilReset % 24}h`
              : `${hoursUntilReset}h`}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * UserRankBanner - Shows current user's rank if not in top 10
 */
export function UserRankBanner({
  rank,
  totalContributors,
}: {
  rank: number;
  totalContributors: number;
}) {
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
      <p className="text-emerald-700">
        Your rank: <span className="font-bold">#{rank}</span> of{' '}
        {totalContributors} contributors
      </p>
      <p className="text-emerald-600 text-sm mt-1">
        Keep syncing to climb the leaderboard!
      </p>
    </div>
  );
}
