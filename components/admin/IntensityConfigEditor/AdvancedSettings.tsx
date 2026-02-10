'use client';

/**
 * AdvancedSettings
 *
 * Accordion panel for granular intensity configuration overrides.
 * Shows current values from resolved config with ability to override.
 */

import { useState } from 'react';
import {
  ChevronDown,
  Target,
  Lightbulb,
  Timer,
  Hash,
  Eye,
  PartyPopper,
  Sparkles,
} from 'lucide-react';
import type {
  IntensityConfig,
  ResolvedIntensityConfig,
  MatchingMode,
  HintType,
  CelebrationLevel,
} from '@/lib/intensity';
import { INTENSITY_PRESETS } from '@/lib/intensity';

export interface AdvancedSettingsProps {
  config: IntensityConfig;
  resolvedConfig: ResolvedIntensityConfig;
  onChange: (updates: Partial<IntensityConfig>) => void;
  disabled?: boolean;
}

// Section component for grouping settings
interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon, children, defaultOpen = false }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          {icon}
          {title}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && <div className="p-4 space-y-4 bg-white">{children}</div>}
    </div>
  );
}

// Toggle switch component
interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  isOverridden?: boolean;
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
  isOverridden,
}: ToggleProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div className="relative mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-600 rounded-full transition-colors" />
        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {isOverridden && (
            <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
              modified
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}

// Number input component
interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  isOverridden?: boolean;
}

function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  disabled,
  isOverridden,
}: NumberInputProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">{label}</span>
        {isOverridden && (
          <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
            modified
          </span>
        )}
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        disabled={disabled}
        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}

