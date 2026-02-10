/**
 * Grid Layout Presets for Book Studio
 *
 * Reusable preset system for VocabularyGridPage and LessonPage.
 * Each preset defines column/row counts and image sizing for print output.
 */

export type GridLayoutPreset = '2x2' | '2x3' | '3x3' | '2x4' | '3x4';

export interface GridLayoutConfig {
  preset: GridLayoutPreset;
  cols: number;
  rows: number;
  maxCards: number;
  imageSize: 'sm' | 'md' | 'lg';
  label: string;
  description: string;
}

export const GRID_LAYOUTS: Record<GridLayoutPreset, GridLayoutConfig> = {
  '2x2': {
    preset: '2x2',
    cols: 2,
    rows: 2,
    maxCards: 4,
    imageSize: 'lg',
    label: '2 × 2',
    description: '4 large cards',
  },
  '2x3': {
    preset: '2x3',
    cols: 3,
    rows: 2,
    maxCards: 6,
    imageSize: 'md',
    label: '2 × 3',
    description: '6 cards (default)',
  },
  '3x3': {
    preset: '3x3',
    cols: 3,
    rows: 3,
    maxCards: 9,
    imageSize: 'md',
    label: '3 × 3',
    description: '9 cards',
  },
  '2x4': {
    preset: '2x4',
    cols: 4,
    rows: 2,
    maxCards: 8,
    imageSize: 'sm',
    label: '2 × 4',
    description: '8 cards in 2 rows',
  },
  '3x4': {
    preset: '3x4',
    cols: 4,
    rows: 3,
    maxCards: 12,
    imageSize: 'sm',
    label: '3 × 4',
    description: '12 cards (dense)',
  },
};

// Image size classes for Tailwind (editor preview)
export const IMAGE_SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
};

// Grid column classes for Tailwind
export function getGridColsClass(cols: number): string {
  const map: Record<number, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };
  return map[cols] || 'grid-cols-3';
}

// Get all presets as array for selectors
export function getLayoutPresets(): GridLayoutConfig[] {
  return Object.values(GRID_LAYOUTS);
}
