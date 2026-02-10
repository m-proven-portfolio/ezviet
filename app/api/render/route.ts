import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';

// Register DejaVu Sans (static TTF with Vietnamese support)
const fontPath = path.join(process.cwd(), 'public/fonts/DejaVuSans-Bold.ttf');
registerFont(fontPath, { family: 'DejaVu Sans' });

const CANVAS_SIZE = 2048;
const TOP_HEIGHT = Math.floor(CANVAS_SIZE * 0.10);
const MIDDLE_HEIGHT = Math.floor(CANVAS_SIZE * 0.80);
const BOTTOM_HEIGHT = CANVAS_SIZE - TOP_HEIGHT - MIDDLE_HEIGHT;

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const imageFile = formData.get('image') as File;
        const vietnamese = formData.get('vi') as string;
        const english = formData.get('en') as string;

        if (!imageFile || !vietnamese || !english) {
            return NextResponse.json(
                { error: 'Missing required fields: image, vi, en' },
                { status: 400 }
            );
        }

        // Read uploaded image
        const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        const imageMetadata = await sharp(imageBuffer).metadata();

        // Calculate photo dimensions - prioritize HEIGHT to make photo as large as possible
        const targetHeight = Math.floor(MIDDLE_HEIGHT * 0.99);
        const maxWidth = Math.floor(CANVAS_SIZE * 0.95);

        let photoWidth = imageMetadata.width || CANVAS_SIZE;
        let photoHeight = imageMetadata.height || CANVAS_SIZE;
        const aspectRatio = photoWidth / photoHeight;

        photoHeight = targetHeight;
        photoWidth = Math.floor(photoHeight * aspectRatio);

        if (photoWidth > maxWidth) {
            photoWidth = maxWidth;
            photoHeight = Math.floor(photoWidth / aspectRatio);
        }

        // Resize the uploaded photo
        const resizedPhotoBuffer = await sharp(imageBuffer)
            .resize(photoWidth, photoHeight, { fit: 'inside' })
            .toBuffer();

        // Create canvas
        const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
        const ctx = canvas.getContext('2d');

        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // Draw the image
        const photoX = Math.floor((CANVAS_SIZE - photoWidth) / 2);
        const photoY = TOP_HEIGHT + Math.floor((MIDDLE_HEIGHT - photoHeight) / 2);
        const img = await loadImage(resizedPhotoBuffer);
        ctx.drawImage(img, photoX, photoY, photoWidth, photoHeight);

        // Calculate font sizes
        const maxTextWidth = CANVAS_SIZE * 0.9; // 5% margin on each side
        const vnFontSize = calculateFontSize(ctx, vietnamese, maxTextWidth, 190, 80);
        const enFontSize = calculateFontSize(ctx, english, maxTextWidth, 190, 80);

        // Text vertical positions - closer to image, using 85% for top and 15% for bottom
        const topTextY = TOP_HEIGHT * 0.85; // 85% down from top (much closer to image)
        const bottomTextY = TOP_HEIGHT + MIDDLE_HEIGHT + (BOTTOM_HEIGHT * 0.15); // 15% from bottom (much closer to image)

        // Draw Vietnamese text
        drawText(ctx, vietnamese, vnFontSize, CANVAS_SIZE / 2, topTextY);

        // Draw English text
        drawText(ctx, english, enFontSize, CANVAS_SIZE / 2, bottomTextY);

        // Convert canvas to PNG buffer
        const finalImage = canvas.toBuffer('image/png');

        return new NextResponse(new Uint8Array(finalImage), {
            headers: {
                'Content-Type': 'image/png',
                'Content-Disposition': `attachment; filename="flashcard-${Date.now()}.png"`,
            },
        });
    } catch (error) {
        console.error('Error generating flashcard:', error);
        return NextResponse.json(
            { error: 'Failed to generate flashcard' },
            { status: 500 }
        );
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

function drawText(
    ctx: any,
    text: string,
    fontSize: number,
    x: number,
    y: number
): void {
    ctx.font = `bold ${fontSize}px 'DejaVu Sans', sans-serif`;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
}
