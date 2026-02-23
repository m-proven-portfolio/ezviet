import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createAdminClient } from '@/lib/supabase/server';

// Initialize Gemini client (supports multiple env var names used in docs/setup)
const googleApiKey =
  process.env.GOOGLE_API_KEY ||
  process.env.GOOGLE_CLOUD_API_KEY ||
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
  '';
const genAI = new GoogleGenerativeAI(googleApiKey);

interface ImageGenerationRequest {
  prompt: string;
  aspectRatio?: '1:1' | '16:9' | '9:16';
}

interface ImageGenerationResponse {
  url: string;
  storagePath: string;
}

/**
 * POST /api/generate/image-gemini
 *
 * Generate an image using Google Gemini Imagen and upload to Supabase storage.
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

    if (!googleApiKey) {
      return NextResponse.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      );
    }

    // Use Gemini 2.5 Flash Image (Nano Banana) - the supported image-generation model
    // See https://ai.google.dev/gemini-api/docs/image-generation
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image',
      generationConfig: {
        // @ts-expect-error - responseModalities is valid for image generation
        responseModalities: ['Text', 'Image'],
      },
    });

    // Generate image with Gemini
    const result = await model.generateContent(
      `Generate an image: ${body.prompt}. Create a high-quality, photorealistic scene image suitable for a Vietnamese language learning flashcard. The image should be warm, inviting, and culturally authentic to Vietnam.`
    );

    const response = result.response;
    const parts = response.candidates?.[0]?.content?.parts || [];

    // Find the image part
    let imageData: string | null = null;
    for (const part of parts) {
      if ('inlineData' in part && part.inlineData) {
        imageData = part.inlineData.data;
        break;
      }
    }

    if (!imageData) {
      return NextResponse.json(
        { error: 'Failed to generate image - no image data returned' },
        { status: 500 }
      );
    }

    // Convert base64 to blob
    const imageBuffer = Buffer.from(imageData, 'base64');
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const filename = `gemini-${timestamp}-${randomSuffix}.png`;
    const storagePath = `conversations/${filename}`;

    // Upload to Supabase storage
    const supabase = createAdminClient();
    const { error: uploadError } = await supabase.storage
      .from('cards-images')
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
      .from('cards-images')
      .getPublicUrl(storagePath);

    const responseData: ImageGenerationResponse = {
      url: urlData.publicUrl,
      storagePath,
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Gemini image generation error:', error);

    // Handle specific errors
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();

      if (errorMsg.includes('api_key') || errorMsg.includes('api key')) {
        return NextResponse.json(
          { error: 'API authentication failed. Please check Google API key.' },
          { status: 500 }
        );
      }
      if (errorMsg.includes('safety')) {
        return NextResponse.json(
          { error: 'Image request was rejected due to safety filters. Please modify your prompt.' },
          { status: 400 }
        );
      }
      if (errorMsg.includes('not found') || errorMsg.includes('not supported') || errorMsg.includes('invalid')) {
        return NextResponse.json(
          {
            error:
              'Gemini image model is not available for this API key (e.g. wrong model or no image access). Use DALL-E 3 instead, or check that your key has access to Gemini image generation.',
          },
          { status: 400 }
        );
      }
      if (errorMsg.includes('permission') || errorMsg.includes('access')) {
        return NextResponse.json(
          { error: 'Gemini image generation requires additional API access. Please use DALL-E 3 instead.' },
          { status: 400 }
        );
      }
      if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('too many requests')) {
        return NextResponse.json(
          {
            error:
              'Gemini free-tier quota exceeded. Use DALL-E 3 for now, or check Google AI Studio billing for higher limits.',
          },
          { status: 429 }
        );
      }

      // Log the actual error for debugging
      console.error('Gemini error details:', error.message);
      return NextResponse.json(
        { error: `Gemini error: ${error.message}. Try using DALL-E 3 instead.` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Image generation failed. Please try DALL-E 3 instead.' },
      { status: 500 }
    );
  }
}
