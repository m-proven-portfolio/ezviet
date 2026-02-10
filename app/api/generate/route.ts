import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Prompt version for tracking - increment when prompt changes
const PROMPT_VERSION = 'v4.0.0'; // Teacher's standardized romanization system

// Response structure from AI
export interface AIGenerationResponse {
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

const SYSTEM_PROMPT = `You are a Vietnamese language expert creating flashcards for English speakers learning Vietnamese.

## YOUR TASK
Generate Vietnamese translations with phonetic pronunciations using a standardized romanization system.

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
  "vietnamese_south": "Vietnamese with proper diacritics",
  "vietnamese_south_phonetic": "Romanized pronunciation with tone in parentheses",
  "vietnamese_north": "Northern dialect if DIFFERENT from South, otherwise null",
  "vietnamese_north_phonetic": "Northern phonetic if different, otherwise null"
}

## RULES:
1. Use the romanization mappings above consistently
2. Always add tone description in parentheses: (flat), (up), (down), (broken down), (broken up), (low drop)
3. For multi-word phrases, show tone for each word: "yeua how (flat, up)"
4. Use hyphens to separate syllables in compound words when helpful for readability
5. If North and South are IDENTICAL, set vietnamese_north and vietnamese_north_phonetic to null
6. Focus on Southern Vietnamese pronunciation as primary

Respond ONLY with valid JSON.`;

export async function POST(request: NextRequest) {
  try {
    const { english } = await request.json();

    if (!english || typeof english !== 'string') {
      return NextResponse.json(
        { error: 'English word is required' },
        { status: 400 }
      );
    }

    // Trim and validate input
    const word = english.trim();
    if (word.length === 0) {
      return NextResponse.json(
        { error: 'English word cannot be empty' },
        { status: 400 }
      );
    }
    if (word.length > 100) {
      return NextResponse.json(
        { error: 'English word is too long (max 100 characters)' },
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
        { role: 'user', content: `Translate to Vietnamese: "${word}"` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,  // Lower temperature for consistency
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const result = JSON.parse(content);

    // Validate required fields
    if (!result.vietnamese_south || !result.vietnamese_south_phonetic) {
      console.error('Invalid AI response structure:', result);
      throw new Error('Invalid AI response structure');
    }

    // Generate slug from English word
    const slug = word.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Generate meta_description from template (no AI needed)
    const meta_description = `Learn how to pronounce '${result.vietnamese_south}' in Vietnamese, the word for ${word}.`;

    const response: AIGenerationResponse = {
      vietnamese_south: result.vietnamese_south,
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
