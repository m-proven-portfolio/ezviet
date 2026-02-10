import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const ACCEPTED_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/m4a',
  'audio/x-m4a',
  'audio/webm',
  'audio/mp4',
  'audio/ogg',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const region = formData.get('region') as string | null;

    // Validate file presence
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Accepted: MP3, WAV, M4A, WebM` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Generate filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
    const ext = originalName.split('.').pop() || 'mp3';
    const regionSuffix = region ? `-${region}` : '';
    const filename = `admin${regionSuffix}-${timestamp}-${random}.${ext}`;

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase storage
    const { data, error: uploadError } = await supabase.storage
      .from('cards-audio')
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: '31536000', // Cache for 1 year
        upsert: false,
      });

    if (uploadError) {
      console.error('Audio upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('cards-audio')
      .getPublicUrl(data.path);

    return NextResponse.json({
      path: data.path,
      publicUrl,
      filename,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Audio upload error:', error);
    return NextResponse.json({ error: 'Failed to upload audio' }, { status: 500 });
  }
}
