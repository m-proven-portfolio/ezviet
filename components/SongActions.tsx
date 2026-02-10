'use client';

import { useState, useEffect } from 'react';
import { Share2, QrCode, Check, Download } from 'lucide-react';

interface SongActionsProps {
  cardSlug: string;
  songSlug: string;
  songId: string;
}

export function SongActions({ cardSlug, songSlug, songId }: SongActionsProps) {
  const [qrCode, setQrCode] = useState<string>('');
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const songUrl = `https://ezviet.org/learn/${cardSlug}/songs/${songSlug}`;

  useEffect(() => {
    // Fetch QR code on demand
    if (showQR && !qrCode) {
      // Generate QR for the song URL
      fetch(`/api/qr?url=${encodeURIComponent(songUrl)}`)
        .then(res => res.json())
        .then(data => setQrCode(data.qrCode))
        .catch(console.error);
    }
  }, [showQR, songUrl, qrCode]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(songUrl);
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
          url: songUrl,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="flex justify-center gap-2">
      {/* Download MP3 */}
      <a
        href={`/api/songs/${songId}/download`}
        className="w-11 h-11 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
        title="Download MP3"
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
            ? 'bg-purple-100 border-purple-200 text-purple-700'
            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
        title="Show QR code"
      >
        <QrCode className="w-5 h-5" />
      </button>

      {/* QR Code Display */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowQR(false)}>
          <div className="bg-white p-6 rounded-2xl shadow-xl" onClick={e => e.stopPropagation()}>
            {qrCode ? (
              <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-gray-400">
                Loading...
              </div>
            )}
            <p className="mt-3 text-sm text-gray-500 text-center">
              Scan to open song
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
