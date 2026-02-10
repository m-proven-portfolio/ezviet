import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Generate audio for a Vietnamese term using Google Cloud TTS
 * Returns the storage path or null if generation fails
 */
async function generateAudioForTerm(
  text: string,
  slug: string,
  region: string | null,
  supabase: ReturnType<typeof createAdminClient>
): Promise<string | null> {
  try {
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
    if (!apiKey) {
      console.warn('GOOGLE_CLOUD_API_KEY not configured, skipping audio generation');
      return null;
    }

    // Call Google Cloud TTS API
    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'vi-VN',
            name: 'vi-VN-Wavenet-A', // Female, high quality neural voice
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.9, // Slightly slower for learning
            pitch: 0,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorData = await ttsResponse.json();
      console.error('Google TTS error:', errorData);
      return null;
    }

    const ttsData = await ttsResponse.json();
    const audioBuffer = Buffer.from(ttsData.audioContent, 'base64');

    // Generate filename: slug-region-random.mp3
    const regionSuffix = region ? `-${region}` : '';
    const random = Math.random().toString(36).substring(7);
    const filename = `${slug}${regionSuffix}-${random}.mp3`;

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cards-audio')
      .upload(filename, audioBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: '31536000', // Cache for 1 year
        upsert: false,
      });

    if (uploadError) {
      console.error('Audio upload error:', uploadError);
      return null;
    }

    console.log(`Generated audio for "${text}" -> ${uploadData.path}`);
    return uploadData.path;
  } catch (error) {
    console.error('Audio generation error:', error);
    return null;
  }
}

// GET: Fetch cards with pagination (for admin dashboard)
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    // Pagination params
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    // Optional: fetch all (legacy mode, use with caution)
    const fetchAll = searchParams.get('all') === 'true';

    if (fetchAll) {
      // Legacy mode: fetch all cards but with a lean query
      const { data: cards, error } = await supabase
        .from('cards')
        .select(`
          id,
          slug,
          category_id,
          image_path,
          difficulty,
          created_at,
          category:categories(id, name, icon, slug),
          terms:card_terms(id, lang, region, text, romanization),
          songs:card_songs(id)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Cards fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(cards);
    }

    // Paginated mode (default)
    const { data: cards, error, count } = await supabase
      .from('cards')
      .select(
        `
        id,
        slug,
        category_id,
        image_path,
        difficulty,
        created_at,
        category:categories(id, name, icon, slug),
        terms:card_terms(id, lang, region, text, romanization),
        songs:card_songs(id)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Cards fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      cards,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}

// POST: Create a new card with terms
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const {
      slug,
      category_id,
      image_path,
      difficulty = 1,
      meta_description,
      // Display option
      show_north = false,
      terms, // Array of { lang, region, text, romanization, phonetic_helper, ipa, audio_path, generated_by_ai, reviewed_by_admin, prompt_version }
    } = body;

    // Validate required fields
    if (!slug || !image_path || !terms || terms.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, image_path, terms' },
        { status: 400 }
      );
    }

    // Insert card with meta_description and display option
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .insert({
        slug,
        category_id,
        image_path,
        difficulty,
        meta_description: meta_description || null,
        show_north,
      })
      .select()
      .single();

    if (cardError) {
      console.error('Card insert error:', cardError);
      return NextResponse.json({ error: cardError.message }, { status: 500 });
    }

    // Generate audio for Vietnamese terms (in parallel)
    const termsWithAudio = await Promise.all(
      terms.map(async (term: any) => {
        // Only generate audio for Vietnamese terms that don't already have audio
        if (term.lang === 'vi' && term.text && !term.audio_path) {
          const audioPath = await generateAudioForTerm(
            term.text,
            slug,
            term.region,
            supabase
          );
          return {
            ...term,
            card_id: card.id,
            audio_path: audioPath,
            audio_source: audioPath ? 'auto' : null, // Mark as TTS-generated
          };
        }
        // If audio was provided by admin, preserve the audio_source
        return {
          ...term,
          card_id: card.id,
          audio_source: term.audio_path ? (term.audio_source || 'admin') : null,
        };
      })
    );

    const { error: termsError } = await supabase
      .from('card_terms')
      .insert(termsWithAudio);

    if (termsError) {
      // Rollback: delete the card if terms failed
      await supabase.from('cards').delete().eq('id', card.id);
      console.error('Terms insert error:', termsError);
      return NextResponse.json({ error: termsError.message }, { status: 500 });
    }

    // Auto-match queue items: find pending queue items with matching Vietnamese or English text
    if (category_id) {
      const vietnameseTerms = terms
        .filter((t: { lang: string; text: string }) => t.lang === 'vi' && t.text)
        .map((t: { text: string }) => t.text.trim().toLowerCase());

      const englishTerms = terms
        .filter((t: { lang: string; text: string }) => t.lang === 'en' && t.text)
        .map((t: { text: string }) => t.text.trim().toLowerCase());

      if (vietnameseTerms.length > 0 || englishTerms.length > 0) {
        // Find matching queue items (case-insensitive)
        const { data: matchingQueueItems } = await supabase
          .from('card_queue')
          .select('id, vietnamese, english')
          .eq('category_id', category_id)
          .eq('status', 'pending');

        const matchedIds = (matchingQueueItems ?? [])
          .filter((item) => {
            // If queue item has Vietnamese, match by Vietnamese
            if (item.vietnamese) {
              return vietnameseTerms.includes(item.vietnamese.toLowerCase());
            }
            // If queue item only has English (no Vietnamese), match by English
            return englishTerms.includes(item.english.toLowerCase());
          })
          .map((item) => item.id);

        if (matchedIds.length > 0) {
          await supabase
            .from('card_queue')
            .update({
              status: 'completed',
              card_id: card.id,
              completed_at: new Date().toISOString(),
            })
            .in('id', matchedIds);

          console.log(`Auto-matched ${matchedIds.length} queue item(s) for card ${slug}`);
        }
      }
    }

    // Fetch complete card with terms
    const { data: completeCard } = await supabase
      .from('cards')
      .select(`
        *,
        category:categories(*),
        terms:card_terms(*)
      `)
      .eq('id', card.id)
      .single();

    return NextResponse.json(completeCard, { status: 201 });
  } catch (error) {
    console.error('Create error:', error);
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 });
  }
}
