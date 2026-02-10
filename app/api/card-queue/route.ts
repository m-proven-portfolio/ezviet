import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('card_queue')
      .select('*, category:categories(*)')
      .order('status', { ascending: true }) // pending first
      .order('created_at', { ascending: true });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: queueItems, error } = await query;

    if (error) {
      // If table doesn't exist or any error occurs, return empty array
      // This prevents the admin page from breaking if the migration hasn't been run
      const errorMsg = String(error.message || JSON.stringify(error) || '').toLowerCase();
      
      // Log warning for table not found, but return empty array for all errors
      if (
        errorMsg.includes('could not find the table') ||
        (errorMsg.includes('relation') && errorMsg.includes('does not exist')) ||
        errorMsg.includes('card_queue')
      ) {
        console.warn('card_queue table does not exist yet. Run migration 017_card_queue.sql');
      } else {
        console.error('Fetch card queue error:', error);
      }
      
      // Always return empty array instead of error to prevent admin page breakage
      return NextResponse.json([]);
    }

    return NextResponse.json(queueItems || []);
  } catch (error) {
    console.error('Fetch card queue error:', error);
    // Return empty array instead of error to prevent admin page from breaking
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const { category_id, vietnamese, english, notes } = body;

    if (!category_id) {
      return NextResponse.json({ error: 'category_id is required' }, { status: 400 });
    }

    if (!vietnamese || !english) {
      return NextResponse.json({ error: 'vietnamese and english are required' }, { status: 400 });
    }

    const { data: queueItem, error } = await supabase
      .from('card_queue')
      .insert({
        category_id,
        vietnamese: vietnamese.trim(),
        english: english.trim(),
        notes: notes?.trim() || null,
      })
      .select('*, category:categories(*)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(queueItem, { status: 201 });
  } catch (error) {
    console.error('Create queue item error:', error);
    return NextResponse.json({ error: 'Failed to create queue item' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const { id, vietnamese, english, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    if (!vietnamese || !english) {
      return NextResponse.json({ error: 'vietnamese and english are required' }, { status: 400 });
    }

    const { data: queueItem, error } = await supabase
      .from('card_queue')
      .update({
        vietnamese: vietnamese.trim(),
        english: english.trim(),
        notes: notes?.trim() || null,
      })
      .eq('id', id)
      .select('*, category:categories(*)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(queueItem);
  } catch (error) {
    console.error('Update queue item error:', error);
    return NextResponse.json({ error: 'Failed to update queue item' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('card_queue')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete queue item error:', error);
    return NextResponse.json({ error: 'Failed to delete queue item' }, { status: 500 });
  }
}
