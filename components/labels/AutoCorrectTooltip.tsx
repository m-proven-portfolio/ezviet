'use client';

import { Check, X } from 'lucide-react';

interface AutoCorrectTooltipProps {
  userAnswer: string;
  correctSpelling: string;
  onDismiss: () => void;
}

/**
 * Tooltip shown when user's answer is accepted via diacritic-insensitive match
 * Educates the user about proper spelling with tone marks
 */
export function AutoCorrectTooltip({
  userAnswer,
  correctSpelling,
  onDismiss,
}: AutoCorrectTooltipProps) {
  return (
    <div className="animate-fade-in rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4 shadow-lg">
      <div className="flex items-start gap-3">
        {/* Success icon */}
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-5 w-5 text-emerald-600" />
        </div>

        <div className="flex-1">
          {/* Success message */}
          <p className="font-semibold text-emerald-800">Correct!</p>

          {/* Proper spelling */}
          <p className="mt-1 text-sm text-emerald-700">
            The proper spelling is:{' '}
            <span className="text-lg font-bold">{correctSpelling}</span>
          </p>

          {/* User's answer comparison */}
          <p className="mt-2 text-xs text-emerald-600">
            You typed: &ldquo;{userAnswer}&rdquo; — close enough! Try adding the
            tone marks next time.
          </p>
        </div>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={onDismiss}
          className="flex-shrink-0 rounded-lg p-1 text-emerald-400 hover:bg-emerald-100 hover:text-emerald-600"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
