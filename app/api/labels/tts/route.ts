import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

interface LabelTTSRequest {
  labelId: string;
  text?: string; // Override text (uses label.vietnamese if not provided)
  accent?: 'north' | 'south'; // Override accent (uses label.accent or label_set default)
}

interface GoogleTTSResponse {
  audioContent: string; // base64 encoded audio
}

// Vietnamese voice mapping
const VOICE_MAP = {
  north: 'vi-VN-Wavenet-D', // Male, northern accent
  south: 'vi-VN-Wavenet-A', // Female, southern accent
};

/**
 * POST /api/labels/tts
 * Generate TTS audio for a label and save the URL to the database
 *
 * This endpoint:
 * 1. Fetches the label to get Vietnamese text
 * 2. Generates TTS via Google Cloud
 * 3. Uploads to Supabase storage
 * 4. Updates label.audio_url
 * 5. Returns the public URL
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: LabelTTSRequest = await request.json();
    const { labelId, text: overrideText, accent: overrideAccent } = body;

    if (!labelId) {
      return NextResponse.json({ error: 'labelId is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch label with its label_set for default accent
    const { data: label, error: labelError } = await supabase
      .from('labels')
      .select(
        `
        id,
        vietnamese,
        tts_hint,
        accent,
        label_set:label_sets(id, default_accent, created_by)
      `
      )
      .eq('id', labelId)
      .single();

    if (labelError || !label) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 });
    }

    // Check permission (admin or creator)
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    // Handle Supabase join result (could be array or single object)
    const labelSetRaw = label.label_set as unknown;
    const labelSet = (Array.isArray(labelSetRaw) ? labelSetRaw[0] : labelSetRaw) as
      | { id: string; default_accent: string; created_by: string }
      | null
      | undefined;

    if (!profile?.is_admin && labelSet?.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Determine text to synthesize (priority: override > tts_hint > vietnamese)
    const textToSpeak = overrideText || label.tts_hint || label.vietnamese;

    if (!textToSpeak) {
      return NextResponse.json(
        { error: 'No text to synthesize' },
        { status: 400 }
      );
    }

    // Determine accent (priority: override > label.accent > label_set.default_accent > 'south')
    const accent: 'north' | 'south' =
      overrideAccent ||
      (label.accent as 'north' | 'south') ||
      (labelSet?.default_accent as 'north' | 'south') ||
      'south';

    const voiceName = VOICE_MAP[accent];

    // Check Google Cloud API key
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_CLOUD_API_KEY not configured');
      return NextResponse.json(
        { error: 'TTS service not configured' },
        { status: 500 }
      );
    }

    // Generate TTS via Google Cloud
    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: textToSpeak },
          voice: {
            languageCode: 'vi-VN',
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

    // Generate filename (ASCII only for Supabase storage)
    const sanitizedText = label.vietnamese
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const filename = `label-${sanitizedText}-${timestamp}-${random}.mp3`;

    // Upload to Supabase storage
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

    const publicUrl = urlData.publicUrl;

    // Update label with audio URL
    const { error: updateError } = await supabase
      .from('labels')
      .update({ audio_url: publicUrl })
      .eq('id', labelId);

    if (updateError) {
      console.error('Error updating label audio_url:', updateError);
      // Don't fail - audio was generated, just log the DB update error
    }

    return NextResponse.json({
      success: true,
      labelId,
      audio_url: publicUrl,
      text: textToSpeak,
      accent,
      voiceName,
    });
  } catch (error) {
    console.error('Label TTS route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
