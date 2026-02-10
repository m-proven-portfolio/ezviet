'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface LearnPageTrackerProps {
  cardId: string;
  cardSlug: string;
}

// Custom event for stats updates
export const STATS_UPDATED_EVENT = 'ezviet:stats-updated';

export interface StatsUpdatedDetail {
  cardsViewed: number;
  cardsMastered: number;
  currentStreak: number;
  longestStreak: number;
  timesViewed: number;
  masteryLevel: number;
}

export function LearnPageTracker({ cardId, cardSlug }: LearnPageTrackerProps) {
  // Track which card we've already counted to prevent double-counting
  // on re-renders, but allow counting when navigating to a new card
  const trackedSlug = useRef<string | null>(null);

  useEffect(() => {
    // Skip if we already tracked this specific card
    if (trackedSlug.current === cardSlug) return;
    trackedSlug.current = cardSlug;

    async function trackView() {
      const supabase = createClient();

      // Always increment global view count (for all visitors)
      await supabase.rpc('increment_view_count', { card_slug: cardSlug });

      // For logged-in users, also record personal learning history
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Call the RPC function to record the view
      // The enhanced function returns updated stats
      const { data, error } = await supabase.rpc('record_card_view', {
        p_user_id: user.id,
        p_card_id: cardId,
      });

      // Emit event with updated stats for real-time UI updates
      if (!error && data) {
        const detail: StatsUpdatedDetail = {
          cardsViewed: data.cards_viewed ?? 0,
          cardsMastered: data.cards_mastered ?? 0,
          currentStreak: data.current_streak ?? 0,
          longestStreak: data.longest_streak ?? 0,
          timesViewed: data.times_viewed ?? 0,
          masteryLevel: data.mastery_level ?? 0,
        };
        window.dispatchEvent(new CustomEvent(STATS_UPDATED_EVENT, { detail }));
      }
    }

    trackView();
  }, [cardId, cardSlug]);

  // This component renders nothing
  return null;
}
