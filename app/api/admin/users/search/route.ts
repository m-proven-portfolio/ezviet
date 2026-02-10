import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users/search?q=...
 * Search users by name or username for the VIP grant modal
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

    const query = request.nextUrl.searchParams.get('q') || '';

    // Require at least 2 characters for search
    if (query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Search by display_name or username (case-insensitive)
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url, subscription_tier, vip_expires_at, is_admin, is_moderator')
      .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(10);

    if (error) {
      console.error('Error searching users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error('User search API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
