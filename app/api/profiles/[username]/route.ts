import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/profiles/[username] - Get public profile by username
export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // Strip @ prefix if present
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      username,
      display_name,
      avatar_url,
      bio,
      cards_viewed,
      cards_mastered,
      current_streak,
      longest_streak,
      created_at
    `)
    .eq('username', cleanUsername)
    .single();

  if (error || !profile) {
    return NextResponse.json(
      { error: 'Profile not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(profile);
}
