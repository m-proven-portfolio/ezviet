import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Generate a signed URL for direct upload to Supabase
export async function POST(request: NextRequest) {
  try {
    const { filename, contentType } = await request.json();

    if (!filename) {
      return NextResponse.json({ error: 'Filename required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '-');
    const storagePath = `song-${timestamp}-${random}-${safeName}`;

    // Create signed upload URL (valid for 1 hour)
    const { data, error } = await supabase.storage
      .from('cards-songs')
      .createSignedUploadUrl(storagePath);

    if (error) {
      console.error('Signed URL error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      storagePath,
    });
  } catch (error) {
    console.error('Signed URL error:', error);
    return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 });
  }
}
