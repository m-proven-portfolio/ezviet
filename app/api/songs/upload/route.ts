import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import * as mm from 'music-metadata';

const ACCEPTED_TYPES = ['audio/mpeg', 'audio/mp3'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Only MP3 files are accepted.` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Convert File to Buffer for both upload and metadata extraction
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

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
      const parsed = await mm.parseBuffer(buffer, file.type);

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
      // Metadata extraction failed, continue with upload anyway
      console.warn('ID3 metadata extraction failed:', parseError);
    }

    // Generate filename for the song
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
    const filename = `song-${timestamp}-${random}-${originalName}`;

    // Upload to Supabase storage
    const { data, error: uploadError } = await supabase.storage
      .from('cards-songs')
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      console.error('Song upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('cards-songs')
      .getPublicUrl(data.path);

    // Get cover public URL if extracted
    let coverPublicUrl = null;
    if (metadata.cover_image_path) {
      const { data: { publicUrl: coverUrl } } = supabase.storage
        .from('cards-images')
        .getPublicUrl(metadata.cover_image_path);
      coverPublicUrl = coverUrl;
    }

    return NextResponse.json({
      storage_path: data.path,
      publicUrl,
      file_size: file.size,
      mime_type: file.type,
      // Extracted metadata (all can be overridden by admin)
      title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
      artist: metadata.artist,
      album: metadata.album,
      year: metadata.year,
      duration_seconds: metadata.duration_seconds,
      cover_image_path: metadata.cover_image_path,
      cover_public_url: coverPublicUrl,
    });
  } catch (error) {
    console.error('Song upload error:', error);
    return NextResponse.json({ error: 'Failed to upload song' }, { status: 500 });
  }
}
