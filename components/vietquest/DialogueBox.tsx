'use client';

import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Languages } from 'lucide-react';
import { useVietQuestStore } from '@/lib/stores/vietquestStore';
import { NPCS, type NpcEmotion } from '@/lib/vietquest/types';
import { audioManager } from '@/lib/vietquest/audioManager';

interface DialogueBoxProps {
  npcId?: string;
  text: string;
  textEn: string;
  emotion?: NpcEmotion;
  audioPath?: string;
  isNarration?: boolean;
}

/**
 * DialogueBox - Displays NPC dialogue or narration text
 *
 * Features:
 * - Shows Vietnamese text with optional English translation
 * - NPC avatar and name (if not narration)
 * - Audio playback button
 * - Typewriter effect for text reveal
 */
export function DialogueBox({
  npcId,
  text,
  textEn,
  emotion = 'neutral',
  audioPath,
  isNarration = false,
}: DialogueBoxProps) {
  // Per-phrase translation - only pay once per phrase
  const isPhraseTranslated = useVietQuestStore((state) => state.isPhraseTranslated);
  const translatePhrase = useVietQuestStore((state) => state.translatePhrase);
  const energy = useVietQuestStore((state) => state.energy);

  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const npc = npcId ? NPCS[npcId] : null;
  const isTranslated = isPhraseTranslated(text);
  const canAffordTranslation = energy >= 10;
  const [fadeIn, setFadeIn] = useState(false);

  // Fade in animation on mount
  useEffect(() => {
    setFadeIn(false);
    const timer = setTimeout(() => setFadeIn(true), 50);
    return () => clearTimeout(timer);
  }, [text]);

  // Typewriter effect
  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    setShowTranslation(false); // Reset on new text

    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 30); // 30ms per character

    return () => clearInterval(timer);
  }, [text]);

  // Auto-show translation if already cached
  useEffect(() => {
    if (!isTyping && isTranslated) {
      setShowTranslation(true);
    }
  }, [isTyping, isTranslated]);

  // Handle translate button click
  const handleTranslate = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent tap-to-continue
    audioManager.playSound('tap');
    const result = translatePhrase(text);
    if (result.success) {
      setShowTranslation(true);
      audioManager.playSound('success');
    } else {
      audioManager.playSound('error');
    }
  };

  // Play audio
  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent tap-to-continue

    if (!audioPath) return;

    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlayingAudio(false);
      } else {
        audioRef.current.play();
        setIsPlayingAudio(true);
      }
    }
  };

  // Get emotion-based styles
  const emotionStyles: Record<NpcEmotion, string> = {
    neutral: 'border-slate-500/30',
    friendly: 'border-emerald-500/30',
    impatient: 'border-amber-500/30',
    confused: 'border-purple-500/30',
    happy: 'border-yellow-500/30',
    sad: 'border-blue-500/30',
    angry: 'border-red-500/30',
  };

  return (
    <div
      className={`
        relative bg-slate-800/90 backdrop-blur-lg rounded-2xl p-4
        border-2 ${emotionStyles[emotion]}
        shadow-xl transition-all duration-500
        ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      {/* NPC Header (if not narration) */}
      {!isNarration && npc && (
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-700/50">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
            {npc.avatar_path ? (
              <img
                src={npc.avatar_path}
                alt={npc.name_en}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to emoji if image fails
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">
                👤
              </div>
            )}
          </div>

          {/* Name and emotion */}
          <div className="flex-1 min-w-0">
            <p className="text-emerald-400 font-medium truncate">{npc.name_vi}</p>
            <p className="text-slate-400 text-sm truncate">{npc.name_en}</p>
          </div>

          {/* Audio button */}
          {audioPath && (
            <button
              onClick={handlePlayAudio}
              className={`
                p-2 rounded-full transition-all
                ${isPlayingAudio
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }
              `}
            >
              {isPlayingAudio ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Narration indicator */}
      {isNarration && (
        <div className="flex items-center gap-2 mb-3 text-slate-400 text-sm">
          <span className="w-8 h-0.5 bg-slate-600" />
          <span>Narration</span>
          <span className="flex-1 h-0.5 bg-slate-600" />
        </div>
      )}

      {/* Main Vietnamese text */}
      <p className="text-white text-lg leading-relaxed">
        {displayedText}
        {isTyping && <span className="animate-pulse">▋</span>}
      </p>

      {/* Translation section */}
      {!isTyping && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          {showTranslation ? (
            // Show translation (cached or just translated)
            <p className="text-slate-400 text-sm italic">
              {textEn}
              {isTranslated && (
                <span className="ml-2 text-emerald-500/70 text-xs">(cached)</span>
              )}
            </p>
          ) : (
            // Show translate button
            <button
              onClick={handleTranslate}
              disabled={!canAffordTranslation}
              className={`
                flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-all
                ${canAffordTranslation
                  ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                }
              `}
            >
              <Languages className="w-4 h-4" />
              <span>Translate</span>
              <span className="text-purple-400 text-xs">-10⚡</span>
            </button>
          )}
        </div>
      )}

      {/* Hidden audio element */}
      {audioPath && (
        <audio
          ref={audioRef}
          src={`/vietquest/audio/${audioPath}`}
          onEnded={() => setIsPlayingAudio(false)}
          onError={() => setIsPlayingAudio(false)}
        />
      )}
    </div>
  );
}
