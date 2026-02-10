'use client';

import type { GridLayoutPreset } from '@/lib/studio/grid-layouts';
import { GRID_LAYOUTS, getLayoutPresets } from '@/lib/studio/grid-layouts';

interface GridLayoutSelectorProps {
  value: GridLayoutPreset;
  onChange: (layout: GridLayoutPreset) => void;
  disabled?: boolean;
}

export function GridLayoutSelector({
  value,
  onChange,
  disabled = false,
}: GridLayoutSelectorProps) {
  const presets = getLayoutPresets();

  return (
    <div className="mb-6">
      <label className="mb-3 block text-sm font-medium text-gray-700">
        Grid Layout
      </label>
      <div className="grid grid-cols-5 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.preset}
            type="button"
            disabled={disabled}
            onClick={() => onChange(preset.preset)}
            className={`group relative rounded-xl border-2 p-3 text-left transition-all ${
              value === preset.preset
                ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
            } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {/* Mini grid preview */}
            <div className="mb-2 aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
              <GridPreviewIcon
                cols={preset.cols}
                rows={preset.rows}
                isSelected={value === preset.preset}
              />
            </div>
            <p
              className={`text-sm font-semibold ${
                value === preset.preset ? 'text-emerald-700' : 'text-gray-700'
              }`}
            >
              {preset.label}
            </p>
            <p className="text-xs text-gray-500">{preset.description}</p>
            {value === preset.preset && (
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

function GridPreviewIcon({
  cols,
  rows,
  isSelected,
}: {
  cols: number;
  rows: number;
  isSelected: boolean;
}) {
  const accent = isSelected ? '#059669' : '#9ca3af';
  const accentLight = isSelected ? '#d1fae5' : '#e5e7eb';

  // Calculate cell dimensions
  const padding = 4;
  const gap = 2;
  const viewSize = 60;
  const availableWidth = viewSize - padding * 2 - gap * (cols - 1);
  const availableHeight = viewSize - padding * 2 - gap * (rows - 1);
  const cellWidth = availableWidth / cols;
  const cellHeight = availableHeight / rows;

  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = padding + col * (cellWidth + gap);
      const y = padding + row * (cellHeight + gap);
      cells.push(
        <g key={`${row}-${col}`}>
          <rect
            x={x}
            y={y}
            width={cellWidth}
            height={cellHeight}
            rx={2}
            fill={accentLight}
          />
          {/* Image placeholder */}
          <rect
            x={x + 2}
            y={y + 2}
            width={cellWidth - 4}
            height={cellHeight * 0.5}
            rx={1}
            fill={accent}
            opacity={0.3}
          />
          {/* Text lines */}
          <rect
            x={x + 2}
            y={y + cellHeight * 0.6}
            width={cellWidth * 0.7}
            height={2}
            rx={0.5}
            fill={accent}
            opacity={0.5}
          />
          <rect
            x={x + 2}
            y={y + cellHeight * 0.75}
            width={cellWidth * 0.5}
            height={1.5}
            rx={0.5}
            fill={accent}
            opacity={0.3}
          />
        </g>
      );
    }
  }

  return (
    <svg viewBox={`0 0 ${viewSize} ${viewSize}`} className="h-full w-full">
      {cells}
    </svg>
  );
}
