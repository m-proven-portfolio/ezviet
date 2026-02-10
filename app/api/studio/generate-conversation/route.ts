import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GeneratedDialogue {
  speaker: 'buyer' | 'seller';
  vietnamese: string;
  english: string;
  position: 'left' | 'right';
}

interface ConversationResponse {
  dialogues: GeneratedDialogue[];
  suggestedTitle: string;
  suggestedLayoutStyle: 'comic-strip' | 'side-by-side' | 'illustrated-scene' | 'chat-bubbles';
}

const SYSTEM_PROMPT = `You are a Vietnamese language expert creating realistic market conversations for language learners.

## YOUR TASK
Generate natural buyer-seller conversations in Vietnamese with English translations. These are for educational flashcard books teaching Vietnamese to English speakers.

## CONVERSATION GUIDELINES
1. Keep it simple and practical - these are for beginners/intermediate learners
2. Use common market phrases and vocabulary
3. Include greetings, questions about price, and polite responses
4. The seller should be friendly and helpful (typical Vietnamese market vendor)
5. Include numbers and prices when relevant
6. Use Southern Vietnamese dialect (most common for learners)

## SPEAKER ROLES
- "buyer" = Customer/Tourist asking questions (position: "left")
- "seller" = Vendor/Shop owner responding (position: "right")

## OUTPUT FORMAT
Return EXACTLY this JSON structure:
{
  "dialogues": [
    {
      "speaker": "buyer" | "seller",
      "vietnamese": "Vietnamese text with diacritics",
      "english": "English translation",
      "position": "left" | "right"
    }
  ],
  "suggestedTitle": "A short title for this conversation scene",
  "suggestedLayoutStyle": "comic-strip"
}

## LAYOUT STYLE RECOMMENDATIONS
- "comic-strip" - Best for 3-6 exchanges with action (most common)
- "side-by-side" - Good for longer conversations with detailed responses
- "illustrated-scene" - Best for 2-4 short exchanges
- "chat-bubbles" - Simple, quick back-and-forth

## EXAMPLES OF GOOD CONVERSATIONS

Topic: "Buying bananas"
{
  "dialogues": [
    {"speaker": "buyer", "vietnamese": "Chị ơi, chuối bao nhiêu tiền một nải?", "english": "Excuse me, how much is a bunch of bananas?", "position": "left"},
    {"speaker": "seller", "vietnamese": "Mười lăm ngàn một nải, em.", "english": "15,000 dong per bunch.", "position": "right"},
    {"speaker": "buyer", "vietnamese": "Cho em một nải nhé.", "english": "I'll take one bunch, please.", "position": "left"},
    {"speaker": "seller", "vietnamese": "Dạ, cảm ơn em!", "english": "Yes, thank you!", "position": "right"}
  ],
  "suggestedTitle": "Buying Bananas",
  "suggestedLayoutStyle": "comic-strip"
}

Respond ONLY with valid JSON.`;

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated and admin
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { topic, vocabularyWords, exchangeCount = 4 } = body;

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Build the user prompt
    let userPrompt = `Generate a ${exchangeCount}-exchange conversation about: "${topic}"`;

    if (vocabularyWords && Array.isArray(vocabularyWords) && vocabularyWords.length > 0) {
      userPrompt += `\n\nTry to naturally include these vocabulary words: ${vocabularyWords.join(', ')}`;
    }

    // Generate conversation with GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7, // Slightly higher for natural variation
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const result = JSON.parse(content) as ConversationResponse;

    // Validate response structure
    if (!result.dialogues || !Array.isArray(result.dialogues) || result.dialogues.length === 0) {
      console.error('Invalid AI response structure:', result);
      throw new Error('Invalid AI response structure');
    }

    // Validate each dialogue line
    for (const dialogue of result.dialogues) {
      if (!dialogue.speaker || !dialogue.vietnamese || !dialogue.english) {
        throw new Error('Invalid dialogue structure');
      }
    }

    return NextResponse.json(result);
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
      return NextResponse.json(
        { error: `OpenAI error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate conversation' },
      { status: 500 }
    );
  }
}
