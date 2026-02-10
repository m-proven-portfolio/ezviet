/**
 * Learning Intensity System
 *
 * A universal configuration system for controlling learning intensity
 * across Picture Quiz, Flashcards, Books, and other content types.
 *
 * @example
 * ```typescript
 * import {
 *   resolveIntensityConfig,
 *   resolveFromLegacy,
 *   PRESET_METADATA,
 * } from '@/lib/intensity';
 *
 * // Resolve config from new system or legacy difficulty
 * const config = resolveFromLegacy(
 *   labelSet.intensity_config,
 *   labelSet.difficulty
 * );
 *
 * // Use resolved config
 * if (config.timer.enabled) {
 *   startTimer(config.timer.secondsPerQuestion);
 * }
 * ```
 */

// Types
export type {
  IntensityPreset,
  MatchingMode,
  HintType,
  CelebrationLevel,
  HintConfig,
  TimerConfig,
  ScoringConfig,
  DisplayConfig,
  GamificationConfig,
  FutureFeatureConfig,
  IntensityConfig,
  ResolvedIntensityConfig,
  PresetMetadata,
} from './types';

// Constants
export { PRESET_METADATA } from './types';

// Presets
export {
  INTENSITY_PRESETS,
  DEFAULT_PRESET,
  getPresetDefinition,
} from './presets';
export type { PresetDefinition } from './presets';

// Resolver functions
export {
  resolveIntensityConfig,
  getDefaultResolvedConfig,
  legacyDifficultyToIntensity,
  resolveFromLegacy,
  hasOverrides,
  minimizeConfig,
} from './resolver';
