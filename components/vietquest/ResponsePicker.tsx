'use client';

import { useState, useRef } from 'react';
import { useVietQuestStore } from '@/lib/stores/vietquestStore';
import type { ResponseOption, ResponseQuality } from '@/lib/vietquest/types';
import { Volume2, Check, Star, Sparkles, Loader2, Languages } from 'lucide-react';

interface ResponsePickerProps {
  contextEn: string;
  options: ResponseOption[];
  perfectBonusDong: number;
  showTranslation: boolean;
}

// Cache for generated audio URLs (persists across re-renders)
const audioCache = new Map<string, string>();

/**
 * ResponsePicker - Vietnamese phrase selection component
 *
 * This is the core learning mechanic for v1 (instead of speech recognition).
 * Players tap Vietnamese phrases to hear pronunciation, then select their response.
 *
 * Features:
 * - Tap to hear audio pronunciation (generated via TTS on-demand)
 * - Visual quality indicators (perfect/good/awkward/wrong)
 * - Translation shown based on translator toggle
 * - Celebratory feedback for perfect responses
 */
export function ResponsePicker({
  contextEn,
  options,
  perfectBonusDong,
  showTranslation,
}: ResponsePickerProps) {
  // Per-phrase translation cache
  const isPhraseTranslated = useVietQuestStore((state) => state.isPhraseTranslated);
  const translatePhrase = useVietQuestStore((state) => state.translatePhrase);
  const energy = useVietQuestStore((state) => state.energy);
  const selectResponse = useVietQuestStore((state) => state.selectResponse);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [hasSelected, setHasSelected] = useState(false);
  // Track which options have been translated in this session (for immediate UI update)
  const [translatedOptions, setTranslatedOptions] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const canAffordTranslation = energy >= 10;

  // Check if translation should be shown for an option
  const shouldShowOptionTranslation = (option: ResponseOption) => {
    // Always show if showTranslation prop is true (node config)
    if (showTranslation) return true;
    // Show if cached or translated this session
    return isPhraseTranslated(option.text_vi) || translatedOptions.has(option.id);
  };

  // Handle translating a single option
  const handleTranslateOption = (option: ResponseOption, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = translatePhrase(option.text_vi);
    if (result.success) {
      setTranslatedOptions(prev => new Set([...prev, option.id]));
    }
  };

  // Play audio for an option (generates via TTS if needed)
  const playAudio = async (option: ResponseOption, e: React.MouseEvent) => {
    e.stopPropagation();

    // Create audio element if needed
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    // Stop current audio if playing
    if (playingAudioId === option.id) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayingAudioId(null);
      return;
    }

    // Check cache first
    const cacheKey = option.text_vi;
    let audioUrl = audioCache.get(cacheKey);

    if (!audioUrl) {
      // Generate audio via TTS API
      setLoadingAudioId(option.id);
      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: option.text_vi,
            filenameHint: `vq-${option.id}`,
          }),
        });

        if (!response.ok) {
          console.error('TTS generation failed');
          setLoadingAudioId(null);
          return;
        }

        const data = await response.json();
        audioUrl = data.publicUrl as string;
        audioCache.set(cacheKey, audioUrl);
      } catch (error) {
        console.error('TTS error:', error);
        setLoadingAudioId(null);
        return;
      }
      setLoadingAudioId(null);
    }

    // Play the audio (audioUrl is guaranteed to be defined at this point)
    if (!audioUrl) return;
    audioRef.current.src = audioUrl;
    audioRef.current.play();
    setPlayingAudioId(option.id);

    audioRef.current.onended = () => setPlayingAudioId(null);
    audioRef.current.onerror = () => setPlayingAudioId(null);
  };

  // Select an option (tap to preview, tap again to confirm)
  const handleOptionTap = (option: ResponseOption) => {
    if (hasSelected) return; // Already made final selection

    if (selectedId === option.id) {
      // Second tap - confirm selection
      setHasSelected(true);

      // Small delay for visual feedback before transitioning
      setTimeout(() => {
        selectResponse(option.id, option.quality, option.result);
      }, 500);
    } else {
      // First tap - preview selection
      setSelectedId(option.id);
    }
  };

  // Get quality-based styling
  const getQualityStyle = (quality: ResponseQuality, isSelected: boolean) => {
    const baseStyle = isSelected ? 'ring-2 ring-offset-2 ring-offset-slate-900' : '';

    switch (quality) {
      case 'perfect':
        return `${baseStyle} ${isSelected ? 'ring-emerald-500 bg-emerald-500/20 border-emerald-500' : 'border-slate-600 hover:border-emerald-500/50'}`;
      case 'good':
        return `${baseStyle} ${isSelected ? 'ring-blue-500 bg-blue-500/20 border-blue-500' : 'border-slate-600 hover:border-blue-500/50'}`;
      case 'awkward':
        return `${baseStyle} ${isSelected ? 'ring-amber-500 bg-amber-500/20 border-amber-500' : 'border-slate-600 hover:border-amber-500/50'}`;
      case 'wrong':
        return `${baseStyle} ${isSelected ? 'ring-red-500 bg-red-500/20 border-red-500' : 'border-slate-600 hover:border-red-500/50'}`;
    }
  };

  // Get quality icon
  const QualityIcon = ({ quality }: { quality: ResponseQuality }) => {
    switch (quality) {
      case 'perfect':
        return <Star className="w-4 h-4 text-emerald-400" />;
      case 'good':
        return <Check className="w-4 h-4 text-blue-400" />;
      case 'awkward':
        return <span className="text-amber-400 text-sm">~</span>;
      case 'wrong':
        return <span className="text-red-400 text-sm">✗</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Context/prompt */}
      <div className="bg-slate-800/80 backdrop-blur-lg rounded-xl p-4 border border-slate-700/50">
        <p className="text-purple-400 text-sm font-medium mb-1">Your response</p>
        <p className="text-white">{contextEn}</p>
        {perfectBonusDong > 0 && (
          <p className="text-emerald-400/70 text-sm mt-2 flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            +{(perfectBonusDong / 1000).toFixed(0)}k đồng bonus for perfect response!
          </p>
        )}
      </div>

      {/* Instructions */}
      <p className="text-slate-400 text-sm text-center">
        {selectedId
          ? 'Tap again to confirm your choice'
          : 'Tap a phrase to hear it, tap again to select'}
      </p>

      {/* Response options */}
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedId === option.id;
          const isPlaying = playingAudioId === option.id;

          const isDisabled = hasSelected && selectedId !== option.id;

          return (
            <div
              key={option.id}
              role="button"
              tabIndex={isDisabled ? -1 : 0}
              onClick={() => !isDisabled && handleOptionTap(option)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
                  e.preventDefault();
                  handleOptionTap(option);
                }
              }}
              className={`
                w-full p-4 rounded-xl border-2 transition-all text-left cursor-pointer
                ${getQualityStyle(option.quality, isSelected)}
                ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}
                ${hasSelected && isSelected ? 'animate-pulse' : ''}
                active:scale-[0.98]
              `}
            >
              <div className="flex items-start gap-3">
                {/* Audio button - generates TTS on-demand */}
                <button
                  onClick={(e) => playAudio(option, e)}
                  disabled={loadingAudioId === option.id}
                  className={`
                    p-2 rounded-full transition-all flex-shrink-0
                    ${isPlaying
                      ? 'bg-emerald-500 text-white'
                      : loadingAudioId === option.id
                        ? 'bg-slate-600 text-slate-400'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }
                  `}
                >
                  {loadingAudioId === option.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-lg">{option.text_vi}</p>
                  {shouldShowOptionTranslation(option) ? (
                    <p className="text-slate-400 text-sm mt-1">
                      {option.text_en}
                      {isPhraseTranslated(option.text_vi) && !showTranslation && (
                        <span className="ml-1 text-emerald-500/70 text-xs">(cached)</span>
                      )}
                    </p>
                  ) : (
                    <button
                      onClick={(e) => handleTranslateOption(option, e)}
                      disabled={!canAffordTranslation}
                      className={`
                        flex items-center gap-1 text-xs mt-1 px-2 py-0.5 rounded transition-all
                        ${canAffordTranslation
                          ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
                          : 'text-slate-600 cursor-not-allowed'
                        }
                      `}
                    >
                      <Languages className="w-3 h-3" />
                      <span>Translate</span>
                      <span className="text-purple-400">-10⚡</span>
                    </button>
                  )}
                </div>

                {/* Quality indicator (only shown when selected) */}
                {isSelected && (
                  <div className="flex-shrink-0">
                    <QualityIcon quality={option.quality} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
