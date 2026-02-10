'use client';

import { useState, useEffect } from 'react';
import {
  LeaderboardCard,
  LeaderboardHeader,
  UserRankBanner,
} from '@/components/community/LeaderboardCard';
import type { LeaderboardEntry } from '@/app/api/leaderboard/route';
import { useAuthContext } from '@/contexts/AuthContext';

interface LeaderboardClientProps {
  initialData: {
    leaderboard: LeaderboardEntry[];
    totalContributors: number;
    weekStart: string;
    weekEnd: string;
  };
  initialUserRank: number | null;
}

/**
 * LeaderboardClient - Client component for the leaderboard page
 *
 * Handles user identification and real-time refresh.
 */
export function LeaderboardClient({
  initialData,
  initialUserRank,
}: LeaderboardClientProps) {
  const { user } = useAuthContext();
  const [data, setData] = useState(initialData);
  const [userRank, setUserRank] = useState(initialUserRank);

  // Refresh data periodically
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        if (res.ok) {
          const newData = await res.json();
          setData({
            leaderboard: newData.leaderboard,
            totalContributors: newData.totalContributors,
            weekStart: newData.weekStart,
            weekEnd: newData.weekEnd,
          });
          setUserRank(newData.userRank);
        }
      } catch (error) {
        console.error('Failed to refresh leaderboard:', error);
      }
    };

    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const { leaderboard, totalContributors, weekStart, weekEnd } = data;

  // Check if current user is in top 10
  const userInTop10 = user && leaderboard.some((entry) => entry.userId === user.id);

  return (
    <>
      <LeaderboardHeader
        weekStart={weekStart}
        weekEnd={weekEnd}
        totalContributors={totalContributors}
      />

      {leaderboard.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <p className="text-6xl mb-4">🎤</p>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No contributors yet this week
          </h2>
          <p className="text-gray-500">
            Be the first to sync a karaoke song and top the leaderboard!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry) => (
            <LeaderboardCard
              key={entry.userId}
              entry={entry}
              isCurrentUser={user?.id === entry.userId}
            />
          ))}
        </div>
      )}

      {/* Show user's rank if not in top 10 */}
      {user && userRank && !userInTop10 && (
        <div className="mt-6">
          <UserRankBanner rank={userRank} totalContributors={totalContributors} />
        </div>
      )}

      {/* Call to action for non-contributors */}
      {!user && (
        <div className="mt-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-center text-white">
          <h3 className="text-lg font-semibold mb-2">
            Want to join the leaderboard?
          </h3>
          <p className="text-emerald-100 mb-4">
            Sign in and start syncing karaoke songs to earn points and climb the ranks!
          </p>
          <a
            href="/login"
            className="inline-block bg-white text-emerald-600 font-semibold px-6 py-2 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            Sign in to start
          </a>
        </div>
      )}
    </>
  );
}
