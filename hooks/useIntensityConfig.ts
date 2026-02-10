/**
 * useIntensityConfig Hook
 *
 * Resolves intensity configuration from either the new intensity_config system
 * or the legacy difficulty field, providing backward compatibility.
 */

import { useMemo } from 'react';
import type {
  IntensityConfig,
  ResolvedIntensityConfig,
} from '@/lib/intensity';
import { resolveFromLegacy } from '@/lib/intensity';

export interface UseIntensityConfigOptions {
  /** New intensity config (from label_set.intensity_config) */
  intensityConfig?: IntensityConfig | null;
  /** Legacy difficulty value (from label_set.difficulty or card.difficulty) */
  difficulty?: 'easy' | 'medium' | 'hard' | number | null;
}

/**
 * Hook to resolve intensity configuration
 *
 * Priority:
 * 1. intensity_config (new system)
 * 2. difficulty (legacy, converted to preset)
 * 3. Default 'standard' preset
 *
 * @example
 * ```tsx
 * function QuizMode({ labelSet }: { labelSet: LabelSetWithLabels }) {
 *   const config = useIntensityConfig({
 *     intensityConfig: labelSet.intensity_config,
 *     difficulty: labelSet.difficulty,
 *   });
 *
 *   // Now use config for all behavior
 *   if (config.timer.enabled) {
 *     // show timer
 *   }
 * }
 * ```
 */
export function useIntensityConfig(
  options: UseIntensityConfigOptions
): ResolvedIntensityConfig {
  const { intensityConfig, difficulty } = options;

  return useMemo(() => {
    return resolveFromLegacy(intensityConfig, difficulty);
  }, [intensityConfig, difficulty]);
}

export default useIntensityConfig;
