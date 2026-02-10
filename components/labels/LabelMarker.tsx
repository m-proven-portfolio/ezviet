'use client';

import type { Label, InteractiveMode } from '@/lib/labels/types';

interface LabelMarkerProps {
  label: Label;
  index: number;
  isExplored: boolean;
  isActive: boolean;
  onClick: () => void;
  mode: InteractiveMode;
}

export function LabelMarker({
  label,
  index,
  isExplored,
  isActive,
  onClick,
  mode,
}: LabelMarkerProps) {
  // Determine background color based on mode and state
  const getBackgroundClass = () => {
    if (mode === 'results') return 'bg-slate-400 cursor-default';
    if (mode === 'quiz') return 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500';
    if (isExplored) return 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500';
    return 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500';
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        absolute transform -translate-x-1/2 -translate-y-1/2
        w-8 h-8 md:w-10 md:h-10 rounded-full
        flex items-center justify-center
        font-bold text-sm md:text-base text-white
        transition-all duration-200
        shadow-lg hover:scale-110
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${getBackgroundClass()}
        ${isActive ? 'ring-4 ring-yellow-400 scale-110' : ''}
      `}
      style={{
        left: `${label.x}%`,
        top: `${label.y}%`,
      }}
      aria-label={`Label ${index + 1}: ${isExplored ? label.vietnamese : 'Click to reveal'}`}
    >
      {index + 1}
    </button>
  );
}
