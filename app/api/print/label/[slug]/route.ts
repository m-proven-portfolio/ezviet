import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createCanvas, loadImage, registerFont } from 'canvas';
import QRCode from 'qrcode';
import path from 'path';
import { createAdminClient } from '@/lib/supabase/server';

// Register DejaVu Sans (static TTF with Vietnamese support)
const fontPath = path.join(process.cwd(), 'public/fonts/DejaVuSans-Bold.ttf');
const fontPathRegular = path.join(process.cwd(), 'public/fonts/DejaVuSans.ttf');
try {
  registerFont(fontPath, { family: 'DejaVu Sans', weight: 'bold' });
  registerFont(fontPathRegular, { family: 'DejaVu Sans', weight: 'normal' });
} catch {
  // Font may already be registered
}

const CANVAS_WIDTH = 2048;
const CANVAS_HEIGHT = 2560; // Taller to fit legend

interface RouteParams {
  params: Promise<{ slug: string }>;
}

interface Label {
  id: string;
  x: number;
  y: number;
  vietnamese: string;
  english: string;
  pronunciation: string | null;
  sort_order: number;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const supabase = createAdminClient();

    // Fetch label set with labels
    const { data: labelSet, error } = await supabase
      .from('label_sets')
      .select(
        `
        *,
        labels:labels(
          id, x, y, vietnamese, english, pronunciation, sort_order
        )
      `
      )
      .eq('slug', slug)
      .single();

    if (error || !labelSet) {
      return NextResponse.json({ error: 'Label set not found' }, { status: 404 });
    }

    // Sort labels by sort_order
    const labels = (labelSet.labels as Label[]).sort((a, b) => a.sort_order - b.sort_order);

    if (labels.length === 0) {
      return NextResponse.json({ error: 'No labels in this set' }, { status: 400 });
    }

    // Fetch the image
    const imageResponse = await fetch(labelSet.image_url);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Generate QR code
    const qrUrl = `https://ezviet.org/label/${slug}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 180,
      margin: 0,
      color: { dark: '#374151', light: '#f9fafb' },
    });
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    // Calculate legend height based on number of labels
    const HEADER_HEIGHT = 200;
    const FOOTER_HEIGHT = 180;
    const LEGEND_ITEM_HEIGHT = 80;
    const LEGEND_COLS = 2;
    const LEGEND_ROWS = Math.ceil(labels.length / LEGEND_COLS);
    const LEGEND_HEIGHT = Math.max(LEGEND_ROWS * LEGEND_ITEM_HEIGHT + 80, 200);
    const IMAGE_AREA_HEIGHT = CANVAS_HEIGHT - HEADER_HEIGHT - LEGEND_HEIGHT - FOOTER_HEIGHT;

    // Create canvas
    const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    const ctx = canvas.getContext('2d');

    // ═══════════════════════════════════════════════════════════
    // LAYOUT
    // ═══════════════════════════════════════════════════════════
    // ┌────────────────────────────────────────────────────────┐
    // │              HEADER (title)                            │
    // ├────────────────────────────────────────────────────────┤
    // │                                                        │
    // │            [IMAGE with numbered markers]               │
    // │                                                        │
    // ├────────────────────────────────────────────────────────┤
    // │  Legend:                                               │
    // │  ① Đầu - Head     ② Tay - Arm                         │
    // │  ③ Chân - Leg     ④ Mắt - Eye                         │
    // ├────────────────────────────────────────────────────────┤
    // │        [QR]  ezviet.org  (footer)                     │
    // └────────────────────────────────────────────────────────┘

    // 1. WHITE BACKGROUND
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. HEADER
    const headerGradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, 0);
    headerGradient.addColorStop(0, '#ecfdf5');
    headerGradient.addColorStop(0.5, '#d1fae5');
    headerGradient.addColorStop(1, '#ecfdf5');
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, HEADER_HEIGHT);

    // Title
    ctx.fillStyle = '#064e3b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const titleFontSize = calculateFontSize(ctx, labelSet.title, CANVAS_WIDTH - 200, 100, 50);
    ctx.font = `bold ${titleFontSize}px 'DejaVu Sans', sans-serif`;
    ctx.fillText(labelSet.title, CANVAS_WIDTH / 2, HEADER_HEIGHT / 2);

    // 3. IMAGE WITH MARKERS
    const imgMeta = await sharp(imageBuffer).metadata();
    const maxImgWidth = CANVAS_WIDTH - 200;
    const maxImgHeight = IMAGE_AREA_HEIGHT - 80;
    let imgWidth = imgMeta.width || maxImgWidth;
    let imgHeight = imgMeta.height || maxImgHeight;
    const aspectRatio = imgWidth / imgHeight;

    // Scale to fit
    if (imgHeight > maxImgHeight) {
      imgHeight = maxImgHeight;
      imgWidth = imgHeight * aspectRatio;
    }
    if (imgWidth > maxImgWidth) {
      imgWidth = maxImgWidth;
      imgHeight = imgWidth / aspectRatio;
    }

    const resizedImg = await sharp(imageBuffer)
      .resize(Math.round(imgWidth), Math.round(imgHeight), { fit: 'inside' })
      .toBuffer();

    const img = await loadImage(resizedImg);
    const imgX = (CANVAS_WIDTH - imgWidth) / 2;
    const imgY = HEADER_HEIGHT + (IMAGE_AREA_HEIGHT - imgHeight) / 2;
    ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);

    // Draw numbered markers on image
    const MARKER_SIZE = 56;
    labels.forEach((label, index) => {
      const markerX = imgX + (label.x / 100) * imgWidth;
      const markerY = imgY + (label.y / 100) * imgHeight;

      // Circle background
      ctx.beginPath();
      ctx.arc(markerX, markerY, MARKER_SIZE / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6'; // blue-500
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Number
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 28px 'DejaVu Sans', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(index + 1), markerX, markerY);
    });

    // 4. LEGEND
    const legendY = HEADER_HEIGHT + IMAGE_AREA_HEIGHT;
    ctx.fillStyle = '#f8fafc'; // slate-50
    ctx.fillRect(0, legendY, CANVAS_WIDTH, LEGEND_HEIGHT);

    // Legend title
    ctx.fillStyle = '#334155'; // slate-700
    ctx.font = `bold 36px 'DejaVu Sans', sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('Vocabulary', 100, legendY + 50);

