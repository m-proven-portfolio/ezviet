'use client';

import { useEffect, useState } from 'react';
import { Coins, Zap, Sparkles } from 'lucide-react';

interface RewardScreenProps {
  dong?: number;
  energy?: number;
  messageVi: string;
  messageEn: string;
  onContinue: () => void;
}

/**
 * RewardScreen - Displays rewards earned during gameplay
 *
 * Shows animated reward counts with celebratory visuals.
 */
export function RewardScreen({
  dong,
  energy,
  messageVi,
  messageEn,
  onContinue,
}: RewardScreenProps) {
  const [showRewards, setShowRewards] = useState(false);
  const [animatedDong, setAnimatedDong] = useState(0);
  const [animatedEnergy, setAnimatedEnergy] = useState(0);

  // Animate rewards appearing
  useEffect(() => {
    const timer = setTimeout(() => setShowRewards(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Animate dong counter
  useEffect(() => {
    if (!showRewards || !dong) return;

    const duration = 1000; // 1 second
    const steps = 20;
    const increment = dong / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= dong) {
        setAnimatedDong(dong);
        clearInterval(interval);
      } else {
        setAnimatedDong(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [showRewards, dong]);

  // Animate energy counter
  useEffect(() => {
    if (!showRewards || !energy) return;

    const duration = 1000;
    const steps = 20;
    const increment = energy / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= energy) {
        setAnimatedEnergy(energy);
        clearInterval(interval);
      } else {
        setAnimatedEnergy(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [showRewards, energy]);

  // Format đồng for display
  const formatDong = (amount: number): string => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}k`;
    }
    return amount.toString();
  };

  return (
    <div className="space-y-6">
      {/* Message box */}
      <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-lg rounded-2xl p-6 border border-emerald-500/30">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-emerald-400" />
          <span className="text-emerald-400 font-medium">Reward!</span>
        </div>

        <p className="text-white text-xl font-medium mb-2">{messageVi}</p>
        <p className="text-slate-300">{messageEn}</p>
      </div>

      {/* Rewards */}
      {showRewards && (
        <div className="flex justify-center gap-6 animate-fade-in">
          {/* Đồng reward */}
          {dong && dong > 0 && (
            <div className="flex flex-col items-center gap-2 bg-amber-500/20 rounded-xl p-4 border border-amber-500/30">
              <Coins className="w-10 h-10 text-amber-400" />
              <p className="text-amber-300 text-2xl font-bold">
                +{formatDong(animatedDong)}đ
              </p>
            </div>
          )}

          {/* Energy reward */}
          {energy && energy > 0 && (
            <div className="flex flex-col items-center gap-2 bg-purple-500/20 rounded-xl p-4 border border-purple-500/30">
              <Zap className="w-10 h-10 text-purple-400" />
              <p className="text-purple-300 text-2xl font-bold">
                +{animatedEnergy}⚡
              </p>
            </div>
          )}
        </div>
      )}

      {/* Continue button */}
      <button
        onClick={onContinue}
        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors active:scale-[0.98]"
      >
        Continue
      </button>
    </div>
  );
}
