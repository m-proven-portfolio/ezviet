import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/profiles/me - Get current user's profile
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(profile);
}

// PATCH /api/profiles/me - Update current user's profile
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Only allow updating specific fields
  const allowedFields = ['display_name', 'username', 'bio', 'learning_goal', 'experience_level'];
  const updates: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  // Validate username if being updated
  if (updates.username) {
    const username = updates.username as string;

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Username can only contain lowercase letters and numbers' },
        { status: 400 }
      );
    }

    // Check if username is taken by another user
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      );
    }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(profile);
}
