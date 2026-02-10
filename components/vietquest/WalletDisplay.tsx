'use client';

import { useState, useEffect, useRef } from 'react';
import { useVietQuestStore } from '@/lib/stores/vietquestStore';
import { Coins, Zap, Languages } from 'lucide-react';
import { audioManager } from '@/lib/vietquest/audioManager';

/**
 * WalletDisplay - HUD showing đồng and energy
 *
 * Fixed position in top-right corner of game screen.
 * Shows cached translations count and translator status.
 */
export function WalletDisplay() {
  // Select individual values to avoid object reference issues
  const dong = useVietQuestStore((state) => state.dong);
  const energy = useVietQuestStore((state) => state.energy);
  
  // Animated counters
  const [displayDong, setDisplayDong] = useState(dong);
  const [displayEnergy, setDisplayEnergy] = useState(energy);
  const prevDong = useRef(dong);
  const prevEnergy = useRef(energy);
  const translatorEnabled = useVietQuestStore((state) => state.translatorEnabled);
  const translatedPhrases = useVietQuestStore((state) => state.translatedPhrases);
  const toggleTranslator = useVietQuestStore((state) => state.toggleTranslator);
  const canUseTranslator = useVietQuestStore((state) => state.canUseTranslator);
  const cachedCount = translatedPhrases.size;

  // Animate dong counter
  useEffect(() => {
    if (dong !== prevDong.current) {
      const increment = (dong - prevDong.current) / 20;
      let current = prevDong.current;
      const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= dong) || (increment < 0 && current <= dong)) {
          setDisplayDong(dong);
          clearInterval(timer);
        } else {
          setDisplayDong(Math.round(current));
        }
      }, 20);
      
      // Play sound on dong change
      if (dong > prevDong.current) audioManager.playSound('reward');
      prevDong.current = dong;
      
      return () => clearInterval(timer);
    }
  }, [dong]);

  // Animate energy counter
  useEffect(() => {
    if (energy !== prevEnergy.current) {
      const increment = (energy - prevEnergy.current) / 15;
      let current = prevEnergy.current;
      const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= energy) || (increment < 0 && current <= energy)) {
          setDisplayEnergy(energy);
          clearInterval(timer);
        } else {
          setDisplayEnergy(Math.round(current));
        }
      }, 20);
      
      prevEnergy.current = energy;
      return () => clearInterval(timer);
    }
  }, [energy]);

  // Format đồng for display (e.g., 500000 -> "500k")
  const formatDong = (amount: number): string => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}k`;
    }
    return amount.toString();
  };

  // Energy bar percentage
  const energyPercent = Math.min(100, Math.max(0, energy));

  // Handle translator toggle
  const handleTranslatorToggle = () => {
    if (!translatorEnabled && !canUseTranslator()) {
      audioManager.playSound('error');
      return;
    }
    audioManager.playSound('tap');
    toggleTranslator();
  };

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
      {/* Đồng display */}
      <div className="flex items-center gap-2 bg-slate-800/90 backdrop-blur-lg rounded-full px-3 py-2 border border-amber-500/30">
        <Coins className="w-5 h-5 text-amber-400" />
        <span className="text-amber-300 font-bold text-sm min-w-[50px] text-right tabular-nums">
          {formatDong(displayDong)}đ
        </span>
      </div>

      {/* Energy display */}
      <div className="bg-slate-800/90 backdrop-blur-lg rounded-full px-3 py-2 border border-purple-500/30">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-400" />
          <div className="flex-1 min-w-[50px]">
            {/* Energy bar */}
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-300"
                style={{ width: `${energyPercent}%` }}
              />
            </div>
            <p className="text-purple-300 text-xs text-right mt-0.5 tabular-nums">
              {displayEnergy}/100
            </p>
          </div>
        </div>
      </div>

      {/* Translator toggle */}
      <button
        onClick={handleTranslatorToggle}
        className={`
          flex items-center gap-2 rounded-full px-3 py-2 transition-all
          ${translatorEnabled
            ? 'bg-emerald-500/90 text-white border border-emerald-400'
            : 'bg-slate-800/90 text-slate-300 border border-slate-600 hover:border-slate-500'
          }
          backdrop-blur-lg
        `}
      >
        <Languages className="w-5 h-5" />
        <span className="text-sm font-medium">
          {translatorEnabled ? 'ON' : 'OFF'}
        </span>
        {!translatorEnabled && (
          <span className="text-xs text-purple-400">-10⚡</span>
        )}
      </button>

      {/* Cached translations indicator */}
      {cachedCount > 0 && (
        <div className="bg-slate-800/90 backdrop-blur-lg rounded-full px-3 py-1.5 border border-emerald-500/30">
          <span className="text-emerald-400 text-xs">
            {cachedCount} phrase{cachedCount !== 1 ? 's' : ''} cached
          </span>
        </div>
      )}
    </div>
  );
}
