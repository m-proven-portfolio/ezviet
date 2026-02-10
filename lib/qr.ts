import QRCode from 'qrcode';

/**
 * Generate QR code as data URL
 */
export async function generateQRCodeDataURL(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 200,
    margin: 2,
    color: {
      dark: '#1f2937',  // Gray-800
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });
}

/**
 * Generate QR code as SVG string
 */
export async function generateQRCodeSVG(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: 'svg',
    width: 200,
    margin: 2,
    color: {
      dark: '#1f2937',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });
}
