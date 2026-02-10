'use client';

/**
 * PresetSelector
 *
 * Visual card selector for intensity presets (Gentle/Standard/Intensive).
 * Shows each preset with icon, description, and key traits.
 */

import { Heart, Target, Flame, Check } from 'lucide-react';
import type { IntensityPreset } from '@/lib/intensity';
import { PRESET_METADATA } from '@/lib/intensity';

export interface PresetSelectorProps {
  value: IntensityPreset;
  onChange: (preset: IntensityPreset) => void;
  disabled?: boolean;
  hasCustomizations?: boolean;
}

const PRESET_ORDER: IntensityPreset[] = ['gentle', 'standard', 'intensive'];

// Map preset colors to Tailwind classes
const COLOR_CLASSES: Record<string, { bg: string; border: string; text: string }> = {
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-500',
    text: 'text-emerald-700',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    text: 'text-blue-700',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-500',
    text: 'text-orange-700',
  },
};

// Map icon names to components
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart,
  Target,
  Flame,
};

export function PresetSelector({
  value,
  onChange,
  disabled = false,
  hasCustomizations = false,
}: PresetSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {PRESET_ORDER.map((preset) => {
        const meta = PRESET_METADATA[preset];
        const colors = COLOR_CLASSES[meta.color];
        const IconComponent = ICONS[meta.icon];
        const isSelected = value === preset;

        return (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            disabled={disabled}
            className={`
              relative p-4 rounded-xl border-2 text-left transition-all
              ${
                isSelected
                  ? `${colors.bg} ${colors.border} ring-2 ring-offset-2 ring-${meta.color}-200`
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {/* Selected checkmark */}
            {isSelected && (
              <div
                className={`absolute top-2 right-2 w-5 h-5 rounded-full ${colors.text} bg-white flex items-center justify-center`}
              >
                <Check className="w-3 h-3" />
              </div>
            )}

            {/* Icon */}
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                isSelected ? colors.bg : 'bg-gray-100'
              }`}
            >
              {IconComponent && (
                <IconComponent
                  className={`w-5 h-5 ${isSelected ? colors.text : 'text-gray-500'}`}
                />
              )}
            </div>

            {/* Title */}
            <h3
              className={`font-semibold mb-1 ${
                isSelected ? colors.text : 'text-gray-900'
              }`}
            >
              {meta.title}
              {isSelected && hasCustomizations && (
                <span className="ml-2 text-xs font-normal text-amber-600">
                  (modified)
                </span>
              )}
            </h3>

            {/* Subtitle */}
            <p className="text-sm text-gray-500 mb-3">{meta.subtitle}</p>

            {/* Traits */}
            <ul className="space-y-1">
              {meta.traits.slice(0, 3).map((trait, idx) => (
                <li
                  key={idx}
                  className="text-xs text-gray-600 flex items-start gap-1"
                >
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>{trait}</span>
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
}

export default PresetSelector;
