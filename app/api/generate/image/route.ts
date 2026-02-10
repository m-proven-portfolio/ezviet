import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createAdminClient } from '@/lib/supabase/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Request body type
interface ImageGenerationRequest {
  prompt: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  style?: 'vivid' | 'natural';
  bookId?: string; // Optional: for organizing in book-assets folder
}

// Response type
interface ImageGenerationResponse {
  url: string;
  storagePath: string;
  revisedPrompt: string;
}

/**
 * POST /api/generate/image
 *
 * Generate an image using DALL-E 3 and upload it to Supabase storage.
 * Returns the public URL and storage path.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ImageGenerationRequest;

    // Validate required fields
    if (!body.prompt || body.prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      );
    }

    // Validate prompt length (DALL-E 3 has a 4000 char limit)
    if (body.prompt.length > 4000) {
      return NextResponse.json(
        { error: 'prompt must be 4000 characters or less' },
        { status: 400 }
      );
    }

    // Generate image with DALL-E 3
    const imageResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: body.prompt,
      size: body.size || '1024x1024',
      style: body.style || 'vivid',
      quality: 'standard',
      n: 1,
    });

    const generatedImageUrl = imageResponse.data?.[0]?.url;
    const revisedPrompt = imageResponse.data?.[0]?.revised_prompt || body.prompt;

    if (!generatedImageUrl) {
      return NextResponse.json(
        { error: 'Failed to generate image - no URL returned' },
        { status: 500 }
      );
    }

    // Download the image from OpenAI's temporary URL
    const imageData = await fetch(generatedImageUrl);
    if (!imageData.ok) {
      return NextResponse.json(
        { error: 'Failed to download generated image' },
        { status: 500 }
      );
    }

    const imageBuffer = await imageData.arrayBuffer();
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${randomSuffix}.png`;

    // Determine storage path
    const storagePath = body.bookId
      ? `books/${body.bookId}/${filename}`
      : `wizard/${filename}`;

    // Upload to Supabase storage
    const supabase = createAdminClient();
    const { error: uploadError } = await supabase.storage
      .from('book-assets')
      .upload(storagePath, imageBlob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload image: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('book-assets')
      .getPublicUrl(storagePath);

    const response: ImageGenerationResponse = {
      url: urlData.publicUrl,
      storagePath,
      revisedPrompt,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Image generation error:', error);

    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 400) {
        return NextResponse.json(
          { error: `Invalid request: ${error.message}` },
          { status: 400 }
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'API authentication failed. Please check configuration.' },
          { status: 500 }
        );
      }
      // Content policy violation
      if (error.code === 'content_policy_violation') {
        return NextResponse.json(
          { error: 'Image request was rejected due to content policy. Please modify your prompt.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error during image generation' },
      { status: 500 }
    );
  }
}
