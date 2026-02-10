'use client';

import { useUserStats } from '@/hooks/useUserStats';
import { UserStatsGrid } from './StatsCard';

interface ProfileStatsProps {
  username: string;
  // Initial values from server for instant display
  initialStats?: {
    cardsViewed: number;
    cardsMastered: number;
    currentStreak: number;
    longestStreak: number;
  };
}

/**
 * Client component for profile stats with real-time updates
 * Starts with server-rendered initial values, then hydrates with fresh data
 */
export function ProfileStats({ username, initialStats }: ProfileStatsProps) {
  const { stats, loading } = useUserStats(username);

  // Use initial stats while loading, then switch to fresh data
  const displayStats = loading && initialStats ? initialStats : stats;

  return (
    <section aria-label="Learning statistics">
      <h2 className="sr-only">Learning Statistics</h2>
      <UserStatsGrid
        cardsViewed={displayStats.cardsViewed}
        cardsMastered={displayStats.cardsMastered}
        currentStreak={displayStats.currentStreak}
        longestStreak={displayStats.longestStreak}
        loading={false} // Don't show skeleton if we have initial stats
      />
    </section>
  );
}
