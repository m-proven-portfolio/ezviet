import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/profiles/check-username?username=xxx - Check if username is available
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json(
      { error: 'Username is required' },
      { status: 400 }
    );
  }

  if (username.length < 3) {
    return NextResponse.json({
      available: false,
      error: 'Username must be at least 3 characters',
    });
  }

  if (!/^[a-z0-9]+$/.test(username)) {
    return NextResponse.json({
      available: false,
      error: 'Username can only contain lowercase letters and numbers',
    });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if taken by another user (exclude current user)
  let query = supabase
    .from('profiles')
    .select('id')
    .eq('username', username);

  if (user) {
    query = query.neq('id', user.id);
  }

  const { data: existing } = await query.single();

  return NextResponse.json({
    available: !existing,
    error: existing ? 'Username already taken' : null,
  });
}
