'use client';

import { useVietQuestStore } from '@/lib/stores/vietquestStore';
import type { PlayerChoice } from '@/lib/vietquest/types';
import { ChevronRight, Coins, Zap } from 'lucide-react';

interface ChoiceMenuProps {
  prompt: string;
  choices: PlayerChoice[];
}

/**
 * ChoiceMenu - Displays story branch choices for the player
 *
 * Features:
 * - Shows Vietnamese text with English translation (if translator enabled)
 * - Cost indicators for choices that require đồng or energy
 * - Visual feedback for positive/neutral/negative consequences
 */
export function ChoiceMenu({ prompt, choices }: ChoiceMenuProps) {
  // Select individual values to avoid object reference issues
  const dong = useVietQuestStore((state) => state.dong);
  const energy = useVietQuestStore((state) => state.energy);
  const translatorEnabled = useVietQuestStore((state) => state.translatorEnabled);
  const makeChoice = useVietQuestStore((state) => state.makeChoice);
  const spendDong = useVietQuestStore((state) => state.spendDong);

  const handleChoice = (choice: PlayerChoice) => {
    // Check if player can afford this choice
    if (choice.dong_cost && dong < choice.dong_cost) {
      // TODO: Show "not enough đồng" feedback
      return;
    }

    // Spend đồng if required
    if (choice.dong_cost) {
      spendDong(choice.dong_cost);
    }

    // Make the choice
    makeChoice(choice.id, choice.result);
  };

  // Get consequence styling
  const getConsequenceStyle = (consequence?: 'positive' | 'neutral' | 'negative') => {
    switch (consequence) {
      case 'positive':
        return 'border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/10';
      case 'negative':
        return 'border-red-500/30 hover:border-red-500/60 hover:bg-red-500/10';
      default:
        return 'border-slate-500/30 hover:border-slate-500/60 hover:bg-slate-500/10';
    }
  };

  // Check if choice is affordable
  const isAffordable = (choice: PlayerChoice) => {
    if (choice.dong_cost && dong < choice.dong_cost) return false;
    if (choice.energy_cost && energy < choice.energy_cost) return false;
    return true;
  };

  return (
    <div className="space-y-4">
      {/* Prompt */}
      <div className="bg-slate-800/80 backdrop-blur-lg rounded-xl p-4 border border-slate-700/50">
        <p className="text-emerald-400 text-sm font-medium mb-1">What do you do?</p>
        <p className="text-white">{prompt}</p>
      </div>

      {/* Choices */}
      <div className="space-y-2">
        {choices.map((choice) => {
          const affordable = isAffordable(choice);

          return (
            <button
              key={choice.id}
              onClick={() => handleChoice(choice)}
              disabled={!affordable}
              className={`
                w-full p-4 rounded-xl border-2 transition-all text-left
                ${getConsequenceStyle(choice.consequence)}
                ${!affordable ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}
              `}
            >
              <div className="flex items-center gap-3">
                {/* Main content - always show English for choices so players understand their options */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium">{choice.text_vi}</p>
                  <p className="text-slate-400 text-sm mt-0.5">{choice.text_en}</p>
                </div>

                {/* Cost indicators */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {choice.dong_cost && (
                    <span
                      className={`
                        flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                        ${dong >= choice.dong_cost
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-red-500/20 text-red-300'
                        }
                      `}
                    >
                      <Coins className="w-3 h-3" />
                      {(choice.dong_cost / 1000).toFixed(0)}k
                    </span>
                  )}

                  {choice.energy_cost && (
                    <span
                      className={`
                        flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                        ${energy >= choice.energy_cost
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-red-500/20 text-red-300'
                        }
                      `}
                    >
                      <Zap className="w-3 h-3" />
                      {choice.energy_cost}
                    </span>
                  )}

                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
