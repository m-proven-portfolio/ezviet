'use client';

import { useState, useEffect } from 'react';
import { Download, Share2, QrCode, Check } from 'lucide-react';

interface LabelActionsProps {
  slug: string;
  title: string;
}

export function LabelActions({ slug, title }: LabelActionsProps) {
  const [qrCode, setQrCode] = useState<string>('');
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const labelUrl = `https://ezviet.org/label/${slug}`;
  const printUrl = `/api/print/label/${slug}`;

  useEffect(() => {
    // Fetch QR code on demand
    if (showQR && !qrCode) {
      fetch(`/api/qr?url=${encodeURIComponent(labelUrl)}`)
        .then((res) => res.json())
        .then((data) => setQrCode(data.qrCode))
        .catch(console.error);
    }
  }, [showQR, labelUrl, qrCode]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(labelUrl);
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
          title: `${title} - Learn Vietnamese with EZViet`,
          url: labelUrl,
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
    <div className="mt-4">
      {/* Action Buttons - Icon only for minimal cognitive load */}
      <div className="flex justify-center gap-2">
        {/* Download Print Version */}
        <a
          href={printUrl}
          download={`ezviet-label-${slug}.png`}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
          title="Download for print"
        >
          <Download className="h-5 w-5" />
        </a>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
          title={copied ? 'Copied!' : 'Share link'}
        >
          {copied ? (
            <Check className="h-5 w-5 text-emerald-600" />
          ) : (
            <Share2 className="h-5 w-5" />
          )}
        </button>

        {/* Show QR */}
        <button
          onClick={() => setShowQR(!showQR)}
          className={`flex h-11 w-11 items-center justify-center rounded-xl border shadow-sm transition-colors ${
            showQR
              ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
          title="Show QR code"
        >
          <QrCode className="h-5 w-5" />
        </button>
      </div>

      {/* QR Code Display */}
      {showQR && (
        <div className="mt-6 flex flex-col items-center">
          <div className="rounded-2xl bg-white p-4 shadow-lg">
            {qrCode ? (
              <img src={qrCode} alt="QR Code" className="h-48 w-48" />
            ) : (
              <div className="flex h-48 w-48 items-center justify-center text-slate-400">
                Loading...
              </div>
            )}
          </div>
          <p className="mt-3 text-sm text-slate-500">Scan to open on mobile</p>
          <p className="mt-1 text-xs text-slate-400">{labelUrl}</p>
        </div>
      )}
    </div>
  );
}
