'use client';

import { formatStatNumber } from '@/lib/stats';

export type StatsCardColor = 'emerald' | 'blue' | 'purple' | 'orange' | 'pink';

interface StatsCardProps {
  label: string;
  value: number;
  color?: StatsCardColor;
  loading?: boolean;
  compact?: boolean;
}

const colorClasses: Record<StatsCardColor, string> = {
  emerald: 'text-emerald-600',
  blue: 'text-blue-600',
  purple: 'text-purple-600',
  orange: 'text-orange-500',
  pink: 'text-pink-600',
};

export function StatsCard({
  label,
  value,
  color = 'emerald',
  loading = false,
  compact = false,
}: StatsCardProps) {
  const valueClass = colorClasses[color];

  if (compact) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <dt className="text-sm text-gray-500">{label}</dt>
        <dd className={`text-2xl font-bold ${valueClass}`}>
          {loading ? (
            <span className="inline-block w-8 h-7 bg-gray-200 rounded animate-pulse" />
          ) : (
            formatStatNumber(value)
          )}
        </dd>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className={`text-3xl font-bold ${valueClass}`}>
        {loading ? (
          <span className="inline-block w-12 h-9 bg-gray-200 rounded animate-pulse" />
        ) : (
          formatStatNumber(value)
        )}
      </div>
      <div className="text-gray-600">{label}</div>
    </div>
  );
}

// ============================================
// STATS GRID LAYOUTS
// ============================================

interface AdminStatsGridProps {
  totalCards: number;
  totalCategories: number;
  totalViews: number;
  totalUsers?: number;
  loading?: boolean;
}

export function AdminStatsGrid({
  totalCards,
  totalCategories,
  totalViews,
  totalUsers,
  loading = false,
}: AdminStatsGridProps) {
  return (
    <div className={`grid ${totalUsers !== undefined ? 'grid-cols-4' : 'grid-cols-3'} gap-4 mb-8`}>
      <StatsCard
        label="Total Cards"
        value={totalCards}
        color="emerald"
        loading={loading}
      />
      <StatsCard
        label="Categories"
        value={totalCategories}
        color="blue"
        loading={loading}
      />
      <StatsCard
        label="Total Views"
        value={totalViews}
        color="purple"
        loading={loading}
      />
      {totalUsers !== undefined && (
        <StatsCard
          label="Total Users"
          value={totalUsers}
          color="pink"
          loading={loading}
        />
      )}
    </div>
  );
}

interface UserStatsGridProps {
  cardsViewed: number;
  cardsMastered: number;
  currentStreak: number;
  longestStreak: number;
  loading?: boolean;
}

export function UserStatsGrid({
  cardsViewed,
  cardsMastered,
  currentStreak,
  longestStreak,
  loading = false,
}: UserStatsGridProps) {
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <StatsCard
        label="Cards Viewed"
        value={cardsViewed}
        color="emerald"
        loading={loading}
        compact
      />
      <StatsCard
        label="Mastered"
        value={cardsMastered}
        color="blue"
        loading={loading}
        compact
      />
      <StatsCard
        label="Current Streak"
        value={currentStreak}
        color="orange"
        loading={loading}
        compact
      />
      <StatsCard
        label="Best Streak"
        value={longestStreak}
        color="purple"
        loading={loading}
        compact
      />
    </dl>
  );
}
