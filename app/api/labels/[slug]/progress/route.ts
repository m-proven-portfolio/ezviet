import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import type { SubmitQuizRequest, SubmitQuizResponse } from '@/lib/labels/types';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/labels/[slug]/progress
 * Get the current user's progress for this label set
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

    // Get the label set ID from slug
    const { data: labelSet } = await supabase
      .from('label_sets')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!labelSet) {
      return NextResponse.json({ error: 'Label set not found' }, { status: 404 });
    }

    // Get user's progress
    const { data: progress, error } = await supabase
      .from('label_set_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('label_set_id', labelSet.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found, which is okay (no progress yet)
      console.error('Error fetching progress:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return progress or null if none exists
    return NextResponse.json(progress || null);
  } catch (error) {
    console.error('Progress GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

/**
 * POST /api/labels/[slug]/progress
 * Submit quiz results and update progress
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Get the label set ID from slug
    const { data: labelSet } = await supabase
      .from('label_sets')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!labelSet) {
      return NextResponse.json({ error: 'Label set not found' }, { status: 404 });
    }

    // Parse request body
    const body: SubmitQuizRequest = await request.json();

    // Validate required fields
    if (
      typeof body.correct !== 'number' ||
      typeof body.total !== 'number' ||
      typeof body.time_seconds !== 'number'
    ) {
      return NextResponse.json(
        { error: 'correct, total, and time_seconds are required' },
        { status: 400 }
      );
    }

    // Validate values
    if (body.correct < 0 || body.total <= 0 || body.correct > body.total) {
      return NextResponse.json({ error: 'Invalid score values' }, { status: 400 });
    }

    if (body.time_seconds < 0) {
      return NextResponse.json({ error: 'Invalid time value' }, { status: 400 });
    }

    // Call the RPC function to record the attempt
    const { data: result, error } = await supabase.rpc('record_label_quiz_attempt', {
      p_user_id: user.id,
      p_label_set_id: labelSet.id,
      p_correct: body.correct,
      p_total: body.total,
      p_time_seconds: body.time_seconds,
    });

    if (error) {
      console.error('Error recording quiz attempt:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If individual answers are provided, record them for spaced repetition
    if (body.answers && Array.isArray(body.answers) && body.answers.length > 0) {
      const { error: answersError } = await supabase.rpc('record_label_answers', {
        p_user_id: user.id,
        p_label_set_id: labelSet.id,
        p_answers: body.answers.map((a) => ({
          labelId: a.labelId,
          isCorrect: a.isCorrect,
          matchType: a.matchType,
          score: a.score,
          timeSpent: a.timeSpent,
          hintsUsed: a.hintsUsed,
        })),
      });

      if (answersError) {
        // Log but don't fail the request - aggregate progress was already saved
        console.error('Error recording individual answers:', answersError);
      }
    }

    // Return the response with quiz stats
    const response: SubmitQuizResponse = {
      score: result.score,
      best_score: result.best_score,
      best_time: result.best_time,
      is_new_best: result.is_new_best,
      attempts: result.attempts,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Progress POST error:', error);
    return NextResponse.json({ error: 'Failed to submit progress' }, { status: 500 });
  }
}

/**
 * PATCH /api/labels/[slug]/progress
 * Update exploration progress (labels explored count)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Get the label set ID from slug
    const { data: labelSet } = await supabase
      .from('label_sets')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!labelSet) {
      return NextResponse.json({ error: 'Label set not found' }, { status: 404 });
    }

    // Parse request body
    const body: { labels_explored: number } = await request.json();

    if (typeof body.labels_explored !== 'number' || body.labels_explored < 0) {
      return NextResponse.json({ error: 'Invalid labels_explored value' }, { status: 400 });
    }

    // Call the RPC function to update exploration progress
    const { error } = await supabase.rpc('update_label_exploration', {
      p_user_id: user.id,
      p_label_set_id: labelSet.id,
      p_labels_explored: body.labels_explored,
    });

    if (error) {
      console.error('Error updating exploration:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Progress PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update exploration' }, { status: 500 });
  }
}