    // Legend items in 2 columns
    const LEGEND_START_Y = legendY + 90;
    const COL_WIDTH = (CANVAS_WIDTH - 200) / 2;

    labels.forEach((label, index) => {
      const col = index % LEGEND_COLS;
      const row = Math.floor(index / LEGEND_COLS);
      const itemX = 100 + col * COL_WIDTH;
      const itemY = LEGEND_START_Y + row * LEGEND_ITEM_HEIGHT;

      // Number circle
      ctx.beginPath();
      ctx.arc(itemX + 24, itemY + 24, 22, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 22px 'DejaVu Sans', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(index + 1), itemX + 24, itemY + 24);

      // Vietnamese text
      ctx.fillStyle = '#1e293b'; // slate-800
      ctx.font = `bold 32px 'DejaVu Sans', sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(label.vietnamese, itemX + 60, itemY + 4);

      // English text
      ctx.fillStyle = '#64748b'; // slate-500
      ctx.font = `28px 'DejaVu Sans', sans-serif`;
      ctx.fillText(label.english, itemX + 60, itemY + 42);
    });

    // 5. FOOTER
    const footerY = CANVAS_HEIGHT - FOOTER_HEIGHT;
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, footerY, CANVAS_WIDTH, FOOTER_HEIGHT);

    // Border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, footerY);
    ctx.lineTo(CANVAS_WIDTH - 100, footerY);
    ctx.stroke();

    // QR code
    const qrImg = await loadImage(qrBuffer);
    const qrSize = 120;
    const footerCenterY = footerY + FOOTER_HEIGHT / 2;
    const qrX = CANVAS_WIDTH / 2 - qrSize - 60;
    const qrY = footerCenterY - qrSize / 2;
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    // Brand
    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 40px "DejaVu Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('ezviet.org', qrX + qrSize + 30, footerCenterY);

    // Convert to PNG
    const finalImage = canvas.toBuffer('image/png');

    return new NextResponse(new Uint8Array(finalImage), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="ezviet-label-${slug}.png"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Print generation error:', error);
    return NextResponse.json({ error: 'Failed to generate print image' }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
