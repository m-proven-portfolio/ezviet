import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate TTS audio for Vietnamese text using Google Cloud TTS
 * Returns base64-encoded audio for immediate playback in preview
 */
export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'vi-VN-Wavenet-A' } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Vietnamese text is required' },
        { status: 400 }
      );
    }

    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      return NextResponse.json(
        { error: 'Text cannot be empty' },
        { status: 400 }
      );
    }

    if (trimmedText.length > 1000) {
      return NextResponse.json(
        { error: 'Text is too long (max 1000 characters)' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_CLOUD_API_KEY not configured');
      return NextResponse.json(
        { error: 'TTS service not configured' },
        { status: 503 }
      );
    }

    // Call Google Cloud TTS API
    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: trimmedText },
          voice: {
            languageCode: 'vi-VN',
            name: voice,
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
        { error: 'Failed to generate audio' },
        { status: 500 }
      );
    }

    const ttsData = await ttsResponse.json();

    // Return base64 audio content
    return NextResponse.json({
      audioContent: ttsData.audioContent,
      mimeType: 'audio/mpeg',
    });
  } catch (error) {
    console.error('TTS generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio' },
      { status: 500 }
    );
  }
}
