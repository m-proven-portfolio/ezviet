import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Prompt version for tracking
const PROMPT_VERSION = 'conv-v1.0.0';

// Response structure for conversation generation
export interface ConversationGenerationResponse {
  title: string;
  title_vi: string;
  lines: Array<{
    speaker: string;
    speaker_vi: string;
    vietnamese: string;
    english: string;
    romanization: string;
  }>;
  meta_description: string;
  prompt_version: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a Vietnamese language expert creating conversation flashcards for English speakers learning Vietnamese.

## YOUR TASK
Generate a natural, realistic Vietnamese conversation based on a given situation. The conversation should teach useful, everyday phrases.

## ROMANIZATION SYSTEM

### TONES (always add in parentheses after pronunciation)
- No mark = flat
- ́ sắc = up
- ̀ huyền = down
- ̉ hỏi = broken down
- ̃ ngã = broken up
- ̣ nặng = low drop

### BASE VOWELS
- a → ah, ă → ā, â → ūh
- e → eh, ê → eih
- i/y → ee
- o → aw, ô → oh, ơ → er
- u → oo, ư → eu

### INITIAL CONSONANTS
- c/k → k, ch → ch
- d/gi (South) → y
- đ → d
- ng/ngh → ng, nh → ny
- ph → f, qu → w
- r (South) → r
- th → th, tr → tr
- x → s

## OUTPUT FORMAT

Return EXACTLY this JSON structure:
{
  "title": "Short English title for the conversation (2-5 words)",
  "title_vi": "Vietnamese title",
  "lines": [
    {
      "speaker": "Speaker name in English (e.g., Customer, Waiter, Person A)",
      "speaker_vi": "Speaker name in Vietnamese (e.g., Khách, Phục vụ)",
      "vietnamese": "Vietnamese dialogue with proper diacritics",
      "english": "English translation of the line",
      "romanization": "Romanized pronunciation with tones, e.g., sin chow (flat, down)"
    }
  ],
  "meta_description": "SEO description (120-160 chars) about learning this conversation"
}

## RULES:
1. Generate 4-6 dialogue lines - enough for a meaningful exchange, not too long
2. Use natural, everyday Vietnamese that native speakers actually use
3. Focus on Southern Vietnamese pronunciation as primary
4. Include common phrases that learners will use frequently
5. Make speakers' roles clear (Customer/Staff, Tourist/Local, etc.)
6. Include politeness markers where appropriate (ạ, dạ, etc.)
7. The conversation should have a clear beginning, middle, and end
8. Use tone descriptions for each word: (flat), (up), (down), (broken down), (broken up), (low drop)

Respond ONLY with valid JSON.`;

export async function POST(request: NextRequest) {
  try {
    const { prompt, difficulty = 1 } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Situation prompt is required' },
        { status: 400 }
      );
    }

    const situation = prompt.trim();
    if (situation.length === 0) {
      return NextResponse.json(
        { error: 'Situation prompt cannot be empty' },
        { status: 400 }
      );
    }
    if (situation.length > 500) {
      return NextResponse.json(
        { error: 'Situation prompt is too long (max 500 characters)' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    // Adjust complexity hint based on difficulty
    const complexityHint = difficulty <= 2
      ? 'Use simple, common vocabulary suitable for beginners.'
      : difficulty >= 4
        ? 'Include some intermediate vocabulary and longer sentences.'
        : 'Use everyday vocabulary with moderate complexity.';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Create a Vietnamese conversation for this situation: "${situation}"

${complexityHint}

Generate a natural, useful conversation that teaches practical phrases.`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7, // Slightly higher for natural variety
      max_tokens: 1500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const result = JSON.parse(content);

    // Validate response structure
    if (!result.title || !result.lines || !Array.isArray(result.lines) || result.lines.length === 0) {
      console.error('Invalid AI response structure:', result);
      throw new Error('Invalid AI response structure');
    }

    // Validate each line has required fields
    for (const line of result.lines) {
      if (!line.speaker || !line.vietnamese || !line.english) {
        console.error('Invalid line structure:', line);
        throw new Error('Invalid line structure in AI response');
      }
    }

    const response: ConversationGenerationResponse = {
      title: result.title,
      title_vi: result.title_vi || result.title,
      lines: result.lines.map((line: Record<string, string>) => ({
        speaker: line.speaker,
        speaker_vi: line.speaker_vi || line.speaker,
        vietnamese: line.vietnamese,
        english: line.english,
        romanization: line.romanization || '',
      })),
      meta_description: result.meta_description ||
        `Learn Vietnamese through a ${situation.toLowerCase()} conversation with audio and translations.`,
      prompt_version: PROMPT_VERSION,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Conversation generation error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'AI returned invalid response' },
        { status: 500 }
      );
    }

    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit reached. Please try again in a moment.' },
          { status: 429 }
        );
      }
      if (error.status === 401) {
        console.error('OpenAI API key invalid');
        return NextResponse.json(
          { error: 'AI service unavailable' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate conversation' },
      { status: 500 }
    );
  }
}
