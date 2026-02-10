import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ songId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { songId } = await context.params;
    const supabase = createAdminClient();

    // Get song details
    const { data: song, error } = await supabase
      .from('card_songs')
      .select('storage_path, title')
      .eq('id', songId)
      .single();

    if (error || !song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    // Fetch the file from Supabase storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('cards-songs')
      .download(song.storage_path);

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError);
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
    }

    // Create filename (sanitize for headers)
    const filename = `${song.title.replace(/[^a-zA-Z0-9\s-]/g, '')}.mp3`;

    // Return the file with download headers
    return new NextResponse(fileData, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileData.size.toString(),
      },
    });
  } catch (error) {
    console.error('Error in download route:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
