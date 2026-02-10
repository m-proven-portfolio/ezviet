'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { type AdminStats, EMPTY_ADMIN_STATS } from '@/lib/stats';

interface UseAdminStatsReturn {
  stats: AdminStats;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch admin dashboard stats
 * Uses the get_admin_stats() RPC function for a single optimized query
 */
export function useAdminStats(): UseAdminStatsReturn {
  const [stats, setStats] = useState<AdminStats>(EMPTY_ADMIN_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const supabase = createClient();

      // Try the RPC function first (more efficient)
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_admin_stats');

      if (!rpcError && rpcData) {
        setStats({
          totalCards: rpcData.total_cards ?? 0,
          totalCategories: rpcData.total_categories ?? 0,
          totalViews: rpcData.total_views ?? 0,
          totalUsers: rpcData.total_users ?? 0,
        });
        return;
      }

      // Fallback: fetch from tables directly
      const [cardsRes, profilesRes] = await Promise.all([
        supabase.from('cards').select('id, category_id, view_count'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);

      const cards = cardsRes.data ?? [];
      const totalViews = cards.reduce((sum, c) => sum + (c.view_count || 0), 0);
      const categories = new Set(cards.map(c => c.category_id).filter(Boolean));

      setStats({
        totalCards: cards.length,
        totalCategories: categories.size,
        totalViews,
        totalUsers: profilesRes.count ?? 0,
      });
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
}
