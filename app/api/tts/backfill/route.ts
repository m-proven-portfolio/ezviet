import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Backfill audio for existing Vietnamese terms that don't have audio
 *
 * POST /api/tts/backfill
 * - Finds all Vietnamese terms without audio_path
 * - Generates audio for each using Google Cloud TTS
 * - Updates the terms with the new audio paths
 *
 * Query params:
 * - limit: max number of terms to process (default: 10)
 * - dryRun: if "true", just returns what would be processed without generating
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const dryRun = searchParams.get('dryRun') === 'true';

    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
    if (!apiKey && !dryRun) {
      return NextResponse.json(
        { error: 'GOOGLE_CLOUD_API_KEY not configured' },
        { status: 500 }
      );
    }

    const supabase = createAdminClient();

    // Find Vietnamese terms without audio
    const { data: termsWithoutAudio, error: fetchError } = await supabase
      .from('card_terms')
      .select(`
        id,
        text,
        region,
        card_id,
        cards!inner(slug)
      `)
      .eq('lang', 'vi')
      .is('audio_path', null)
      .limit(limit);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!termsWithoutAudio || termsWithoutAudio.length === 0) {
      return NextResponse.json({
        message: 'All Vietnamese terms already have audio!',
        processed: 0,
      });
    }

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        wouldProcess: termsWithoutAudio.length,
        terms: termsWithoutAudio.map(t => ({
          id: t.id,
          text: t.text,
          region: t.region,
          slug: (t.cards as any).slug,
        })),
      });
    }

    // Process terms
    const results: Array<{
      id: string;
      text: string;
      success: boolean;
      audioPath?: string;
      error?: string;
    }> = [];

    for (const term of termsWithoutAudio) {
      try {
        const slug = (term.cards as any).slug;

        // Call Google Cloud TTS API
        const ttsResponse = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input: { text: term.text },
              voice: {
                languageCode: 'vi-VN',
                name: 'vi-VN-Wavenet-A',
              },
              audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: 0.9,
                pitch: 0,
              },
            }),
          }
        );

        if (!ttsResponse.ok) {
          const errorData = await ttsResponse.json();
          results.push({
            id: term.id,
            text: term.text,
            success: false,
            error: JSON.stringify(errorData),
          });
          continue;
        }

        const ttsData = await ttsResponse.json();
        const audioBuffer = Buffer.from(ttsData.audioContent, 'base64');

        // Generate filename
        const regionSuffix = term.region ? `-${term.region}` : '';
        const random = Math.random().toString(36).substring(7);
        const filename = `${slug}${regionSuffix}-${random}.mp3`;

        // Upload to Supabase
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('cards-audio')
          .upload(filename, audioBuffer, {
            contentType: 'audio/mpeg',
            cacheControl: '31536000',
            upsert: false,
          });

        if (uploadError) {
          results.push({
            id: term.id,
            text: term.text,
            success: false,
            error: uploadError.message,
          });
          continue;
        }

        // Update the term with audio path
        const { error: updateError } = await supabase
          .from('card_terms')
          .update({ audio_path: uploadData.path })
          .eq('id', term.id);

        if (updateError) {
          results.push({
            id: term.id,
            text: term.text,
            success: false,
            error: updateError.message,
          });
          continue;
        }

        results.push({
          id: term.id,
          text: term.text,
          success: true,
          audioPath: uploadData.path,
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error: any) {
        results.push({
          id: term.id,
          text: term.text,
          success: false,
          error: error.message,
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      message: `Processed ${results.length} terms`,
      successful,
      failed,
      results,
    });

  } catch (error: any) {
    console.error('Backfill error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET: Check how many terms need audio
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { count, error } = await supabase
      .from('card_terms')
      .select('*', { count: 'exact', head: true })
      .eq('lang', 'vi')
      .is('audio_path', null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      termsWithoutAudio: count,
      message: count === 0
        ? 'All Vietnamese terms have audio!'
        : `${count} Vietnamese terms need audio generation`,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
