/**
 * Image resize utility for automatic image optimization
 *
 * Resizes uploaded images to optimal dimensions based on their intended use.
 * Uses canvas API for client-side resizing before upload.
 */

export type ImageContext =
  | 'vocab'    // 400x400 - vocabulary cards, small squares
  | 'scene'    // 1200x600 - background scenes, wide format
  | 'intro'    // 800x1000 - intro page illustrations, portrait
  | 'header'   // 1200x400 - banner headers
  | 'original'; // Keep original size

interface ImageDimensions {
  width: number;
  height: number;
}

export const IMAGE_DIMENSIONS: Record<Exclude<ImageContext, 'original'>, ImageDimensions> = {
  vocab: { width: 400, height: 400 },
  scene: { width: 1200, height: 600 },
  intro: { width: 800, height: 1000 },
  header: { width: 1200, height: 400 },
};

/**
 * Resizes an image file to the optimal dimensions for its context.
 * Uses smart cropping - centers the image and crops to fit the target aspect ratio.
 *
 * @param file - The original image file
 * @param context - The image context determining target dimensions
 * @returns A promise resolving to a new File with the resized image
 */
export async function resizeImage(
  file: File,
  context: ImageContext
): Promise<File> {
  // Skip resizing for 'original' context
  if (context === 'original') {
    return file;
  }

  const target = IMAGE_DIMENSIONS[context];

  // Load the image
  const img = await loadImage(file);

  // If image is already smaller than target in both dimensions, keep original
  if (img.width <= target.width && img.height <= target.height) {
    return file;
  }

  // Calculate the crop and scale parameters
  const { sourceX, sourceY, sourceWidth, sourceHeight } = calculateCrop(
    img.width,
    img.height,
    target.width,
    target.height
  );

  // Create canvas and resize
  const canvas = document.createElement('canvas');
  canvas.width = target.width;
  canvas.height = target.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Use high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw the cropped and scaled image
  ctx.drawImage(
    img,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    target.width,
    target.height
  );

  // Convert canvas to blob
  const blob = await canvasToBlob(canvas, file.type);

  // Create new file with the same name
  const ext = file.name.split('.').pop() || 'jpg';
  const baseName = file.name.replace(/\.[^.]+$/, '');
  const newFileName = `${baseName}-${context}.${ext}`;

  return new File([blob], newFileName, { type: file.type });
}

/**
 * Loads an image file into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculates crop parameters for center-crop resizing.
 * This ensures the image fills the target dimensions with minimal cropping.
 */
function calculateCrop(
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number
): { sourceX: number; sourceY: number; sourceWidth: number; sourceHeight: number } {
  const srcAspect = srcWidth / srcHeight;
  const targetAspect = targetWidth / targetHeight;

  let sourceWidth: number;
  let sourceHeight: number;
  let sourceX: number;
  let sourceY: number;

  if (srcAspect > targetAspect) {
    // Source is wider than target - crop the sides
    sourceHeight = srcHeight;
    sourceWidth = srcHeight * targetAspect;
    sourceX = (srcWidth - sourceWidth) / 2;
    sourceY = 0;
  } else {
    // Source is taller than target - crop top and bottom
    sourceWidth = srcWidth;
    sourceHeight = srcWidth / targetAspect;
    sourceX = 0;
    sourceY = (srcHeight - sourceHeight) / 2;
  }

  return { sourceX, sourceY, sourceWidth, sourceHeight };
}

/**
 * Converts a canvas to a Blob
 */
function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      mimeType,
      0.9 // High quality
    );
  });
}

/**
 * Get a human-readable description of the image dimensions for a context
 */
export function getImageContextDescription(context: ImageContext): string {
  switch (context) {
    case 'vocab':
      return '400×400px (square)';
    case 'scene':
      return '1200×600px (wide)';
    case 'intro':
      return '800×1000px (portrait)';
    case 'header':
      return '1200×400px (banner)';
    case 'original':
      return 'Original size';
  }
}
