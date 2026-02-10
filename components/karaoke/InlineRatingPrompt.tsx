'use client';

import { useState } from 'react';
import { Check, AlertCircle, Edit3, Loader2 } from 'lucide-react';
import type { VoteType } from '@/lib/lrc-voting';

interface InlineRatingPromptProps {
  songId: string;
  accuracyScore: number;
  onRate: (voteType: VoteType) => void;
  onOpenEditor?: () => void;
}

interface RatingOption {
  type: VoteType;
  icon: typeof Check;
  label: string;
  shortLabel: string;
  bgColor: string;
  hoverColor: string;
  iconBg: string;
}

const ratingOptions: RatingOption[] = [
  {
    type: 'accurate',
    icon: Check,
    label: 'Timing was great!',
    shortLabel: 'Great!',
    bgColor: 'bg-green-500/20 border-green-500/40',
    hoverColor: 'hover:bg-green-500/30 hover:border-green-500/60',
    iconBg: 'bg-green-500/30 text-green-300',
  },
  {
    type: 'inaccurate',
    icon: AlertCircle,
    label: 'Could be better',
    shortLabel: 'Off',
    bgColor: 'bg-yellow-500/20 border-yellow-500/40',
    hoverColor: 'hover:bg-yellow-500/30 hover:border-yellow-500/60',
    iconBg: 'bg-yellow-500/30 text-yellow-300',
  },
  {
    type: 'edit',
    icon: Edit3,
    label: "I'll fix it!",
    shortLabel: 'Fix it',
    bgColor: 'bg-purple-500/20 border-purple-500/40',
    hoverColor: 'hover:bg-purple-500/30 hover:border-purple-500/60',
    iconBg: 'bg-purple-500/30 text-purple-300',
  },
];

export function InlineRatingPrompt({
  songId,
  accuracyScore,
  onRate,
  onOpenEditor,
}: InlineRatingPromptProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<VoteType | null>(null);

  const handleSelect = async (option: RatingOption) => {
    if (isSubmitting) return;

    // If user wants to edit, open editor directly without revealing stats
    // The editor flow handles everything from here
    if (option.type === 'edit') {
      onOpenEditor?.();
      return;
    }

    setSelectedType(option.type);
    setIsSubmitting(true);

    try {
      // Submit vote to API
      await fetch('/api/lrc-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songId,
          voteType: option.type,
          accuracyScore,
        }),
      });
      // Even if vote fails (already voted), we proceed
      onRate(option.type);
    } catch {
      // Still proceed on error - rating gate shouldn't block user
      onRate(option.type);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <p className="text-white/70 text-sm mb-3 text-center">
        How was the timing sync?
      </p>
      <div className="flex gap-2">
        {ratingOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedType === option.type;
          const isLoading = isSubmitting && isSelected;

          return (
            <button
              key={option.type}
              onClick={() => handleSelect(option)}
              disabled={isSubmitting}
              className={`
                flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border
                transition-all duration-200 disabled:opacity-60
                ${option.bgColor} ${option.hoverColor}
                ${isSelected ? 'ring-2 ring-white/30 scale-[0.98]' : ''}
              `}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${option.iconBg}`}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span className="text-white text-xs font-medium">
                {option.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
