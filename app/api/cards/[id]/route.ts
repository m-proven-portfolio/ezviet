import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Fetch a single card by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: card, error } = await supabase
      .from('cards')
      .select(`
        *,
        category:categories(*),
        terms:card_terms(*)
      `)
      .eq('id', id)
      .single();

    if (error || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch card' }, { status: 500 });
  }
}

// PUT: Update a card
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    const body = await request.json();

    const {
      slug,
      category_id,
      image_path,
      difficulty,
      meta_description,
      terms,
    } = body;

    // Update card with meta_description
    const { error: cardError } = await supabase
      .from('cards')
      .update({
        slug,
        category_id,
        image_path,
        difficulty,
        meta_description: meta_description || null,
      })
      .eq('id', id);

    if (cardError) {
      console.error('Card update error:', cardError);
      return NextResponse.json({ error: cardError.message }, { status: 500 });
    }

    // Delete existing terms and insert new ones
    await supabase.from('card_terms').delete().eq('card_id', id);

    if (terms && terms.length > 0) {
      const termsWithCardId = terms.map((term: any) => ({
        ...term,
        card_id: id,
      }));

      const { error: termsError } = await supabase
        .from('card_terms')
        .insert(termsWithCardId);

      if (termsError) {
        console.error('Terms update error:', termsError);
        return NextResponse.json({ error: termsError.message }, { status: 500 });
      }
    }

    // Fetch updated card
    const { data: updatedCard } = await supabase
      .from('cards')
      .select(`
        *,
        category:categories(*),
        terms:card_terms(*)
      `)
      .eq('id', id)
      .single();

    return NextResponse.json(updatedCard);
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Failed to update card' }, { status: 500 });
  }
}

// DELETE: Delete a card
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Terms will be cascade deleted due to foreign key constraint
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete card' }, { status: 500 });
  }
}
