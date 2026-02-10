import { NextRequest, NextResponse } from 'next/server';
import { translateFruit } from '@/lib/translate';

export async function POST(request: NextRequest) {
    try {
        const { vietnamese } = await request.json();

        if (!vietnamese) {
            return NextResponse.json(
                { error: 'Vietnamese text required' },
                { status: 400 }
            );
        }

        const translation = translateFruit(vietnamese);

        return NextResponse.json({ english: translation });
    } catch (error) {
        console.error('Translation error:', error);
        return NextResponse.json(
            { error: 'Translation failed' },
            { status: 500 }
        );
    }
}
