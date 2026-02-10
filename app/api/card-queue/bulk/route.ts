import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface ParsedItem {
  vietnamese: string;
  english: string;
  notes: string | null;
}

function parseTextInput(text: string): ParsedItem[] {
  const lines = text.split('\n').filter((line) => line.trim());
  const items: ParsedItem[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Support formats:
    // "Vietnamese - English"
    // "Vietnamese - English - Notes"
    // "Vietnamese, English"
    // "Vietnamese, English, Notes"
    // "English" (single word - Vietnamese to be filled later)
    if (trimmed.includes(' - ') || trimmed.includes(',')) {
      const parts = trimmed.includes(' - ')
        ? trimmed.split(' - ').map((p) => p.trim())
        : trimmed.split(',').map((p) => p.trim());

      if (parts.length >= 2 && parts[0] && parts[1]) {
        items.push({
          vietnamese: parts[0],
          english: parts[1],
          notes: parts[2] || null,
        });
      }
    } else if (trimmed) {
      // Single word - treat as English, Vietnamese to be filled when creating card
      items.push({
        vietnamese: '',
        english: trimmed,
        notes: null,
      });
    }
  }

  return items;
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const { category_id, text } = body;

    if (!category_id) {
      return NextResponse.json({ error: 'category_id is required' }, { status: 400 });
    }

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    // Parse the text input
    const items = parseTextInput(text);

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'No valid items found. Use format: Vietnamese - English (one per line)' },
        { status: 400 }
      );
    }

    // Check for duplicates in this category's queue
    const { data: existingItems } = await supabase
      .from('card_queue')
      .select('vietnamese, english')
      .eq('category_id', category_id);

    const existingVietnamese = new Set(
      (existingItems ?? [])
        .filter((item) => item.vietnamese)
        .map((item) => item.vietnamese.toLowerCase())
    );
    const existingEnglish = new Set(
      (existingItems ?? []).map((item) => item.english.toLowerCase())
    );

    // Filter out duplicates - check Vietnamese if present, otherwise check English
    const newItems = items.filter((item) => {
      if (item.vietnamese) {
        return !existingVietnamese.has(item.vietnamese.toLowerCase());
      }
      return !existingEnglish.has(item.english.toLowerCase());
    });
    const skippedCount = items.length - newItems.length;

    if (newItems.length === 0) {
      return NextResponse.json(
        { error: 'All items already exist in the queue', skipped: skippedCount },
        { status: 400 }
      );
    }

    // Insert new items
    const { data: insertedItems, error } = await supabase
      .from('card_queue')
      .insert(
        newItems.map((item) => ({
          category_id,
          vietnamese: item.vietnamese,
          english: item.english,
          notes: item.notes,
        }))
      )
      .select('*, category:categories(*)');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        items: insertedItems,
        inserted: insertedItems?.length ?? 0,
        skipped: skippedCount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ error: 'Failed to import items' }, { status: 500 });
  }
}
