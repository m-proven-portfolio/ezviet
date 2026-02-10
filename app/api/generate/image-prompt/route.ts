import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ImagePromptRequest {
  situation: string;
}

interface ImagePromptResponse {
  imagePrompt: string;
}

/**
 * POST /api/generate/image-prompt
 *
 * Generate an optimized image prompt from a conversation situation description.
 * Uses GPT-4 to create a detailed, visually descriptive prompt for DALL-E/Gemini.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ImagePromptRequest;

    if (!body.situation || body.situation.trim().length === 0) {
      return NextResponse.json(
        { error: 'situation is required' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert at creating image prompts for AI image generators.

Given a conversation situation, create a detailed image prompt that will generate a beautiful, photorealistic scene image suitable for a Vietnamese language learning flashcard.

Guidelines:
- Focus on the setting/location described in the situation
- Include Vietnamese cultural elements where appropriate (architecture, decorations, food, clothing)
- Describe lighting, atmosphere, and mood
- Keep it warm, inviting, and educational
- Avoid including people/faces (focus on the environment/scene)
- Output ONLY the image prompt, no explanations

Example:
Situation: "Ordering pho at a restaurant"
Prompt: "A cozy Vietnamese pho restaurant interior, warm golden lighting, wooden tables with steaming bowls of pho, traditional Vietnamese decorations, mint leaves and bean sprouts in small dishes, chopsticks in ceramic holders, authentic street food atmosphere, soft morning light through windows, photorealistic style"`,
        },
        {
          role: 'user',
          content: `Create an image prompt for this situation: "${body.situation}"`,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const imagePrompt = completion.choices[0]?.message?.content?.trim();

    if (!imagePrompt) {
      return NextResponse.json(
        { error: 'Failed to generate image prompt' },
        { status: 500 }
      );
    }

    const response: ImagePromptResponse = {
      imagePrompt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Image prompt generation error:', error);

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `OpenAI error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error during prompt generation' },
      { status: 500 }
    );
  }
}
