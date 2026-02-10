import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import type { ReviewSchedule, LabelWithReview } from '@/lib/labels/types';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/labels/[slug]/reviews
 * Get the review schedule for a label set (labels due for spaced repetition review)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    // Check authentication
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get the label set with its labels
    const { data: labelSet, error: labelSetError } = await supabase
      .from('label_sets')
      .select(
        `
        id,
        labels:labels(
          id, vietnamese, english, pronunciation, audio_url, x, y,
          accent, tts_hint, romanization, sort_order
        )
      `
      )
      .eq('slug', slug)
      .single();

    if (labelSetError || !labelSet) {
      return NextResponse.json({ error: 'Label set not found' }, { status: 404 });
    }

    // Get user's learning history for this label set
    const { data: history, error: historyError } = await supabase
      .from('label_learning_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('label_set_id', labelSet.id);

    if (historyError) {
      console.error('Error fetching learning history:', historyError);
      return NextResponse.json({ error: historyError.message }, { status: 500 });
    }

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Create a map of label_id -> history for quick lookup
    const historyMap = new Map(
      (history || []).map((h) => [h.label_id, h])
    );

    // Categorize labels
    const dueLabels: LabelWithReview[] = [];
    const upcomingLabels: LabelWithReview[] = [];
    let masteredCount = 0;
    let learningCount = 0;

    for (const label of labelSet.labels || []) {
      const h = historyMap.get(label.id);

      if (!h) {
        // Never seen - not tracked yet
        continue;
      }

      // Attach learning history to label
      const labelWithReview: LabelWithReview = {
        ...label,
        label_set_id: labelSet.id,
        card_id: null,
        hints: null,
        created_at: '',
        learning: h,
      };

      // Check mastery (streak >= 5)
      if (h.streak >= 5) {
        masteredCount++;
      } else {
        learningCount++;
      }

      // Check if due for review
      if (h.next_review_at) {
        const reviewAt = new Date(h.next_review_at);

        if (reviewAt <= now) {
          dueLabels.push(labelWithReview);
        } else if (reviewAt <= tomorrow) {
          upcomingLabels.push(labelWithReview);
        }
      }
    }

    // Sort due labels by urgency (oldest first)
    dueLabels.sort((a, b) => {
      const aTime = a.learning?.next_review_at
        ? new Date(a.learning.next_review_at).getTime()
        : 0;
      const bTime = b.learning?.next_review_at
        ? new Date(b.learning.next_review_at).getTime()
        : 0;
      return aTime - bTime;
    });

    const response: ReviewSchedule = {
      due_count: dueLabels.length,
      upcoming_count: upcomingLabels.length,
      mastered_count: masteredCount,
      learning_count: learningCount,
      labels_due: dueLabels,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Reviews GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review schedule' },
      { status: 500 }
    );
  }
}
