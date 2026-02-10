import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createCanvas, loadImage, registerFont } from 'canvas';
import QRCode from 'qrcode';
import path from 'path';
import { createAdminClient } from '@/lib/supabase/server';
import { getStorageUrl } from '@/lib/utils';

// Register DejaVu Sans (static TTF with Vietnamese support)
const fontPath = path.join(process.cwd(), 'public/fonts/DejaVuSans-Bold.ttf');
const fontPathRegular = path.join(process.cwd(), 'public/fonts/DejaVuSans.ttf');
try {
  registerFont(fontPath, { family: 'DejaVu Sans', weight: 'bold' });
  registerFont(fontPathRegular, { family: 'DejaVu Sans', weight: 'normal' });
} catch {
  // Font may already be registered
}

const CANVAS_SIZE = 2048;

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const supabase = createAdminClient();

    // Fetch card with terms
    const { data: card, error } = await supabase
      .from('cards')
      .select(`
        *,
        terms:card_terms(*)
      `)
      .eq('slug', slug)
      .single();

    if (error || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Type assertion for the joined query result
    const cardData = card as { terms: Array<{ lang: string; region: string | null; text: string; romanization: string | null }>; image_path: string; slug: string };

    const viTerm = cardData.terms.find((t) => t.lang === 'vi' && t.region === 'south');
    const enTerm = cardData.terms.find((t) => t.lang === 'en');

    if (!viTerm || !enTerm) {
      return NextResponse.json({ error: 'Card terms incomplete' }, { status: 400 });
    }

    // Fetch the card image from Supabase storage
    const imageUrl = getStorageUrl('cards-images', cardData.image_path);
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Generate QR code
    const qrUrl = `https://ezviet.org/learn/${slug}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 180,
      margin: 0,
      color: { dark: '#374151', light: '#f9fafb' },
    });
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    // Create canvas
    const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    const ctx = canvas.getContext('2d');

    // ═══════════════════════════════════════════════════════════
    // BEAUTIFUL CENTERED LAYOUT
    // ═══════════════════════════════════════════════════════════
    //
    // ┌────────────────────────────────────────────────────────┐
    // │              HEADER (emerald gradient)                 │
    // │                    Ổi                                  │
    // │               /oy (flat)/                              │
    // ├────────────────────────────────────────────────────────┤
    // │                                                        │
    // │                    [IMAGE]                             │
    // │                   centered                             │
    // │                                                        │
    // ├────────────────────────────────────────────────────────┤
    // │                    Guava                               │
    // │                  (centered)                            │
    // ├────────────────────────────────────────────────────────┤
    // │        [QR]  ezviet.org  (footer bar)                 │
    // └────────────────────────────────────────────────────────┘

    // Layout dimensions
    const HEADER_HEIGHT = 340;
    const FOOTER_HEIGHT = 200;
    const ENGLISH_HEIGHT = 200;
    const IMAGE_AREA_HEIGHT = CANVAS_SIZE - HEADER_HEIGHT - ENGLISH_HEIGHT - FOOTER_HEIGHT;

    // ─────────────────────────────────────────────────────────
    // 1. WHITE BACKGROUND
    // ─────────────────────────────────────────────────────────
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // ─────────────────────────────────────────────────────────
    // 2. HEADER - Emerald gradient bar
    // ─────────────────────────────────────────────────────────
    const headerGradient = ctx.createLinearGradient(0, 0, CANVAS_SIZE, 0);
    headerGradient.addColorStop(0, '#ecfdf5');   // emerald-50
    headerGradient.addColorStop(0.5, '#d1fae5'); // emerald-100
    headerGradient.addColorStop(1, '#ecfdf5');   // emerald-50
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, CANVAS_SIZE, HEADER_HEIGHT);

    // Vietnamese text - centered in header
    ctx.fillStyle = '#064e3b'; // emerald-900
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const vnFontSize = calculateFontSize(ctx, viTerm.text, CANVAS_SIZE - 200, 160, 80);
    ctx.font = `bold ${vnFontSize}px 'DejaVu Sans', sans-serif`;

    // Position Vietnamese text
    const hasRomanization = viTerm.romanization && viTerm.romanization.trim().length > 0;
    const vnY = hasRomanization ? HEADER_HEIGHT * 0.38 : HEADER_HEIGHT * 0.5;
    ctx.fillText(viTerm.text, CANVAS_SIZE / 2, vnY);

    // Romanization - below Vietnamese
    if (hasRomanization) {
      ctx.fillStyle = '#047857'; // emerald-700
      const romFontSize = Math.min(vnFontSize * 0.45, 70);
      ctx.font = `${romFontSize}px 'DejaVu Sans', sans-serif`;
      ctx.fillText(`/${viTerm.romanization}/`, CANVAS_SIZE / 2, vnY + vnFontSize * 0.75);
    }

    // ─────────────────────────────────────────────────────────
    // 3. IMAGE - Centered in middle area
    // ─────────────────────────────────────────────────────────
    const imgMeta = await sharp(imageBuffer).metadata();
    const maxImgSize = Math.min(IMAGE_AREA_HEIGHT - 80, CANVAS_SIZE - 200);
    let imgWidth = imgMeta.width || maxImgSize;
    let imgHeight = imgMeta.height || maxImgSize;
    const aspectRatio = imgWidth / imgHeight;

    // Scale to fit
    if (imgHeight > maxImgSize) {
      imgHeight = maxImgSize;
      imgWidth = imgHeight * aspectRatio;
    }
    if (imgWidth > maxImgSize) {
      imgWidth = maxImgSize;
      imgHeight = imgWidth / aspectRatio;
    }

    const resizedImg = await sharp(imageBuffer)
      .resize(Math.round(imgWidth), Math.round(imgHeight), { fit: 'inside' })
      .toBuffer();

    const img = await loadImage(resizedImg);
    const imgX = (CANVAS_SIZE - imgWidth) / 2;
    const imgY = HEADER_HEIGHT + (IMAGE_AREA_HEIGHT - imgHeight) / 2;
    ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);

    // ─────────────────────────────────────────────────────────
    // 4. ENGLISH TEXT - Centered below image
    // ─────────────────────────────────────────────────────────
    const englishY = HEADER_HEIGHT + IMAGE_AREA_HEIGHT + ENGLISH_HEIGHT * 0.5;

    ctx.fillStyle = '#1f2937'; // gray-800
    const enFontSize = calculateFontSize(ctx, enTerm.text, CANVAS_SIZE - 200, 120, 60);
    ctx.font = `bold ${enFontSize}px 'DejaVu Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(enTerm.text, CANVAS_SIZE / 2, englishY);

    // ─────────────────────────────────────────────────────────
    // 5. FOOTER - QR code + branding
    // ─────────────────────────────────────────────────────────
    const footerY = CANVAS_SIZE - FOOTER_HEIGHT;

    // Subtle footer background
    ctx.fillStyle = '#f9fafb'; // gray-50
    ctx.fillRect(0, footerY, CANVAS_SIZE, FOOTER_HEIGHT);

    // Subtle top border
    ctx.strokeStyle = '#e5e7eb'; // gray-200
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, footerY);
    ctx.lineTo(CANVAS_SIZE - 100, footerY);
    ctx.stroke();

    // QR code - left of center
    const qrImg = await loadImage(qrBuffer);
    const qrSize = 140;
    const footerCenterY = footerY + FOOTER_HEIGHT / 2;
    const qrX = CANVAS_SIZE / 2 - qrSize - 60;
    const qrY = footerCenterY - qrSize / 2;
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    // Brand text - right of QR
    ctx.fillStyle = '#6b7280'; // gray-500
    ctx.font = 'bold 48px "DejaVu Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('ezviet.org', qrX + qrSize + 40, footerCenterY);

    // Convert to PNG
    const finalImage = canvas.toBuffer('image/png');

    return new NextResponse(new Uint8Array(finalImage), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="ezviet-${slug}.png"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Print generation error:', error);
    return NextResponse.json({ error: 'Failed to generate print image' }, { status: 500 });
  }
}

function calculateFontSize(
  ctx: any,
  text: string,
  maxWidth: number,
  maxFontSize: number,
  minFontSize: number
): number {
  let fontSize = maxFontSize;

  while (fontSize >= minFontSize) {
    ctx.font = `bold ${fontSize}px 'DejaVu Sans', sans-serif`;
    const metrics = ctx.measureText(text);
    if (metrics.width <= maxWidth) {
      return fontSize;
    }
    fontSize -= 5;
  }

  return minFontSize;
}
