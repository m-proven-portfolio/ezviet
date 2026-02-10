import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface BulkUploadFile {
  filename: string;
  contentType?: string;
}

/**
 * POST /api/songs/bulk-upload
 *
 * Generates multiple signed upload URLs for parallel file uploads.
 * Returns an array of signed URLs that clients can use to upload directly to Supabase storage.
 *
 * Request body:
 * {
 *   files: [{ filename: "song1.mp3", contentType?: "audio/mpeg" }, ...]
 * }
 *
 * Response:
 * {
 *   uploads: [{ signedUrl, storagePath, token, originalFilename }, ...]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { files } = (await request.json()) as { files: BulkUploadFile[] };

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided. Expected { files: [{ filename }] }' },
        { status: 400 }
      );
    }

    // Limit bulk uploads to prevent abuse
    const MAX_BULK_FILES = 20;
    if (files.length > MAX_BULK_FILES) {
      return NextResponse.json(
        { error: `Too many files. Maximum ${MAX_BULK_FILES} files per bulk upload.` },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Generate signed URLs for all files in parallel
    const uploadPromises = files.map(async (file, index) => {
      const { filename } = file;

      if (!filename) {
        return {
          error: `File at index ${index} missing filename`,
          originalFilename: null,
          signedUrl: null,
          storagePath: null,
          token: null,
        };
      }

      // Generate unique storage path
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '-');
      const storagePath = `song-${timestamp}-${random}-${safeName}`;

      try {
        // Create signed upload URL (valid for 1 hour)
        const { data, error } = await supabase.storage
          .from('cards-songs')
          .createSignedUploadUrl(storagePath);

        if (error) {
          return {
            error: error.message,
            originalFilename: filename,
            signedUrl: null,
            storagePath: null,
            token: null,
          };
        }

        return {
          signedUrl: data.signedUrl,
          storagePath,
          token: data.token,
          originalFilename: filename,
          error: null,
        };
      } catch (err) {
        return {
          error: 'Failed to create signed URL',
          originalFilename: filename,
          signedUrl: null,
          storagePath: null,
          token: null,
        };
      }
    });

    const results = await Promise.all(uploadPromises);

    // Separate successful uploads from failures
    const successful = results.filter((r) => r.signedUrl !== null);
    const failed = results.filter((r) => r.error !== null);

    return NextResponse.json({
      uploads: successful,
      errors: failed.length > 0 ? failed : undefined,
      totalRequested: files.length,
      totalSuccessful: successful.length,
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json({ error: 'Failed to create bulk upload URLs' }, { status: 500 });
  }
}
