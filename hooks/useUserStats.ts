'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { type UserStats, EMPTY_USER_STATS } from '@/lib/stats';

interface UseUserStatsReturn {
  stats: UserStats;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch user stats by username or current user
 *
 * @param username - Optional username to fetch stats for (public profiles)
 * If not provided, fetches stats for the currently logged-in user
 */
export function useUserStats(username?: string): UseUserStatsReturn {
  const [stats, setStats] = useState<UserStats>(EMPTY_USER_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const supabase = createClient();

      // Try the RPC function first
      const rpcParams = username
        ? { p_username: username }
        : { p_user_id: (await supabase.auth.getUser()).data.user?.id };

      if (!rpcParams.p_user_id && !rpcParams.p_username) {
        // No user logged in and no username provided
        setStats(EMPTY_USER_STATS);
        setLoading(false);
        return;
      }

      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'get_user_stats',
        rpcParams
      );

      if (!rpcError && rpcData) {
        setStats({
          cardsViewed: rpcData.cards_viewed ?? 0,
          cardsMastered: rpcData.cards_mastered ?? 0,
          currentStreak: rpcData.current_streak ?? 0,
          longestStreak: rpcData.longest_streak ?? 0,
          lastActiveAt: rpcData.last_active_at ? new Date(rpcData.last_active_at) : null,
        });
        return;
      }

      // Fallback: fetch from profiles table directly
      let query = supabase
        .from('profiles')
        .select('cards_viewed, cards_mastered, current_streak, longest_streak, last_active_at');

      if (username) {
        query = query.eq('username', username);
      } else {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) {
          setStats(EMPTY_USER_STATS);
          return;
        }
        query = query.eq('id', userId);
      }

      const { data: profileData, error: profileError } = await query.single();

      if (profileError) {
        throw profileError;
      }

      setStats({
        cardsViewed: profileData?.cards_viewed ?? 0,
        cardsMastered: profileData?.cards_mastered ?? 0,
        currentStreak: profileData?.current_streak ?? 0,
        longestStreak: profileData?.longest_streak ?? 0,
        lastActiveAt: profileData?.last_active_at
          ? new Date(profileData.last_active_at)
          : null,
      });
    } catch (err) {
      console.error('Failed to fetch user stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
}
