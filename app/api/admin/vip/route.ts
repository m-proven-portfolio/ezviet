import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/permissions';
import { calculateVipExpiration } from '@/lib/tiers';

export const dynamic = 'force-dynamic';

// Duration presets in days
const DURATION_PRESETS = {
  '1w': 7,
  '1m': 30,
  '3m': 90,
  '1y': 365,
} as const;

type DurationKey = keyof typeof DURATION_PRESETS;

/**
 * GET /api/admin/vip
 * List all VIP users (active and recently expired)
 */
export async function GET() {
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

    // Fetch all users with VIP status (active or expired)
    const { data: vipUsers, error } = await supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url, subscription_tier, vip_expires_at, is_admin, is_moderator')
      .not('subscription_tier', 'is', null)
      .order('vip_expires_at', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Error fetching VIP users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Separate active vs expired
    const now = new Date();
    const active = vipUsers?.filter(u =>
      !u.vip_expires_at || new Date(u.vip_expires_at) > now
    ) || [];
    const expired = vipUsers?.filter(u =>
      u.vip_expires_at && new Date(u.vip_expires_at) <= now
    ) || [];

    return NextResponse.json({ active, expired });
  } catch (error) {
    console.error('VIP API GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/vip
 * Grant or extend VIP time for a user
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
    const { userId, tier, duration } = body as {
      userId: string;
      tier: 'plus' | 'pro';
      duration: DurationKey;
    };

    // Validate required fields
    if (!userId || !tier || !duration) {
      return NextResponse.json(
        { error: 'userId, tier, and duration are required' },
        { status: 400 }
      );
    }

    // Validate tier value
    if (!['plus', 'pro'].includes(tier)) {
      return NextResponse.json(
        { error: 'tier must be "plus" or "pro"' },
        { status: 400 }
      );
    }

    // Validate duration value
    const durationDays = DURATION_PRESETS[duration];
    if (!durationDays) {
      return NextResponse.json(
        { error: 'Invalid duration. Use: 1w, 1m, 3m, or 1y' },
        { status: 400 }
      );
    }

    // Get user's current VIP status to calculate extension
    const { data: targetUser } = await adminSupabase
      .from('profiles')
      .select('subscription_tier, vip_expires_at, display_name')
      .eq('id', userId)
      .single();

    const newExpiration = calculateVipExpiration(
      targetUser?.vip_expires_at,
      durationDays
    );

    // Update user's VIP status
    const { error } = await adminSupabase
      .from('profiles')
      .update({
        subscription_tier: tier,
        vip_expires_at: newExpiration.toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error granting VIP:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Granted ${tier.toUpperCase()} until ${newExpiration.toLocaleDateString()}`,
      expiresAt: newExpiration.toISOString(),
    });
  } catch (error) {
    console.error('VIP API POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/vip
 * Revoke VIP status from a user
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

    // Clear VIP status
    const { error } = await adminSupabase
      .from('profiles')
      .update({
        subscription_tier: null,
        vip_expires_at: null,
      })
      .eq('id', userId);

    if (error) {
      console.error('Error revoking VIP:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'VIP status revoked' });
  } catch (error) {
    console.error('VIP API DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
