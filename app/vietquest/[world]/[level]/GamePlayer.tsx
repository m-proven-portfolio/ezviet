'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVietQuestStore } from '@/lib/stores/vietquestStore';
import { GameCanvas } from '@/components/vietquest/GameCanvas';
import type { VQLevel, VQPlayerStats } from '@/lib/vietquest/types';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';

interface GamePlayerProps {
  level: VQLevel;
  worldName: string;
}

/**
 * GamePlayer - Client component that initializes and runs the game
 *
 * Handles:
 * - Loading player stats (or creating default stats for guests)
 * - Initializing the game store
 * - Rendering the game canvas
 */
export function GamePlayer({ level, worldName }: GamePlayerProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Select individual actions to avoid object reference issues
  const loadLevel = useVietQuestStore((state) => state.loadLevel);
  const resetSession = useVietQuestStore((state) => state.resetSession);

  // Initialize game on mount
  useEffect(() => {
    const initializeGame = async () => {
      try {
        // For v1, use default stats (no auth required)
        // In v2, we'll fetch actual player stats from the API
        const defaultStats: VQPlayerStats = {
          id: 'guest',
          user_id: 'guest',
          total_dong: 500000, // Starting money: 500k đồng
          current_energy: 100,
          max_energy: 100,
          levels_completed: 0,
          total_conversations: 0,
          translator_uses_total: 0,
          current_streak: 0,
          longest_streak: 0,
          current_world_id: null,
          energy_last_regen: new Date().toISOString(),
        };

        // Load the level into the store
        loadLevel(level, defaultStats);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize game:', err);
        setError('Failed to load game. Please try again.');
        setIsLoading(false);
      }
    };

    initializeGame();

    // Cleanup on unmount
    return () => {
      resetSession();
    };
  }, [level, loadLevel, resetSession]);

  // Handle back navigation
  const handleBack = () => {
    resetSession();
    router.push('/vietquest');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-emerald-900/20 to-slate-900 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
        <p className="text-emerald-300 text-lg font-medium">{worldName}</p>
        <p className="text-slate-400">{level.title_vi}</p>
        <p className="text-slate-500 text-sm mt-2">Loading your adventure...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900 flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-300 text-lg font-medium mb-2">Oops!</p>
        <p className="text-slate-400 mb-6">{error}</p>
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Hub
        </button>
      </div>
    );
  }

  // Game canvas
  return <GameCanvas />;
}
