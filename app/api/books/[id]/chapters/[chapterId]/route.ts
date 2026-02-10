/**
 * Single Chapter API - Get, Update, Delete
 *
 * GET /api/books/:id/chapters/:chapterId - Get chapter with content
 * PUT /api/books/:id/chapters/:chapterId - Update chapter
 * DELETE /api/books/:id/chapters/:chapterId - Delete chapter
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string; chapterId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: bookId, chapterId } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('book_chapters')
      .select('*')
      .eq('id', chapterId)
      .eq('book_id', bookId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
      }
      console.error('Error fetching chapter:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Chapter API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: bookId, chapterId } = await params;
    const supabase = createAdminClient();
    const body = await request.json();

    // Only allow updating specific fields
    const allowedFields = ['title', 'subtitle', 'objectives', 'content', 'summary', 'number'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // If updating chapter number, need to handle reordering
    if (body.number !== undefined) {
      // Get current chapter
      const { data: currentChapter } = await supabase
        .from('book_chapters')
        .select('number')
        .eq('id', chapterId)
        .single();

      if (currentChapter && currentChapter.number !== body.number) {
        const oldNumber = currentChapter.number;
        const newNumber = body.number;

        // Shift other chapters to make room
        if (newNumber > oldNumber) {
          // Moving down: decrement chapters between old and new position
          await supabase.rpc('shift_chapter_numbers', {
            p_book_id: bookId,
            p_start: oldNumber + 1,
            p_end: newNumber,
            p_direction: -1,
          });
        } else {
          // Moving up: increment chapters between new and old position
          await supabase.rpc('shift_chapter_numbers', {
            p_book_id: bookId,
            p_start: newNumber,
            p_end: oldNumber - 1,
            p_direction: 1,
          });
        }
      }
    }

    const { data, error } = await supabase
      .from('book_chapters')
      .update(updates)
      .eq('id', chapterId)
      .eq('book_id', bookId)
      .select()
      .single();

    if (error) {
      console.error('Error updating chapter:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Chapter API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: bookId, chapterId } = await params;
    const supabase = createAdminClient();

    // Get chapter number before deleting
    const { data: chapter } = await supabase
      .from('book_chapters')
      .select('number')
      .eq('id', chapterId)
      .eq('book_id', bookId)
      .single();

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Delete the chapter
    const { error } = await supabase
      .from('book_chapters')
      .delete()
      .eq('id', chapterId)
      .eq('book_id', bookId);

    if (error) {
      console.error('Error deleting chapter:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Renumber remaining chapters
    await supabase
      .from('book_chapters')
      .update({ number: supabase.rpc('decrement_chapter_number') })
      .eq('book_id', bookId)
      .gt('number', chapter.number);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chapter API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
