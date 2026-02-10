'use client';

import { useState } from 'react';
import { Check, AlertCircle, Edit3, X, Loader2 } from 'lucide-react';
import type { VoteType } from '@/lib/lrc-voting';

interface TimingFeedbackPromptProps {
  songId: string;
  songTitle: string;
  accuracyScore: number;
  onClose: () => void;
  onOpenEditor: () => void;
  onVoteSubmitted?: (voteType: VoteType) => void;
}

interface FeedbackOption {
  type: VoteType;
  icon: typeof Check;
  label: string;
  description: string;
  color: string;
  hoverColor: string;
  highlight?: boolean;
}

const feedbackOptions: FeedbackOption[] = [
  {
    type: 'accurate',
    icon: Check,
    label: 'Timing was great!',
    description: 'The lyrics matched the music perfectly',
    color: 'bg-green-500/20 border-green-500/50 text-green-300',
    hoverColor: 'hover:bg-green-500/30',
  },
  {
    type: 'inaccurate',
    icon: AlertCircle,
    label: 'Could be better',
    description: 'Some lines were a bit off',
    color: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300',
    hoverColor: 'hover:bg-yellow-500/30',
  },
  {
    type: 'edit',
    icon: Edit3,
    label: 'I want to fix it!',
    description: 'Open the timeline editor',
    color: 'bg-purple-500/20 border-purple-500/50 text-purple-300',
    hoverColor: 'hover:bg-purple-500/30 hover:scale-[1.02]',
    highlight: true,
  },
];

export function TimingFeedbackPrompt({
  songId,
  songTitle,
  accuracyScore,
  onClose,
  onOpenEditor,
  onVoteSubmitted,
}: TimingFeedbackPromptProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async (option: FeedbackOption) => {
    if (option.type === 'edit') {
      // Open editor directly without submitting vote yet
      onOpenEditor();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/lrc-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songId,
          voteType: option.type,
          accuracyScore,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'ALREADY_VOTED') {
          // Already voted today - not an error, just close
          setSubmitted(true);
        } else {
          throw new Error(data.error || 'Failed to submit vote');
        }
      } else {
        setSubmitted(true);
        onVoteSubmitted?.(option.type);
      }

      // Auto-close after brief thank you message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-green-900/90 to-emerald-950/90 rounded-2xl p-8 max-w-sm w-full text-center animate-in fade-in zoom-in duration-200">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Thanks!</h3>
          <p className="text-green-300/80">Your feedback helps improve the experience.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-purple-900/95 to-indigo-950/95 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/40 hover:text-white/80 transition-colors"
          aria-label="Skip feedback"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white mb-2">How was the timing?</h2>
          <p className="text-purple-300/80 text-sm truncate">
            {songTitle} • Your accuracy: {accuracyScore.toFixed(0)}%
          </p>
        </div>

        {/* Feedback options */}
        <div className="space-y-3 mb-4">
          {feedbackOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.type}
                onClick={() => handleVote(option)}
                disabled={isSubmitting}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border ${option.color} ${option.hoverColor} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${option.highlight ? 'ring-1 ring-purple-400/50' : ''}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${option.type === 'accurate' ? 'bg-green-500/30' : option.type === 'inaccurate' ? 'bg-yellow-500/30' : 'bg-purple-500/30'}`}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-white">{option.label}</div>
                  <div className="text-sm opacity-70">{option.description}</div>
                </div>
                {option.highlight && (
                  <span className="px-2 py-1 text-xs bg-purple-500/30 text-purple-200 rounded-full">
                    Earn pts
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="text-center text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Skip link */}
        <button
          onClick={onClose}
          className="w-full text-center text-white/40 hover:text-white/60 text-sm py-2 transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
