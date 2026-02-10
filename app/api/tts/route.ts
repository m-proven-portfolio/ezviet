import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface TTSRequest {
  text: string;
  languageCode?: string;
  voiceName?: string;
  // Optional: provide a filename hint for storage
  filenameHint?: string;
}

interface GoogleTTSResponse {
  audioContent: string; // base64 encoded audio
}

/**
 * Google Cloud Text-to-Speech API route
 *
 * Generates Vietnamese audio and uploads to Supabase storage.
 * Returns the storage path for use in card_terms.audio_path
 *
 * Vietnamese voices available:
 * - vi-VN-Standard-A (Female)
 * - vi-VN-Standard-B (Male)
 * - vi-VN-Wavenet-A (Female, higher quality)
 * - vi-VN-Wavenet-B (Male, higher quality)
 * - vi-VN-Wavenet-C (Female, higher quality)
 * - vi-VN-Wavenet-D (Male, higher quality)
 */
export async function POST(request: NextRequest) {
  try {
    const body: TTSRequest = await request.json();
    const {
      text,
      languageCode = 'vi-VN',
      voiceName = 'vi-VN-Wavenet-A', // Female, high quality
      filenameHint
    } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_CLOUD_API_KEY not configured');
      return NextResponse.json(
        { error: 'TTS service not configured' },
        { status: 500 }
      );
    }

    // Call Google Cloud TTS API
    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode,
            name: voiceName,
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
      return NextResponse.json(
        { error: 'Failed to generate audio', details: errorData },
        { status: 500 }
      );
    }

    const ttsData: GoogleTTSResponse = await ttsResponse.json();

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(ttsData.audioContent, 'base64');

    // Generate filename (ASCII only - Supabase storage doesn't like Unicode)
    const sanitizedText = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/đ/g, 'd')              // Vietnamese đ
      .replace(/[^a-z0-9]/gi, '-')     // Only ASCII alphanumeric
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')           // Trim leading/trailing dashes
      .substring(0, 30);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const filename = filenameHint
      ? `${filenameHint.replace(/[^a-z0-9-]/gi, '')}-${random}.mp3`
      : `${sanitizedText}-${timestamp}-${random}.mp3`;

    // Upload to Supabase storage
    const supabase = createAdminClient();

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cards-audio')
      .upload(filename, audioBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: '31536000', // Cache for 1 year
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload audio', details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('cards-audio')
      .getPublicUrl(uploadData.path);

    return NextResponse.json({
      success: true,
      path: uploadData.path,
      publicUrl: urlData.publicUrl,
      text,
      voiceName,
    });

  } catch (error) {
    console.error('TTS route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
