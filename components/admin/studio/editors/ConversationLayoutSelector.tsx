'use client';

import type { ConversationLayoutStyle } from '@/lib/studio/types';

interface ConversationLayoutSelectorProps {
  value: ConversationLayoutStyle;
  onChange: (style: ConversationLayoutStyle) => void;
}

interface LayoutOption {
  id: ConversationLayoutStyle;
  label: string;
  description: string;
}

const LAYOUT_OPTIONS: LayoutOption[] = [
  {
    id: 'comic-strip',
    label: 'Comic Strip',
    description: 'Vertical panels with illustrations',
  },
  {
    id: 'side-by-side',
    label: 'Side by Side',
    description: 'Image + dialogue in rows',
  },
  {
    id: 'illustrated-scene',
    label: 'Scene Overlay',
    description: 'Speech bubbles on image',
  },
  {
    id: 'chat-bubbles',
    label: 'Chat Bubbles',
    description: 'Simple messaging style',
  },
  {
    id: 'picture-book',
    label: 'Picture Book',
    description: 'Full image + 1-2 sentences',
  },
];

export function ConversationLayoutSelector({
  value,
  onChange,
}: ConversationLayoutSelectorProps) {
  return (
    <div className="mb-6">
      <label className="mb-3 block text-sm font-medium text-gray-700">
        Choose Layout Style
      </label>
      <div className="grid grid-cols-5 gap-2">
        {LAYOUT_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`group relative rounded-xl border-2 p-3 text-left transition-all ${
              value === option.id
                ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
            }`}
          >
            {/* Mini preview illustration */}
            <div className="mb-2 aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-100">
              <LayoutPreviewIcon layoutId={option.id} isSelected={value === option.id} />
            </div>
            <p
              className={`text-sm font-semibold ${value === option.id ? 'text-emerald-700' : 'text-gray-700'}`}
            >
              {option.label}
            </p>
            <p className="text-xs text-gray-500">{option.description}</p>
            {value === option.id && (
              <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function LayoutPreviewIcon({
  layoutId,
  isSelected,
}: {
  layoutId: ConversationLayoutStyle;
  isSelected: boolean;
}) {
  const accent = isSelected ? '#059669' : '#9ca3af';
  const accentLight = isSelected ? '#d1fae5' : '#f3f4f6';
  const blue = isSelected ? '#3b82f6' : '#93c5fd';
  const amber = isSelected ? '#f59e0b' : '#fcd34d';

  switch (layoutId) {
    case 'comic-strip':
      return (
        <svg viewBox="0 0 60 80" className="h-full w-full">
          {/* Panel 1 */}
          <rect x="4" y="4" width="52" height="22" rx="3" fill={accentLight} />
          <rect x="8" y="8" width="20" height="14" rx="2" fill={accent} opacity="0.3" />
          <circle cx="18" cy="15" r="4" fill={accent} opacity="0.5" />
          <rect x="32" y="10" width="20" height="4" rx="1" fill={blue} />
          <rect x="36" y="16" width="16" height="3" rx="1" fill={amber} />
          {/* Panel 2 */}
          <rect x="4" y="29" width="52" height="22" rx="3" fill={accentLight} />
          <rect x="32" y="33" width="20" height="14" rx="2" fill={accent} opacity="0.3" />
          <circle cx="42" cy="40" r="4" fill={accent} opacity="0.5" />
          <rect x="8" y="35" width="20" height="4" rx="1" fill={amber} />
          <rect x="8" y="41" width="16" height="3" rx="1" fill={blue} />
          {/* Panel 3 */}
          <rect x="4" y="54" width="52" height="22" rx="3" fill={accentLight} />
          <rect x="8" y="58" width="20" height="14" rx="2" fill={accent} opacity="0.3" />
          <circle cx="18" cy="65" r="4" fill={accent} opacity="0.5" />
          <rect x="32" y="60" width="20" height="4" rx="1" fill={blue} />
          <rect x="36" y="66" width="16" height="3" rx="1" fill={amber} />
        </svg>
      );

    case 'side-by-side':
      return (
        <svg viewBox="0 0 60 80" className="h-full w-full">
          {/* Row 1: Image left, text right */}
          <rect x="4" y="4" width="24" height="22" rx="3" fill={accentLight} />
          <circle cx="16" cy="15" r="6" fill={accent} opacity="0.4" />
          <rect x="32" y="6" width="24" height="6" rx="2" fill={blue} />
          <rect x="32" y="14" width="20" height="4" rx="1" fill={amber} />
          <rect x="32" y="20" width="16" height="3" rx="1" fill={accent} opacity="0.3" />
          {/* Row 2: Text left, image right */}
          <rect x="4" y="30" width="20" height="6" rx="2" fill={amber} />
          <rect x="4" y="38" width="16" height="4" rx="1" fill={blue} />
          <rect x="4" y="44" width="14" height="3" rx="1" fill={accent} opacity="0.3" />
          <rect x="32" y="30" width="24" height="22" rx="3" fill={accentLight} />
          <circle cx="44" cy="41" r="6" fill={accent} opacity="0.4" />
          {/* Row 3: Image left, text right */}
          <rect x="4" y="56" width="24" height="20" rx="3" fill={accentLight} />
          <circle cx="16" cy="66" r="6" fill={accent} opacity="0.4" />
          <rect x="32" y="58" width="24" height="6" rx="2" fill={blue} />
          <rect x="32" y="66" width="20" height="4" rx="1" fill={amber} />
        </svg>
      );

    case 'illustrated-scene':
      return (
        <svg viewBox="0 0 60 80" className="h-full w-full">
          {/* Background scene */}
          <rect x="4" y="4" width="52" height="72" rx="3" fill={accentLight} />
          {/* Scene elements */}
          <rect x="8" y="50" width="44" height="22" rx="2" fill={accent} opacity="0.2" />
          <circle cx="20" cy="60" r="8" fill={accent} opacity="0.4" />
          <circle cx="42" cy="58" r="6" fill={accent} opacity="0.3" />
          {/* Speech bubbles overlaid */}
          <g>
            <rect x="6" y="8" width="22" height="14" rx="4" fill={blue} />
            <polygon points="16,22 20,22 14,28" fill={blue} />
            <rect x="9" y="11" width="16" height="3" rx="1" fill="white" opacity="0.7" />
            <rect x="9" y="16" width="12" height="2" rx="1" fill="white" opacity="0.5" />
          </g>
          <g>
            <rect x="32" y="28" width="22" height="14" rx="4" fill={amber} />
            <polygon points="44,42 48,42 50,48" fill={amber} />
            <rect x="35" y="31" width="16" height="3" rx="1" fill="white" opacity="0.7" />
            <rect x="35" y="36" width="12" height="2" rx="1" fill="white" opacity="0.5" />
          </g>
        </svg>
      );

    case 'chat-bubbles':
      return (
        <svg viewBox="0 0 60 80" className="h-full w-full">
          {/* Scene image at top */}
          <rect x="4" y="4" width="52" height="24" rx="3" fill={accentLight} />
          <circle cx="30" cy="16" r="8" fill={accent} opacity="0.3" />
          {/* Chat bubbles */}
          <g>
            <rect x="4" y="32" width="28" height="12" rx="4" fill={blue} />
            <rect x="7" y="35" width="18" height="3" rx="1" fill="white" opacity="0.7" />
            <rect x="7" y="40" width="12" height="2" rx="1" fill="white" opacity="0.5" />
          </g>
          <g>
            <rect x="28" y="48" width="28" height="12" rx="4" fill={amber} />
            <rect x="31" y="51" width="18" height="3" rx="1" fill="white" opacity="0.7" />
            <rect x="31" y="56" width="12" height="2" rx="1" fill="white" opacity="0.5" />
          </g>
          <g>
            <rect x="4" y="64" width="28" height="12" rx="4" fill={blue} />
            <rect x="7" y="67" width="18" height="3" rx="1" fill="white" opacity="0.7" />
            <rect x="7" y="72" width="12" height="2" rx="1" fill="white" opacity="0.5" />
          </g>
        </svg>
      );

    case 'picture-book':
      return (
        <svg viewBox="0 0 60 80" className="h-full w-full">
          {/* Full page image */}
          <rect x="4" y="4" width="52" height="52" rx="3" fill={accentLight} />
          {/* Scene illustration */}
          <circle cx="30" cy="26" r="14" fill={accent} opacity="0.3" />
          <rect x="12" y="40" width="36" height="12" rx="2" fill={accent} opacity="0.2" />
          <circle cx="22" cy="46" r="5" fill={accent} opacity="0.4" />
          <circle cx="38" cy="46" r="4" fill={accent} opacity="0.3" />
          {/* Simple text below - 1-2 sentences */}
          <rect x="8" y="62" width="44" height="5" rx="2" fill={blue} />
          <rect x="14" y="70" width="32" height="4" rx="1" fill={amber} />
        </svg>
      );
  }
}
