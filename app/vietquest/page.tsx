import { Suspense } from 'react';
import { createAdminClient } from '@/lib/supabase/server';
import { VietQuestHub } from './VietQuestHub';

/**
 * VietQuest Hub Page
 *
 * Server component that fetches worlds and levels,
 * then renders the client-side hub component.
 */
export default async function VietQuestPage() {
  const supabase = createAdminClient();

  // Fetch worlds with their levels
  const { data: worlds, error } = await supabase
    .from('vq_worlds')
    .select(`
      *,
      vq_levels (
        id,
        level_number,
        slug,
        title_vi,
        title_en,
        description,
        status,
        base_dong_reward
      )
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch worlds:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-2">Failed to load worlds</p>
          <p className="text-slate-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  // Transform data to filter only live levels
  const worldsWithLiveLevels = (worlds || []).map((world) => ({
    ...world,
    vq_levels: (world.vq_levels || [])
      .filter((level: { status: string }) => level.status === 'live')
      .sort((a: { level_number: number }, b: { level_number: number }) => a.level_number - b.level_number),
  }));

  return (
    <Suspense fallback={<HubSkeleton />}>
      <VietQuestHub worlds={worldsWithLiveLevels} />
    </Suspense>
  );
}

function HubSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header skeleton */}
        <div className="text-center mb-8">
          <div className="h-10 w-48 bg-slate-700/50 rounded-lg mx-auto mb-2 animate-pulse" />
          <div className="h-4 w-64 bg-slate-700/30 rounded mx-auto animate-pulse" />
        </div>

        {/* World card skeleton */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <div className="h-40 bg-slate-700/30 rounded-xl mb-4 animate-pulse" />
          <div className="h-6 w-32 bg-slate-700/50 rounded mb-2 animate-pulse" />
          <div className="h-4 w-full bg-slate-700/30 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
