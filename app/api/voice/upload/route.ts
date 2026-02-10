import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { VoiceContext, VoiceRecordingRow } from '@/lib/voice/types';
import { toVoiceRecording } from '@/lib/voice/types';

const ALLOWED_MIME_TYPES = [
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const audio = formData.get('audio') as File | null;
    const context = formData.get('context') as string | null;
    const phraseText = formData.get('phraseText') as string | null;
    const phraseId = formData.get('phraseId') as string | null;
    const durationMs = formData.get('durationMs') as string | null;

    // Validate required fields
    if (!audio) {
      return NextResponse.json({ error: 'audio file is required' }, { status: 400 });
    }
    if (!context) {
      return NextResponse.json({ error: 'context is required' }, { status: 400 });
    }
    if (!phraseText) {
      return NextResponse.json({ error: 'phraseText is required' }, { status: 400 });
    }

    // Validate context
    const validContexts: VoiceContext[] = ['market', 'flashcard', 'tone_gym', 'practice'];
    if (!validContexts.includes(context as VoiceContext)) {
      return NextResponse.json(
        { error: `Invalid context. Must be one of: ${validContexts.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(audio.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (audio.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Generate storage path: {userId}/{timestamp}.{ext}
    const ext = audio.type.split('/')[1] || 'webm';
    const timestamp = Date.now();
    const storagePath = `${user.id}/${timestamp}.${ext}`;

    // Upload to storage
    const arrayBuffer = await audio.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('voice-recordings')
      .upload(storagePath, arrayBuffer, {
        contentType: audio.type,
        cacheControl: '31536000', // 1 year cache
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload recording' }, { status: 500 });
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('voice-recordings').getPublicUrl(storagePath);

    // Insert database record
    const { data: recording, error: dbError } = await supabase
      .from('voice_recordings')
      .insert({
        user_id: user.id,
        context,
        phrase_text: phraseText,
        phrase_id: phraseId || null,
        storage_path: storagePath,
        duration_ms: durationMs ? parseInt(durationMs, 10) : null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Try to clean up uploaded file
      await supabase.storage.from('voice-recordings').remove([storagePath]);
      return NextResponse.json({ error: 'Failed to save recording' }, { status: 500 });
    }

    // Return the recording with public URL
    const result = toVoiceRecording(recording as VoiceRecordingRow, publicUrl);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Voice upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
