/**
 * Book Chapters API - List and Create
 *
 * GET /api/books/:id/chapters - List chapters for a book
 * POST /api/books/:id/chapters - Create a new chapter
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('book_chapters')
      .select('*')
      .eq('book_id', bookId)
      .order('number', { ascending: true });

    if (error) {
      console.error('Error fetching chapters:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Chapters API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params;
    const supabase = createAdminClient();
    const body = await request.json();

    const { title, subtitle, objectives = [] } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Get the next chapter number
    const { data: existingChapters } = await supabase
      .from('book_chapters')
      .select('number')
      .eq('book_id', bookId)
      .order('number', { ascending: false })
      .limit(1);

    const nextNumber = (existingChapters?.[0]?.number || 0) + 1;

    // Create chapter with empty content
    const { data, error } = await supabase
      .from('book_chapters')
      .insert({
        book_id: bookId,
        number: nextNumber,
        title,
        subtitle,
        objectives,
        content: [{ id: `sec-${Date.now()}`, blocks: [] }], // Start with one empty section
        summary: [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating chapter:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Chapters API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
