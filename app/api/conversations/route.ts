import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';

/**
 * Generate TTS audio for a Vietnamese text using Google Cloud TTS
 * Returns the storage path or null if generation fails
 */
async function generateAudioForLine(
  text: string,
  conversationSlug: string,
  lineIndex: number,
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

    // Generate filename: conversation-slug-lineIndex-random.mp3
    const random = Math.random().toString(36).substring(7);
    const filename = `conv/${conversationSlug}-${lineIndex}-${random}.mp3`;

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cards-audio')
      .upload(filename, audioBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      console.error('Audio upload error:', uploadError);
      return null;
    }

    console.log(`Generated audio for line ${lineIndex} -> ${uploadData.path}`);
    return uploadData.path;
  } catch (error) {
    console.error('Audio generation error:', error);
    return null;
  }
}

// GET: Fetch conversation cards
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;
    const categoryId = searchParams.get('category_id');
    const published = searchParams.get('published');

    let query = supabase
      .from('conversation_cards')
      .select(`
        *,
        category:categories(id, name, icon, slug),
        lines:conversation_lines(*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Filter by category if specified
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    // Filter by published status if specified
    if (published === 'true') {
      query = query.eq('is_published', true);
    } else if (published === 'false') {
      query = query.eq('is_published', false);
    }

    const { data: conversations, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('Conversations fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sort lines by sort_order
    const sortedConversations = conversations?.map(conv => ({
      ...conv,
      lines: conv.lines?.sort((a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
      ) || [],
    }));

    return NextResponse.json({
      conversations: sortedConversations,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// POST: Create a new conversation card
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const {
      title,
      title_vi,
      scene_image_path,
      category_id,
      difficulty = 1,
      meta_description,
      generated_by_ai = false,
      prompt_used,
      prompt_version,
      is_published = true,
      lines, // Array of { speaker, speaker_vi, vietnamese, english, romanization }
    } = body;

    // Validate required fields
    if (!title || !scene_image_path || !lines || lines.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: title, scene_image_path, lines' },
        { status: 400 }
      );
    }

    // Generate slug from title
    const slug = slugify(title);

    // Insert conversation card
    const { data: conversation, error: convError } = await supabase
      .from('conversation_cards')
      .insert({
        slug,
        title,
        title_vi: title_vi || null,
        scene_image_path,
        category_id: category_id || null,
        difficulty,
        meta_description: meta_description || null,
        generated_by_ai,
        prompt_used: prompt_used || null,
        prompt_version: prompt_version || null,
        is_published,
      })
      .select()
      .single();

    if (convError) {
      console.error('Conversation insert error:', convError);
      return NextResponse.json({ error: convError.message }, { status: 500 });
    }

    // Generate audio for each line in parallel
    const linesWithAudio = await Promise.all(
      lines.map(async (line: Record<string, string>, index: number) => {
        const audioPath = await generateAudioForLine(
          line.vietnamese,
          slug,
          index,
          supabase
        );

        return {
          conversation_card_id: conversation.id,
          speaker: line.speaker,
          speaker_vi: line.speaker_vi || null,
          vietnamese: line.vietnamese,
          english: line.english,
          romanization: line.romanization || null,
          audio_path: audioPath,
          audio_source: audioPath ? 'auto' : null,
          sort_order: index,
        };
      })
    );

    // Insert all lines
    const { error: linesError } = await supabase
      .from('conversation_lines')
      .insert(linesWithAudio);

    if (linesError) {
      // Rollback: delete the conversation if lines failed
      await supabase.from('conversation_cards').delete().eq('id', conversation.id);
      console.error('Lines insert error:', linesError);
      return NextResponse.json({ error: linesError.message }, { status: 500 });
    }

    // Fetch complete conversation with lines
    const { data: completeConversation } = await supabase
      .from('conversation_cards')
      .select(`
        *,
        category:categories(*),
        lines:conversation_lines(*)
      `)
      .eq('id', conversation.id)
      .single();

    // Sort lines by sort_order
    if (completeConversation?.lines) {
      completeConversation.lines.sort((a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
      );
    }

    return NextResponse.json(completeConversation, { status: 201 });
  } catch (error) {
    console.error('Create error:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
