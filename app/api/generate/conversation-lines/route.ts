import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Prompt version for tracking
const PROMPT_VERSION = 'conv-lines-v1.0.0';

// Input structure for manual conversation lines
interface ConversationLineInput {
  speaker: string;
  vietnamese: string;
}

// Output structure matching ConversationAIResponse lines
export interface ConversationLineOutput {
  speaker: string;
  speaker_vi: string;
  vietnamese: string;
  english: string;
  romanization: string;
}

export interface ConversationLinesResponse {
  lines: ConversationLineOutput[];
  prompt_version: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a Vietnamese language expert translating Vietnamese conversation lines to English.

## YOUR TASK
Given Vietnamese dialogue lines with speaker names, generate:
1. English translation for each line
2. Romanized pronunciation for each Vietnamese line
3. Vietnamese translation of speaker names (if provided in English)

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
  "lines": [
    {
      "speaker": "Speaker name in English",
      "speaker_vi": "Speaker name in Vietnamese",
      "vietnamese": "Original Vietnamese text (unchanged)",
      "english": "English translation",
      "romanization": "Romanized pronunciation with tones"
    }
  ]
}

## RULES:
1. Keep the original Vietnamese text exactly as provided
2. Provide natural, contextually appropriate English translations
3. Focus on Southern Vietnamese pronunciation for romanization
4. Use tone descriptions for each word: (flat), (up), (down), etc.
5. If speaker name is in Vietnamese, provide an English equivalent
6. If speaker name is in English, provide a Vietnamese equivalent
7. Common speaker translations: Customer=Khách, Vendor=Người bán, Friend=Bạn, Person A=Người A

Respond ONLY with valid JSON.`;

export async function POST(request: NextRequest) {
  try {
    const { lines } = await request.json();

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json(
        { error: 'Lines array is required' },
        { status: 400 }
      );
    }

    // Validate and sanitize input
    const inputLines: ConversationLineInput[] = [];
    for (const line of lines) {
      if (!line.vietnamese || typeof line.vietnamese !== 'string') {
        return NextResponse.json(
          { error: 'Each line must have a Vietnamese text' },
          { status: 400 }
        );
      }
      if (line.vietnamese.trim().length > 500) {
        return NextResponse.json(
          { error: 'Line text is too long (max 500 characters)' },
          { status: 400 }
        );
      }
      inputLines.push({
        speaker: (line.speaker || 'Person').trim(),
        vietnamese: line.vietnamese.trim(),
      });
    }

    if (inputLines.length > 20) {
      return NextResponse.json(
        { error: 'Too many lines (max 20)' },
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

    const userMessage = `Translate these Vietnamese conversation lines to English and provide romanization:

${inputLines.map((line, i) => `${i + 1}. [${line.speaker}]: "${line.vietnamese}"`).join('\n')}

Return the translations in the same order.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const result = JSON.parse(content);

    // Validate response structure
    if (!result.lines || !Array.isArray(result.lines)) {
      console.error('Invalid AI response structure:', result);
      throw new Error('Invalid AI response structure');
    }

    // Ensure we have the same number of lines
    if (result.lines.length !== inputLines.length) {
      console.error('AI returned different number of lines:', result.lines.length, 'vs', inputLines.length);
      // Try to work with what we got, padding if necessary
    }

    // Map results back, preserving original Vietnamese
    const outputLines: ConversationLineOutput[] = inputLines.map((input, i) => {
      const aiLine = result.lines[i] || {};
      return {
        speaker: aiLine.speaker || input.speaker,
        speaker_vi: aiLine.speaker_vi || input.speaker,
        vietnamese: input.vietnamese, // Always use original input
        english: aiLine.english || '',
        romanization: aiLine.romanization || '',
      };
    });

    const response: ConversationLinesResponse = {
      lines: outputLines,
      prompt_version: PROMPT_VERSION,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Conversation lines translation error:', error);

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
      { error: 'Failed to translate conversation lines' },
      { status: 500 }
    );
  }
}
