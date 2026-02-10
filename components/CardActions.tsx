'use client';

import { useState, useEffect } from 'react';
import { Download, Share2, QrCode, Check } from 'lucide-react';

interface CardActionsProps {
  slug: string;
}

export function CardActions({ slug }: CardActionsProps) {
  const [qrCode, setQrCode] = useState<string>('');
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const cardUrl = `https://ezviet.org/learn/${slug}`;
  const printUrl = `/api/print/${slug}`;

  useEffect(() => {
    // Fetch QR code on demand
    if (showQR && !qrCode) {
      fetch(`/api/qr?slug=${slug}`)
        .then(res => res.json())
        .then(data => setQrCode(data.qrCode))
        .catch(console.error);
    }
  }, [showQR, slug, qrCode]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(cardUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Learn Vietnamese with EZViet',
          url: cardUrl,
        });
      } catch (error) {
        // User cancelled or error
        console.error('Share failed:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="mt-8">
      {/* Action Buttons - Icon only for minimal cognitive load */}
      <div className="flex justify-center gap-2">
        {/* Download Print Version */}
        <a
          href={printUrl}
          download={`ezviet-${slug}.png`}
          className="w-11 h-11 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
          title="Download for print"
        >
          <Download className="w-5 h-5" />
        </a>

        {/* Share */}
        <button
          onClick={handleShare}
          className="w-11 h-11 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
          title={copied ? 'Copied!' : 'Share link'}
        >
          {copied ? (
            <Check className="w-5 h-5 text-emerald-600" />
          ) : (
            <Share2 className="w-5 h-5" />
          )}
        </button>

        {/* Show QR */}
        <button
          onClick={() => setShowQR(!showQR)}
          className={`w-11 h-11 flex items-center justify-center border rounded-xl shadow-sm transition-colors ${
            showQR
              ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
          title="Show QR code"
        >
          <QrCode className="w-5 h-5" />
        </button>
      </div>

      {/* QR Code Display */}
      {showQR && (
        <div className="mt-6 flex flex-col items-center">
          <div className="bg-white p-4 rounded-2xl shadow-lg">
            {qrCode ? (
              <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-gray-400">
                Loading...
              </div>
            )}
          </div>
          <p className="mt-3 text-sm text-gray-500">
            Scan to open on mobile
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {cardUrl}
          </p>
        </div>
      )}
    </div>
  );
}