export function AdvancedSettings({
  config,
  resolvedConfig,
  onChange,
  disabled = false,
}: AdvancedSettingsProps) {
  const presetDefaults = INTENSITY_PRESETS[config.preset];

  // Helper to check if a value is overridden
  const isOverridden = (
    category: keyof IntensityConfig,
    key?: string
  ): boolean => {
    const override = config[category];
    if (!override) return false;
    if (!key) return true;
    return (override as Record<string, unknown>)[key] !== undefined;
  };

  return (
    <div className="space-y-3 pl-4 border-l-2 border-gray-200">
      {/* Matching Mode */}
      <Section
        title="Matching Strictness"
        icon={<Target className="w-4 h-4" />}
        defaultOpen
      >
        <div className="space-y-2">
          {(['fuzzy', 'diacritic_insensitive', 'exact'] as MatchingMode[]).map(
            (mode) => (
              <label
                key={mode}
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="radio"
                  name="matching"
                  value={mode}
                  checked={resolvedConfig.matching === mode}
                  onChange={() => onChange({ matching: mode })}
                  disabled={disabled}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {mode.replace('_', ' ')}
                    </span>
                    {config.matching === mode &&
                      mode !== presetDefaults.matching && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          modified
                        </span>
                      )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {mode === 'fuzzy' && 'Accept close answers with ~70% similarity'}
                    {mode === 'diacritic_insensitive' &&
                      'Accept answers without tone marks'}
                    {mode === 'exact' && 'Require exact match with diacritics'}
                  </p>
                </div>
              </label>
            )
          )}
        </div>
      </Section>

      {/* Hints */}
      <Section
        title="Hints"
        icon={<Lightbulb className="w-4 h-4" />}
      >
        <Toggle
          label="Enable hints"
          description="Allow users to get help during quiz"
          checked={resolvedConfig.hints.enabled}
          onChange={(enabled) =>
            onChange({ hints: { ...config.hints, enabled } })
          }
          disabled={disabled}
          isOverridden={isOverridden('hints', 'enabled')}
        />

        {resolvedConfig.hints.enabled && (
          <>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Available hint types:</p>
              {(['audio', 'first_letters', 'no_tones'] as HintType[]).map(
                (type) => (
                  <Toggle
                    key={type}
                    label={type.replace('_', ' ')}
                    checked={resolvedConfig.hints.available.includes(type)}
                    onChange={(checked) => {
                      const current = resolvedConfig.hints.available;
                      const newAvailable = checked
                        ? [...current, type]
                        : current.filter((t) => t !== type);
                      onChange({ hints: { ...config.hints, available: newAvailable } });
                    }}
                    disabled={disabled}
                  />
                )
              )}
            </div>

            <div className="pt-2 border-t border-gray-100 space-y-2">
              <p className="text-xs text-gray-500">Hint penalties:</p>
              <NumberInput
                label="Audio"
                value={resolvedConfig.hints.penalties.audio}
                onChange={(audio) =>
                  onChange({
                    hints: {
                      ...config.hints,
                      penalties: { ...resolvedConfig.hints.penalties, audio },
                    },
                  })
                }
                max={50}
                disabled={disabled}
                isOverridden={isOverridden('hints', 'penalties')}
              />
              <NumberInput
                label="First letters"
                value={resolvedConfig.hints.penalties.first_letters}
                onChange={(first_letters) =>
                  onChange({
                    hints: {
                      ...config.hints,
                      penalties: { ...resolvedConfig.hints.penalties, first_letters },
                    },
                  })
                }
                max={50}
                disabled={disabled}
              />
              <NumberInput
                label="No tones"
                value={resolvedConfig.hints.penalties.no_tones}
                onChange={(no_tones) =>
                  onChange({
                    hints: {
                      ...config.hints,
                      penalties: { ...resolvedConfig.hints.penalties, no_tones },
                    },
                  })
                }
                max={50}
                disabled={disabled}
              />
            </div>
          </>
        )}
      </Section>

      {/* Timer */}
      <Section title="Timer" icon={<Timer className="w-4 h-4" />}>
        <Toggle
          label="Enable timer"
          description="Add time pressure to quiz"
          checked={resolvedConfig.timer.enabled}
          onChange={(enabled) =>
            onChange({ timer: { ...config.timer, enabled } })
          }
          disabled={disabled}
          isOverridden={isOverridden('timer', 'enabled')}
        />

        {resolvedConfig.timer.enabled && (
          <>
            <NumberInput
              label="Seconds per question"
              value={resolvedConfig.timer.secondsPerQuestion ?? 30}
              onChange={(secondsPerQuestion) =>
                onChange({
                  timer: { ...config.timer, secondsPerQuestion },
                })
              }
              min={5}
              max={300}
              disabled={disabled}
            />
            <Toggle
              label="Show timer"
              description="Display countdown to user"
              checked={resolvedConfig.timer.showTimer}
              onChange={(showTimer) =>
                onChange({ timer: { ...config.timer, showTimer } })
              }
              disabled={disabled}
            />
          </>
        )}
      </Section>

      {/* Scoring */}
      <Section title="Scoring" icon={<Hash className="w-4 h-4" />}>
        <NumberInput
          label="Exact match points"
          value={resolvedConfig.scoring.exactMatch}
          onChange={(exactMatch) =>
            onChange({ scoring: { ...config.scoring, exactMatch } })
          }
          disabled={disabled}
          isOverridden={isOverridden('scoring', 'exactMatch')}
        />
        <NumberInput
          label="Diacritic-insensitive points"
          value={resolvedConfig.scoring.diacriticInsensitive}
          onChange={(diacriticInsensitive) =>
            onChange({ scoring: { ...config.scoring, diacriticInsensitive } })
          }
          disabled={disabled}
        />
        <NumberInput
          label="Fuzzy match points"
          value={resolvedConfig.scoring.fuzzyMatch}
          onChange={(fuzzyMatch) =>
            onChange({ scoring: { ...config.scoring, fuzzyMatch } })
          }
          disabled={disabled}
        />
      </Section>

      {/* Display */}
      <Section title="Display" icon={<Eye className="w-4 h-4" />}>
        <Toggle
          label="Show score"
          description="Display score during quiz"
          checked={resolvedConfig.display.showScore}
          onChange={(showScore) =>
            onChange({ display: { ...config.display, showScore } })
          }
          disabled={disabled}
          isOverridden={isOverridden('display', 'showScore')}
        />
        <Toggle
          label="Show romanization"
          description="Display pronunciation guide"
          checked={resolvedConfig.display.showRomanization}
          onChange={(showRomanization) =>
            onChange({ display: { ...config.display, showRomanization } })
          }
          disabled={disabled}
        />
        <Toggle
          label="Auto-play audio"
          description="Play pronunciation automatically"
          checked={resolvedConfig.display.audioAutoPlay}
          onChange={(audioAutoPlay) =>
            onChange({ display: { ...config.display, audioAutoPlay } })
          }
          disabled={disabled}
        />
        <Toggle
          label="Show translation"
          description="Display English translation in explore mode"
          checked={resolvedConfig.display.showTranslation}
          onChange={(showTranslation) =>
            onChange({ display: { ...config.display, showTranslation } })
          }
          disabled={disabled}
        />
      </Section>

      {/* Gamification */}
      <Section
        title="Gamification"
        icon={<PartyPopper className="w-4 h-4" />}
      >
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Celebration level:</p>
          {([0, 1, 2, 3] as CelebrationLevel[]).map((level) => (
            <label key={level} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="celebrationLevel"
                value={level}
                checked={resolvedConfig.gamification.celebrationLevel === level}
                onChange={() =>
                  onChange({
                    gamification: {
                      ...config.gamification,
                      celebrationLevel: level,
                    },
                  })
                }
                disabled={disabled}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">
                {level === 0 && 'None'}
                {level === 1 && 'Subtle'}
                {level === 2 && 'Moderate'}
                {level === 3 && 'Festive'}
              </span>
            </label>
          ))}
        </div>

        <div className="pt-2 border-t border-gray-100 space-y-3">
          <Toggle
            label="Show confetti"
            checked={resolvedConfig.gamification.showConfetti}
            onChange={(showConfetti) =>
              onChange({
                gamification: { ...config.gamification, showConfetti },
              })
            }
            disabled={disabled}
          />
          <Toggle
            label="Sound effects"
            checked={resolvedConfig.gamification.soundEffects}
            onChange={(soundEffects) =>
              onChange({
                gamification: { ...config.gamification, soundEffects },
              })
            }
            disabled={disabled}
          />
          <Toggle
            label="Show streak"
            checked={resolvedConfig.gamification.showStreak}
            onChange={(showStreak) =>
              onChange({
                gamification: { ...config.gamification, showStreak },
              })
            }
            disabled={disabled}
          />
          <Toggle
            label="Show leaderboard"
            checked={resolvedConfig.gamification.showLeaderboard}
            onChange={(showLeaderboard) =>
              onChange({
                gamification: { ...config.gamification, showLeaderboard },
              })
            }
            disabled={disabled}
          />
        </div>
      </Section>

      {/* Future Features */}
      <Section
        title="Future Features"
        icon={<Sparkles className="w-4 h-4" />}
      >
        <p className="text-xs text-gray-500 mb-3">
          These features are coming soon. Enable them now to auto-activate when available.
        </p>
        <Toggle
          label="Contextual sentences"
          description="Show example sentences for vocabulary"
          checked={resolvedConfig.future.contextualSentences}
          onChange={(contextualSentences) =>
            onChange({ future: { ...config.future, contextualSentences } })
          }
          disabled={disabled}
        />
        <Toggle
          label="Spaced repetition"
          description="Schedule reviews based on performance"
          checked={resolvedConfig.future.spacedRepetition}
          onChange={(spacedRepetition) =>
            onChange({ future: { ...config.future, spacedRepetition } })
          }
          disabled={disabled}
        />
        <Toggle
          label="Adaptive difficulty"
          description="Adjust difficulty based on user performance"
          checked={resolvedConfig.future.adaptiveDifficulty}
          onChange={(adaptiveDifficulty) =>
            onChange({ future: { ...config.future, adaptiveDifficulty } })
          }
          disabled={disabled}
        />
        <Toggle
          label="Cultural context"
          description="Show cultural notes alongside vocabulary"
          checked={resolvedConfig.future.culturalContext}
          onChange={(culturalContext) =>
            onChange({ future: { ...config.future, culturalContext } })
          }
          disabled={disabled}
        />
      </Section>
    </div>
  );
}

export default AdvancedSettings;
