/**
 * Intensity Config Resolver
 *
 * Resolves an IntensityConfig (preset + optional overrides) into a
 * fully-populated ResolvedIntensityConfig that runtime code can use.
 */

import type {
  IntensityConfig,
  ResolvedIntensityConfig,
  IntensityPreset,
  HintConfig,
  TimerConfig,
  ScoringConfig,
  DisplayConfig,
  GamificationConfig,
  FutureFeatureConfig,
} from './types';
import { INTENSITY_PRESETS, DEFAULT_PRESET } from './presets';

// =============================================================================
// Deep Merge Utility
// =============================================================================

/**
 * Deep merge two objects, with override values taking precedence
 * Handles nested objects but not arrays (arrays are replaced entirely)
 */
function deepMerge<T extends object>(base: T, override: Partial<T> | undefined): T {
  if (!override) return base;

  const result = { ...base };

  for (const key of Object.keys(override) as Array<keyof T>) {
    const overrideValue = override[key];
    if (overrideValue === undefined) continue;

    const baseValue = base[key];

    // If both values are plain objects (not arrays), recursively merge
    if (
      typeof baseValue === 'object' &&
      baseValue !== null &&
      !Array.isArray(baseValue) &&
      typeof overrideValue === 'object' &&
      overrideValue !== null &&
      !Array.isArray(overrideValue)
    ) {
      result[key] = deepMerge(
        baseValue as object,
        overrideValue as object
      ) as T[keyof T];
    } else {
      // Otherwise, use the override value directly
      result[key] = overrideValue as T[keyof T];
    }
  }

  return result;
}

// =============================================================================
// Main Resolver
// =============================================================================

/**
 * Resolve an IntensityConfig to a fully-populated ResolvedIntensityConfig
 *
 * @param config - The config with preset and optional overrides
 * @returns Fully resolved config with all fields populated
 */
export function resolveIntensityConfig(
  config: IntensityConfig
): ResolvedIntensityConfig {
  const preset = INTENSITY_PRESETS[config.preset];

  return {
    preset: config.preset,
    matching: config.matching ?? preset.matching,
    hints: deepMerge<HintConfig>(preset.hints, config.hints),
    timer: deepMerge<TimerConfig>(preset.timer, config.timer),
    scoring: deepMerge<ScoringConfig>(preset.scoring, config.scoring),
    display: deepMerge<DisplayConfig>(preset.display, config.display),
    gamification: deepMerge<GamificationConfig>(
      preset.gamification,
      config.gamification
    ),
    future: deepMerge<FutureFeatureConfig>(preset.future, config.future),
  };
}

/**
 * Create a default resolved config (standard preset, no overrides)
 */
export function getDefaultResolvedConfig(): ResolvedIntensityConfig {
  return resolveIntensityConfig({ preset: DEFAULT_PRESET });
}

// =============================================================================
// Legacy Conversion
// =============================================================================

/**
 * Convert legacy difficulty value to IntensityConfig
 *
 * This provides backward compatibility for existing content that uses
 * the old difficulty system (easy/medium/hard or 1-5 scale).
 *
 * @param difficulty - Legacy difficulty value
 * @returns IntensityConfig with appropriate preset
 */
export function legacyDifficultyToIntensity(
  difficulty: 'easy' | 'medium' | 'hard' | number | null | undefined
): IntensityConfig {
  // Handle null/undefined
  if (difficulty === null || difficulty === undefined) {
    return { preset: DEFAULT_PRESET };
  }

  // Handle string difficulty (from label_sets)
  if (typeof difficulty === 'string') {
    const presetMap: Record<string, IntensityPreset> = {
      easy: 'gentle',
      medium: 'standard',
      hard: 'intensive',
    };
    return { preset: presetMap[difficulty] ?? DEFAULT_PRESET };
  }

  // Handle numeric difficulty (from cards: 1-5 scale)
  if (typeof difficulty === 'number') {
    if (difficulty <= 2) return { preset: 'gentle' };
    if (difficulty <= 3) return { preset: 'standard' };
    return { preset: 'intensive' };
  }

  return { preset: DEFAULT_PRESET };
}

/**
 * Resolve config from either new intensity_config or legacy difficulty
 *
 * Priority:
 * 1. intensity_config (new system)
 * 2. difficulty (legacy, converted)
 * 3. Default preset (standard)
 *
 * @param intensityConfig - New intensity config (from DB)
 * @param difficulty - Legacy difficulty value (from DB)
 * @returns Fully resolved config
 */
export function resolveFromLegacy(
  intensityConfig: IntensityConfig | null | undefined,
  difficulty?: 'easy' | 'medium' | 'hard' | number | null
): ResolvedIntensityConfig {
  // Priority 1: Use new intensity_config if available
  if (intensityConfig) {
    return resolveIntensityConfig(intensityConfig);
  }

  // Priority 2: Convert legacy difficulty
  if (difficulty !== undefined && difficulty !== null) {
    const converted = legacyDifficultyToIntensity(difficulty);
    return resolveIntensityConfig(converted);
  }

  // Fallback: Default preset
  return getDefaultResolvedConfig();
}

// =============================================================================
// Config Comparison Utilities
// =============================================================================

/**
 * Check if a config has any overrides from the preset defaults
 *
 * @param config - The config to check
 * @returns true if any settings differ from preset defaults
 */
export function hasOverrides(config: IntensityConfig): boolean {
  const {
    preset,
    matching,
    hints,
    timer,
    scoring,
    display,
    gamification,
    future,
  } = config;
  const defaults = INTENSITY_PRESETS[preset];

  // Check each category for overrides
  if (matching !== undefined && matching !== defaults.matching) return true;

  const hasObjectOverrides = (
    override: object | undefined,
    defaultObj: object
  ): boolean => {
    if (!override) return false;
    return JSON.stringify(override) !== JSON.stringify({});
  };

  if (hasObjectOverrides(hints, defaults.hints)) return true;
  if (hasObjectOverrides(timer, defaults.timer)) return true;
  if (hasObjectOverrides(scoring, defaults.scoring)) return true;
  if (hasObjectOverrides(display, defaults.display)) return true;
  if (hasObjectOverrides(gamification, defaults.gamification)) return true;
  if (hasObjectOverrides(future, defaults.future)) return true;

  return false;
}

/**
 * Get a minimal config by removing values that match preset defaults
 *
 * This is useful for storage - only store what differs from the preset.
 *
 * @param config - The full config
 * @returns Minimal config with only overrides
 */
export function minimizeConfig(config: IntensityConfig): IntensityConfig {
  const defaults = INTENSITY_PRESETS[config.preset];
  const minimal: IntensityConfig = { preset: config.preset };

  if (config.matching !== undefined && config.matching !== defaults.matching) {
    minimal.matching = config.matching;
  }

  // For object fields, only include if there are actual overrides
  // (This is a simplified version - a full implementation would deep-compare)
  if (config.hints && Object.keys(config.hints).length > 0) {
    minimal.hints = config.hints;
  }
  if (config.timer && Object.keys(config.timer).length > 0) {
    minimal.timer = config.timer;
  }
  if (config.scoring && Object.keys(config.scoring).length > 0) {
    minimal.scoring = config.scoring;
  }
  if (config.display && Object.keys(config.display).length > 0) {
    minimal.display = config.display;
  }
  if (config.gamification && Object.keys(config.gamification).length > 0) {
    minimal.gamification = config.gamification;
  }
  if (config.future && Object.keys(config.future).length > 0) {
    minimal.future = config.future;
  }

  return minimal;
}
