import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import * as mm from 'music-metadata';

// Extract ID3 metadata from an already-uploaded file in Supabase storage
export async function POST(request: NextRequest) {
  try {
    const { storagePath } = await request.json();

    if (!storagePath) {
      return NextResponse.json({ error: 'storagePath required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Download the file from storage to extract metadata
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('cards-songs')
      .download(storagePath);

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError);
      return NextResponse.json({ error: 'Failed to download file for metadata extraction' }, { status: 500 });
    }

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get file size
    const file_size = buffer.length;

    // Extract ID3 metadata
    let metadata: {
      title: string | null;
      artist: string | null;
      album: string | null;
      year: number | null;
      duration_seconds: number | null;
      cover_image_path: string | null;
    } = {
      title: null,
      artist: null,
      album: null,
      year: null,
      duration_seconds: null,
      cover_image_path: null,
    };

    try {
      const parsed = await mm.parseBuffer(buffer, 'audio/mpeg');

      metadata.title = parsed.common.title || null;
      metadata.artist = parsed.common.artist || null;
      metadata.album = parsed.common.album || null;
      metadata.year = parsed.common.year || null;
      metadata.duration_seconds = parsed.format.duration
        ? Math.round(parsed.format.duration)
        : null;

      // Extract cover art if present
      const picture = parsed.common.picture?.[0];
      if (picture) {
        const coverBuffer = Buffer.from(picture.data);
        const coverExt = picture.format.includes('png') ? 'png' : 'jpg';
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const coverFilename = `song-cover-${timestamp}-${random}.${coverExt}`;

        const { data: coverData, error: coverError } = await supabase.storage
          .from('cards-images')
          .upload(coverFilename, coverBuffer, {
            contentType: picture.format,
            cacheControl: '31536000',
            upsert: false,
          });

        if (!coverError && coverData) {
          metadata.cover_image_path = coverData.path;
        }
      }
    } catch (parseError) {
      // Metadata extraction failed, continue with basic info
      console.warn('ID3 metadata extraction failed:', parseError);
    }

    // Get public URL for preview
    const { data: { publicUrl } } = supabase.storage
      .from('cards-songs')
      .getPublicUrl(storagePath);

    // Get cover public URL if extracted
    let coverPublicUrl = null;
    if (metadata.cover_image_path) {
      const { data: { publicUrl: coverUrl } } = supabase.storage
        .from('cards-images')
        .getPublicUrl(metadata.cover_image_path);
      coverPublicUrl = coverUrl;
    }

    // Extract original filename from storage path for fallback title
    const originalName = storagePath.split('-').slice(3).join('-').replace(/\.[^/.]+$/, '');

    return NextResponse.json({
      storage_path: storagePath,
      publicUrl,
      file_size,
      mime_type: 'audio/mpeg',
      title: metadata.title || originalName || 'Untitled',
      artist: metadata.artist,
      album: metadata.album,
      year: metadata.year,
      duration_seconds: metadata.duration_seconds,
      cover_image_path: metadata.cover_image_path,
      cover_public_url: coverPublicUrl,
    });
  } catch (error) {
    console.error('Metadata extraction error:', error);
    return NextResponse.json({ error: 'Failed to extract metadata' }, { status: 500 });
  }
}
