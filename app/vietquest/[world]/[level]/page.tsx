import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { GamePlayer } from './GamePlayer';

interface PageProps {
  params: Promise<{
    world: string;
    level: string;
  }>;
}

/**
 * VietQuest Game Player Page
 *
 * Server component that fetches the level data,
 * then renders the client-side game player.
 */
export default async function VietQuestGamePage({ params }: PageProps) {
  const { world: worldSlug, level: levelSlug } = await params;

  const supabase = createAdminClient();

  // Fetch the world
  const { data: world, error: worldError } = await supabase
    .from('vq_worlds')
    .select('id, slug, name_vi, name_en')
    .eq('slug', worldSlug)
    .eq('is_active', true)
    .single();

  if (worldError || !world) {
    notFound();
  }

  // Fetch the level
  const { data: level, error: levelError } = await supabase
    .from('vq_levels')
    .select('*')
    .eq('world_id', world.id)
    .eq('slug', levelSlug)
    .eq('status', 'live')
    .single();

  if (levelError || !level) {
    notFound();
  }

  return <GamePlayer level={level} worldName={world.name_vi} />;
}

// Generate metadata for the page
export async function generateMetadata({ params }: PageProps) {
  const { world: worldSlug, level: levelSlug } = await params;

  const supabase = createAdminClient();

  const { data: world } = await supabase
    .from('vq_worlds')
    .select('id, name_vi')
    .eq('slug', worldSlug)
    .single();

  if (!world) {
    return { title: 'Level Not Found - VietQuest' };
  }

  const { data: level } = await supabase
    .from('vq_levels')
    .select('title_vi, title_en')
    .eq('world_id', world.id)
    .eq('slug', levelSlug)
    .single();

  if (!level) {
    return { title: 'Level Not Found - VietQuest' };
  }

  return {
    title: `${level.title_vi} - ${world.name_vi} | VietQuest`,
    description: level.title_en,
  };
}
