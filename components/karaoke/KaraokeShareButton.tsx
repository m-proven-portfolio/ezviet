'use client';

import { useState } from 'react';
import { Share2, Check, Link2 } from 'lucide-react';

interface KaraokeShareButtonProps {
  /** Share title for native share dialog */
  title: string;
  /** Share text/description */
  text: string;
  /** URL to share */
  url: string;
  /** Visual variant */
  variant?: 'icon' | 'button' | 'inline';
  /** Custom class name */
  className?: string;
}

export function KaraokeShareButton({
  title,
  text,
  url,
  variant = 'icon',
  className = '',
}: KaraokeShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
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
          title,
          text,
          url,
        });
      } catch (error) {
        // User cancelled share or error occurred
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
          // Fallback to copy
          handleCopyLink();
        }
      }
    } else {
      // Fallback for browsers without Web Share API
      handleCopyLink();
    }
  };

  if (variant === 'icon') {
    return (
      <div className="relative flex items-center gap-1">
        <button
          onClick={handleShare}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors ${className}`}
          aria-label="Share"
        >
          <Share2 className="w-5 h-5" />
        </button>
        <button
          onClick={handleCopyLink}
          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Copy link"
        >
          {copied ? (
            <Check className="w-5 h-5 text-emerald-400" />
          ) : (
            <Link2 className="w-5 h-5" />
          )}
        </button>
        {showTooltip && !copied && (
          <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap z-50">
            Share
          </div>
        )}
        {copied && (
          <div className="absolute top-full mt-1 right-0 px-2 py-1 bg-emerald-600 text-white text-xs rounded whitespace-nowrap z-50">
            Link copied!
          </div>
        )}
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <button
        onClick={handleShare}
        className={`flex items-center justify-center gap-2 px-4 py-3 bg-white/15 text-white font-medium rounded-xl border border-white/20 hover:bg-white/25 transition-all ${className}`}
      >
        {copied ? (
          <>
            <Check className="w-5 h-5 text-emerald-400" />
            Copied!
          </>
        ) : (
          <>
            <Share2 className="w-5 h-5" />
            Share
          </>
        )}
      </button>
    );
  }

  // Inline variant - two buttons side by side
  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        onClick={handleShare}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-400 hover:to-purple-500 transition-all shadow-lg"
      >
        <Share2 className="w-5 h-5" />
        Share Score
      </button>
      <button
        onClick={handleCopyLink}
        className="flex items-center justify-center gap-2 px-4 py-3 bg-white/15 text-white font-medium rounded-xl border border-white/20 hover:bg-white/25 transition-all"
        title="Copy link"
      >
        {copied ? (
          <Check className="w-5 h-5 text-emerald-400" />
        ) : (
          <Link2 className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
