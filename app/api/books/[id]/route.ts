/**
 * Single Book API - Get, Update, Delete
 *
 * GET /api/books/:id - Get book with chapters
 * PUT /api/books/:id - Update book metadata
 * DELETE /api/books/:id - Delete book
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('books')
      .select(`
        *,
        book_chapters(
          id,
          number,
          title,
          subtitle,
          objectives,
          content,
          summary,
          created_at,
          updated_at
        ),
        book_series(
          id,
          slug,
          title
        )
      `)
      .eq('id', id)
      .order('number', { referencedTable: 'book_chapters', ascending: true })
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Book not found' }, { status: 404 });
      }
      console.error('Error fetching book:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Book API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    const body = await request.json();

    // Only allow updating specific fields
    const allowedFields = [
      'title', 'subtitle', 'author', 'description',
      'base_lang', 'target_lang', 'target_region', 'level',
      'series_id', 'series_order',
      'trim_size', 'template_id',
      'status', 'isbn', 'version',
      'cover_image_path',
      'front_matter', 'back_matter',
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Handle camelCase to snake_case conversion
    if (body.baseLang) updates.base_lang = body.baseLang;
    if (body.targetLang) updates.target_lang = body.targetLang;
    if (body.targetRegion) updates.target_region = body.targetRegion;
    if (body.trimSize) updates.trim_size = body.trimSize;
    if (body.templateId) updates.template_id = body.templateId;
    if (body.seriesId) updates.series_id = body.seriesId;
    if (body.seriesOrder) updates.series_order = body.seriesOrder;
    if (body.coverImagePath) updates.cover_image_path = body.coverImagePath;
    if (body.frontMatter) updates.front_matter = body.frontMatter;
    if (body.backMatter) updates.back_matter = body.backMatter;

    // Set published_at if publishing
    if (body.status === 'published') {
      const { data: currentBook } = await supabase
        .from('books')
        .select('published_at')
        .eq('id', id)
        .single();

      if (!currentBook?.published_at) {
        updates.published_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating book:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Book API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting book:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Book API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
