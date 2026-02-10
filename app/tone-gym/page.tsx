import { createClient } from '@/lib/supabase/server';
import { ToneGymHub } from '@/components/tone-gym';
import type { ToneGymProgress } from '@/lib/tone-gym/types';
import { calculateRecommendedDifficulty } from '@/lib/tone-gym/difficulty';

export const metadata = {
  title: 'Tone Gym | EZViet',
  description: 'Train your ear to distinguish Vietnamese tones through listening exercises',
};

export default async function ToneGymPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user progress if logged in
  let progress: ToneGymProgress | null = null;

  if (user) {
    const { data } = await supabase
      .from('tone_gym_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      progress = data as ToneGymProgress;
    }
  }

  // Calculate recommended difficulty
  const recommendedDifficulty = calculateRecommendedDifficulty(progress);

  return <ToneGymHub progress={progress} recommendedDifficulty={recommendedDifficulty} />;
}
