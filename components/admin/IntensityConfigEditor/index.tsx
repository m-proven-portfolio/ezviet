'use client';

/**
 * IntensityConfigEditor
 *
 * Admin UI for configuring learning intensity.
 * Features a preset selector (Gentle/Standard/Intensive) with
 * an optional advanced settings panel for granular overrides.
 */

import { useState, useCallback } from 'react';
import type { IntensityConfig, IntensityPreset } from '@/lib/intensity';
import { resolveIntensityConfig, hasOverrides, DEFAULT_PRESET } from '@/lib/intensity';
import { PresetSelector } from './PresetSelector';
import { AdvancedSettings } from './AdvancedSettings';

export interface IntensityConfigEditorProps {
  /** Current config value (null = default preset) */
  value: IntensityConfig | null;
  /** Called when config changes */
  onChange: (config: IntensityConfig) => void;
  /** Optional: disable all inputs */
  disabled?: boolean;
}

export function IntensityConfigEditor({
  value,
  onChange,
  disabled = false,
}: IntensityConfigEditorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Use provided config or create default
  const config: IntensityConfig = value ?? { preset: DEFAULT_PRESET };

  // Check if there are any overrides from the preset
  const hasCustomizations = hasOverrides(config);

  // Handle preset change - resets all overrides
  const handlePresetChange = useCallback(
    (preset: IntensityPreset) => {
      onChange({ preset });
    },
    [onChange]
  );

  // Handle override changes - preserves other overrides
  const handleConfigChange = useCallback(
    (updates: Partial<IntensityConfig>) => {
      onChange({
        ...config,
        ...updates,
      });
    },
    [config, onChange]
  );

  // Reset to pure preset (remove all overrides)
  const handleResetToPreset = useCallback(() => {
    onChange({ preset: config.preset });
    setShowAdvanced(false);
  }, [config.preset, onChange]);

  // Resolve the full config for preview
  const resolvedConfig = resolveIntensityConfig(config);

  return (
    <div className="space-y-4">
      {/* Preset Selector */}
      <PresetSelector
        value={config.preset}
        onChange={handlePresetChange}
        disabled={disabled}
        hasCustomizations={hasCustomizations}
      />

      {/* Custom badge */}
      {hasCustomizations && (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <span className="px-2 py-0.5 bg-amber-100 rounded-full text-xs font-medium">
            Custom
          </span>
          <span>Some settings differ from preset defaults</span>
          <button
            type="button"
            onClick={handleResetToPreset}
            className="text-amber-700 hover:text-amber-900 underline"
            disabled={disabled}
          >
            Reset
          </button>
        </div>
      )}

      {/* Advanced Settings Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        disabled={disabled}
      >
        <span
          className={`transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
        >
          ▶
        </span>
        Advanced Settings
      </button>

      {/* Advanced Settings Panel */}
      {showAdvanced && (
        <AdvancedSettings
          config={config}
          resolvedConfig={resolvedConfig}
          onChange={handleConfigChange}
          disabled={disabled}
        />
      )}
    </div>
  );
}

export default IntensityConfigEditor;
