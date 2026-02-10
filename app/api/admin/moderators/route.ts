import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { isAdmin, checkModeratorEligibility } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/moderators
 * List all moderators and eligible candidates
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!isAdmin(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const includeEligible = searchParams.get('includeEligible') === 'true';

    // Get all current moderators
    const { data: moderators, error: modError } = await supabase
      .from('profiles')
      .select(`
        id,
        display_name,
        username,
        avatar_url,
        is_moderator,
        is_admin,
        trust_score,
        total_points
      `)
      .eq('is_moderator', true)
      .order('display_name');

    if (modError) {
      console.error('Error fetching moderators:', modError);
      return NextResponse.json({ error: modError.message }, { status: 500 });
    }

    let eligible: unknown[] = [];

    if (includeEligible) {
      // Get contributors who meet moderator eligibility criteria
      const { data: contributors, error: contribError } = await supabase
        .from('lrc_contributors')
        .select(`
          user_id,
          trust_score,
          total_points,
          songs_synced,
          profile:profiles!inner(
            id,
            display_name,
            username,
            avatar_url,
            is_moderator
          )
        `)
        .gte('trust_score', 0.5)
        .gte('total_points', 500)
        .gte('songs_synced', 10)
        .order('trust_score', { ascending: false });

      if (!contribError && contributors) {
        type ContributorProfile = {
          id: string;
          display_name: string | null;
          username: string | null;
          avatar_url: string | null;
          is_moderator: boolean;
        };

        // Supabase returns joined relations as arrays even with !inner
        // We need to extract the first element
        eligible = contributors
          .filter((c) => {
            const profileArr = c.profile as unknown as ContributorProfile[];
            const profile = profileArr?.[0];
            return profile && !profile.is_moderator;
          })
          .map((c) => {
            const profileArr = c.profile as unknown as ContributorProfile[];
            const profile = profileArr[0];
            const eligibility = checkModeratorEligibility({
              trust_score: c.trust_score || 0,
              total_points: c.total_points || 0,
              songs_synced: c.songs_synced || 0,
            });
            return {
              id: profile.id,
              display_name: profile.display_name,
              username: profile.username,
              avatar_url: profile.avatar_url,
              trust_score: c.trust_score,
              total_points: c.total_points,
              songs_synced: c.songs_synced,
              eligibility,
            };
          });
      }
    }

    return NextResponse.json({
      moderators: moderators || [],
      eligible,
    });
  } catch (error) {
    console.error('Moderators API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/moderators
 * Grant moderator status to a user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!isAdmin(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Grant moderator status
    const { error } = await adminSupabase
      .from('profiles')
      .update({ is_moderator: true })
      .eq('id', userId);

    if (error) {
      console.error('Error granting moderator:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Moderator status granted' });
  } catch (error) {
    console.error('Grant moderator error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/moderators
 * Revoke moderator status from a user
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!isAdmin(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Revoke moderator status
    const { error } = await adminSupabase
      .from('profiles')
      .update({ is_moderator: false })
      .eq('id', userId);

    if (error) {
      console.error('Error revoking moderator:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Moderator status revoked' });
  } catch (error) {
    console.error('Revoke moderator error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
