import { NextRequest, NextResponse } from 'next/server';
import { generateQRCodeDataURL } from '@/lib/qr';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const urlParam = searchParams.get('url');

  // Accept either slug (for cards) or url (for songs/other pages)
  if (!slug && !urlParam) {
    return NextResponse.json({ error: 'Missing slug or url parameter' }, { status: 400 });
  }

  try {
    const url = urlParam || `https://ezviet.org/learn/${slug}`;
    const qrDataUrl = await generateQRCodeDataURL(url);

    return NextResponse.json({
      url,
      qrCode: qrDataUrl,
    });
  } catch (error) {
    console.error('QR generation error:', error);
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
  }
}
