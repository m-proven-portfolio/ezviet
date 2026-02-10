'use client';

import { useRef, useCallback } from 'react';
import { Volume2, ExternalLink, X } from 'lucide-react';
import Link from 'next/link';
import type { Label } from '@/lib/labels/types';

interface LabelTooltipProps {
  label: Label;
  onClose: () => void;
  onPlayAudio?: () => void;
}

export function LabelTooltip({ label, onClose, onPlayAudio }: LabelTooltipProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayAudio = useCallback(() => {
    if (onPlayAudio) {
      onPlayAudio();
      return;
    }

    // If we have an audio URL, play it directly
    if (label.audio_url) {
      if (!audioRef.current) {
        audioRef.current = new Audio(label.audio_url);
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }
  }, [label.audio_url, onPlayAudio]);

  const hasAudio = !!label.audio_url || !!onPlayAudio;
  const hasLinkedCard = !!label.card_id;

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-4 min-w-64 max-w-80 animate-fade-in">
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="Close"
      >
        <X size={16} />
      </button>

      {/* Vietnamese word */}
      <div className="mb-3">
        <p className="text-2xl font-bold text-slate-800">{label.vietnamese}</p>
        {label.pronunciation && (
          <p className="text-sm text-slate-500 italic">/{label.pronunciation}/</p>
        )}
      </div>

      {/* English translation */}
      <p className="text-lg text-slate-600 mb-4">{label.english}</p>

      {/* Actions */}
      <div className="flex gap-2">
        {hasAudio && (
          <button
            type="button"
            onClick={handlePlayAudio}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            <Volume2 size={18} />
            Listen
          </button>
        )}

        {hasLinkedCard && (
          <Link
            href={`/learn/${label.card_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
          >
            <ExternalLink size={18} />
            Learn More
          </Link>
        )}
      </div>

      {/* Hints (if available) */}
      {label.hints && label.hints.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-400 mb-1">Hints:</p>
          <ul className="text-sm text-slate-500 list-disc list-inside">
            {label.hints.map((hint, i) => (
              <li key={i}>{hint}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
