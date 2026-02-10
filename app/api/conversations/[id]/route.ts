import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/permissions';

// GET: Fetch a single conversation by ID (public)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: conversation, error } = await supabase
      .from('conversation_cards')
      .select(
        `
        *,
        category:categories(id, name, icon, slug),
        lines:conversation_lines(*)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Conversation fetch error:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sort lines by sort_order
    if (conversation?.lines) {
      conversation.lines.sort(
        (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
      );
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}

// PATCH: Update a conversation (admin only)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission with proper error handling
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: 'Failed to verify permissions' }, { status: 500 });
    }

    if (!isAdmin(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const adminSupabase = createAdminClient();
    const body = await request.json();

    const {
      title,
      title_vi,
      scene_image_path,
      category_id,
      difficulty,
      meta_description,
      is_published,
      lines,
    } = body;

    // Update conversation card
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (title_vi !== undefined) updateData.title_vi = title_vi;
    if (scene_image_path !== undefined) updateData.scene_image_path = scene_image_path;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (meta_description !== undefined) updateData.meta_description = meta_description;
    if (is_published !== undefined) updateData.is_published = is_published;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await adminSupabase
        .from('conversation_cards')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        console.error('Conversation update error:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    // Update lines if provided - collect all errors
    const lineErrors: Array<{ lineId: string; error: string }> = [];
    if (lines && Array.isArray(lines)) {
      for (const line of lines) {
        if (line.id) {
          const { error: lineError } = await adminSupabase
            .from('conversation_lines')
            .update({
              speaker: line.speaker,
              speaker_vi: line.speaker_vi,
              vietnamese: line.vietnamese,
              english: line.english,
              romanization: line.romanization,
            })
            .eq('id', line.id);

          if (lineError) {
            console.error('Line update error:', lineError);
            lineErrors.push({ lineId: line.id, error: lineError.message });
          }
        }
      }
    }

    // If any line updates failed, return error
    if (lineErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Some line updates failed',
          lineErrors,
        },
        { status: 500 }
      );
    }

    // Fetch updated conversation
    const { data: conversation, error: fetchError } = await adminSupabase
      .from('conversation_cards')
      .select(
        `
        *,
        category:categories(id, name, icon, slug),
        lines:conversation_lines(*)
      `
      )
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Sort lines by sort_order
    if (conversation?.lines) {
      conversation.lines.sort(
        (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
      );
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
  }
}

// DELETE: Delete a conversation (admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission with proper error handling
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: 'Failed to verify permissions' }, { status: 500 });
    }

    if (!isAdmin(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const adminSupabase = createAdminClient();

    // Delete lines first (foreign key constraint)
    await adminSupabase.from('conversation_lines').delete().eq('conversation_card_id', id);

    // Delete conversation
    const { error } = await adminSupabase.from('conversation_cards').delete().eq('id', id);

    if (error) {
      console.error('Conversation delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}
