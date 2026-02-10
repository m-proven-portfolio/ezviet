'use client';

import { useEffect, useState } from 'react';
import { useVietQuestStore } from '@/lib/stores/vietquestStore';
import {
  isNarrationNode,
  isNpcSaysNode,
  isPlayerChoiceNode,
  isResponsePickerNode,
  isRewardNode,
} from '@/lib/vietquest/types';
import { DialogueBox } from './DialogueBox';
import { ChoiceMenu } from './ChoiceMenu';
import { ResponsePicker } from './ResponsePicker';
import { WalletDisplay } from './WalletDisplay';
import { RewardScreen } from './RewardScreen';
import { LevelComplete } from './LevelComplete';
import { VietQuestLanding } from './VietQuestLanding';
import { Loader2, SkipForward } from 'lucide-react';
import { audioManager } from '@/lib/vietquest/audioManager';

/**
 * GameCanvas - Main game container that orchestrates gameplay
 *
 * Renders the current scene background and delegates to sub-components
 * based on the current node type.
 */
export function GameCanvas() {
  // Select individual values to avoid object reference issues
  const phase = useVietQuestStore((state) => state.phase);
  const currentNode = useVietQuestStore((state) => state.currentNode);
  const currentScene = useVietQuestStore((state) => state.currentScene);
  const error = useVietQuestStore((state) => state.error);
  const isInIntroScene = useVietQuestStore((state) => state.isInIntroScene);
  const advanceToNode = useVietQuestStore((state) => state.advanceToNode);
  const startLevel = useVietQuestStore((state) => state.startLevel);
  const skipIntro = useVietQuestStore((state) => state.skipIntro);
  
  // Landing page state
  const [showLanding, setShowLanding] = useState(true);
  const [sceneTransition, setSceneTransition] = useState(false);
  const prevSceneId = useVietQuestStore((state) => state.currentScene?.id);

  // Handle start game from landing
  const handleStartGame = () => {
    audioManager.playSound('transition');
    setShowLanding(false);
  };

  // Auto-start level when loaded
  useEffect(() => {
    if (phase === 'loading' && currentNode && !error) {
      startLevel();
    }
  }, [phase, currentNode, error, startLevel]);
  
  // Scene transition animation
  useEffect(() => {
    if (currentScene && prevSceneId && prevSceneId !== currentScene.id) {
      setSceneTransition(true);
      audioManager.playSound('transition');
      const timer = setTimeout(() => setSceneTransition(false), 500);
      return () => clearTimeout(timer);
    }
  }, [currentScene, prevSceneId]);

  // Handle narration auto-advance (tap anywhere)
  const handleNarrationTap = () => {
    if (currentNode && isNarrationNode(currentNode) && currentNode.next) {
      advanceToNode(currentNode.next);
    }
  };

  // Show landing page first
  if (showLanding) {
    return <VietQuestLanding onStartGame={handleStartGame} />;
  }

  // Loading state
  if (phase === 'loading' && !currentNode) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-emerald-200">Loading adventure...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-red-900 via-red-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-red-200 text-lg mb-4">Oops! Something went wrong</p>
          <p className="text-red-300/70 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Level complete state
  if (phase === 'completed') {
    return <LevelComplete />;
  }

  // No current node (shouldn't happen in normal flow)
  if (!currentNode) {
    return null;
  }

  // Get background image for current scene from Supabase Storage
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const backgroundImage = currentScene?.background
    ? `${supabaseUrl}/storage/v1/object/public/vietquest/backgrounds/${currentScene.background}`
    : `${supabaseUrl}/storage/v1/object/public/vietquest/backgrounds/default.webp`;

  return (
    <div className="fixed inset-0 bg-slate-900 overflow-hidden">
      {/* Background image with overlay - graceful fallback to gradient */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-all duration-500 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 ${sceneTransition ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
        style={{ backgroundImage: currentScene?.background ? `url(${backgroundImage})` : undefined }}
      >
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-slate-900/30" />
      </div>

      {/* Wallet HUD - top right */}
      <WalletDisplay />

      {/* Skip intro button - shown during intro scenes */}
      {isInIntroScene && (
        <button
          onClick={skipIntro}
          className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-800/80 backdrop-blur-lg rounded-full px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700/80 transition-all border border-slate-700/50"
        >
          <span className="text-sm">Skip intro</span>
          <SkipForward className="w-4 h-4" />
        </button>
      )}

      {/* Main content area */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Spacer to push content to bottom */}
        <div className="flex-1" />

        {/* Game content - bottom half of screen */}
        <div className="px-4 pb-8 pt-4 space-y-4">
          {/* Narration Node */}
          {isNarrationNode(currentNode) && (
            <div
              onClick={handleNarrationTap}
              className="cursor-pointer active:scale-[0.99] transition-transform"
            >
              <DialogueBox
                text={currentNode.text_vi}
                textEn={currentNode.text_en}
                isNarration
              />
              <p className="text-center text-emerald-400/60 text-sm mt-3 animate-pulse">
                Tap to continue
              </p>
            </div>
          )}

          {/* NPC Says Node */}
          {isNpcSaysNode(currentNode) && (
            <div
              onClick={() => currentNode.next && advanceToNode(currentNode.next)}
              className="cursor-pointer active:scale-[0.99] transition-transform"
            >
              <DialogueBox
                npcId={currentNode.npc}
                text={currentNode.text_vi}
                textEn={currentNode.text_en}
                emotion={currentNode.emotion}
                audioPath={currentNode.audio_path}
              />
              <p className="text-center text-emerald-400/60 text-sm mt-3 animate-pulse">
                Tap to continue
              </p>
            </div>
          )}

          {/* Player Choice Node */}
          {isPlayerChoiceNode(currentNode) && (
            <ChoiceMenu
              prompt={currentNode.prompt}
              choices={currentNode.choices}
            />
          )}

          {/* Response Picker Node */}
          {isResponsePickerNode(currentNode) && (
            <ResponsePicker
              contextEn={currentNode.context_en}
              options={currentNode.options}
              perfectBonusDong={currentNode.perfect_bonus_dong}
              showTranslation={currentNode.show_translation}
            />
          )}

          {/* Reward Node */}
          {isRewardNode(currentNode) && (
            <RewardScreen
              dong={currentNode.dong}
              energy={currentNode.energy}
              messageVi={currentNode.message_vi}
              messageEn={currentNode.message_en}
              onContinue={() => currentNode.next && advanceToNode(currentNode.next)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
