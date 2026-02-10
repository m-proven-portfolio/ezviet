import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { slugify } from '@/lib/utils';

// Prompt version for tracking - increment when prompt changes
const PROMPT_VERSION = 'v1.0.0-vi-to-en';

// Response structure from AI (same as en-to-vi for compatibility)
export interface AIGenerationResponse {
  english: string;
  vietnamese_south: string;
  vietnamese_south_phonetic: string;
  vietnamese_north: string | null;
  vietnamese_north_phonetic: string | null;
  slug: string;
  meta_description: string;
  prompt_version: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a Vietnamese language expert creating flashcards for Vietnamese speakers learning English.

## YOUR TASK
Given a Vietnamese word/phrase (Southern dialect), generate:
1. An accurate English translation with context
2. Romanized pronunciation for the Vietnamese input
3. Northern Vietnamese variant (only if pronunciation differs from Southern)

## ROMANIZATION SYSTEM

### TONES (always add in parentheses after pronunciation)
- No mark (thanh ngang) = flat
- ́ sắc = up
- ̀ huyền = down
- ̉ hỏi = broken down
- ̃ ngã = broken up
- ̣ nặng = low drop

### BASE VOWELS
- a → ah
- ă → ā
- â → ūh
- e → eh
- ê → eih
- i → ee
- y → ee
- o → aw
- ô → oh
- ơ → er
- u → oo
- ư → eu

### VOWEL COMBINATIONS
- ai → ai
- ay → ay
- ao → ao
- au → au
- ia → ia
- oa → oa
- oi → oi
- ua → ua
- uo / uô → uo
- ưa / ươ → eua

### INITIAL CONSONANTS
- b → b
- c / k → k
- ch → ch
- d / gi (South) → y
- d / gi (North) → z
- đ → d
- g / gh → g
- h → h
- kh → kh
- l → l
- m → m
- n → n
- ng / ngh → ng
- nh → ny
- ph → f
- qu → w
- r (South) → r
- r (North) → z
- s → s
- t → t
- th → th
- tr → tr
- v → v
- x → s

### FINAL CONSONANTS
- -m → m
- -n → n
- -ng → ng
- -nh → nh
- -p → p
- -t → t
- -c → k
- -ch → ch

## EXAMPLES
- mận → muhn (low drop)
- chuối → chooi (up)
- xoài → soai (down)
- cam → kam (flat)
- táo → tao (up)
- dưa hấu → yeua how (flat, up)
- bưởi → beuoi (broken down)
- ổi → ohi (broken down)
- đu đủ → doo doo (flat, broken down)
- trái cây → trai kay (up, flat)
- nhãn → nyahn (broken up)
- nho → nyo (flat)

## OUTPUT FORMAT

Return EXACTLY this JSON:
{
  "english": "Clear English translation with brief context if helpful",
  "vietnamese_south_phonetic": "Romanized pronunciation with tone in parentheses",
  "vietnamese_north": "Northern dialect if DIFFERENT from South, otherwise null",
  "vietnamese_north_phonetic": "Northern phonetic if different, otherwise null"
}

## RULES:
1. The Vietnamese input is assumed to be Southern dialect
2. Use the romanization mappings above consistently
3. Always add tone description in parentheses: (flat), (up), (down), (broken down), (broken up), (low drop)
4. For multi-word phrases, show tone for each word: "yeua how (flat, up)"
5. Use hyphens to separate syllables in compound words when helpful for readability
6. If North and South pronunciations are IDENTICAL, set vietnamese_north and vietnamese_north_phonetic to null
7. For English translation, provide context when the word has multiple meanings

Respond ONLY with valid JSON.`;

export async function POST(request: NextRequest) {
  try {
    const { vietnamese } = await request.json();

    if (!vietnamese || typeof vietnamese !== 'string') {
      return NextResponse.json(
        { error: 'Vietnamese word is required' },
        { status: 400 }
      );
    }

    // Trim and validate input
    const word = vietnamese.trim();
    if (word.length === 0) {
      return NextResponse.json(
        { error: 'Vietnamese word cannot be empty' },
        { status: 400 }
      );
    }
    if (word.length > 100) {
      return NextResponse.json(
        { error: 'Vietnamese word is too long (max 100 characters)' },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Generate English translation and phonetics for: "${word}"` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const result = JSON.parse(content);

    // Validate required fields
    if (!result.english || !result.vietnamese_south_phonetic) {
      console.error('Invalid AI response structure:', result);
      throw new Error('Invalid AI response structure');
    }

    // Generate slug from Vietnamese word using Vietnamese-aware slugify
    const slug = slugify(word);

    // Generate meta_description for Vietnamese learners
    const meta_description = `Learn '${result.english}' - the English word for '${word}' in Vietnamese.`;

    const response: AIGenerationResponse = {
      english: result.english,
      vietnamese_south: word, // Input is Southern Vietnamese
      vietnamese_south_phonetic: result.vietnamese_south_phonetic,
      vietnamese_north: result.vietnamese_north || null,
      vietnamese_north_phonetic: result.vietnamese_north_phonetic || null,
      slug,
      meta_description,
      prompt_version: PROMPT_VERSION,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('AI generation error:', error);

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
      { error: 'Failed to generate translation' },
      { status: 500 }
    );
  }
}
