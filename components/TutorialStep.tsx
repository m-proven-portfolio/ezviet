'use client';

import { useState, useRef, useCallback } from 'react';
import { Volume2, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { type TutorialStep as TutorialStepType, STEP_CONTENT } from '@/lib/onboarding/constants';

interface TutorialStepProps {
  step: TutorialStepType;
  onAction: () => void;
}

export function TutorialStep({ step, onAction }: TutorialStepProps) {
  const content = STEP_CONTENT[step];

  switch (step) {
    case 'welcome':
      return <WelcomeStep content={content} onAction={onAction} />;
    case 'listen':
      return <ListenStep content={content} onAction={onAction} />;
    case 'swipe':
      return <SwipeStep content={content} onAction={onAction} />;
    case 'karaoke':
      return <KaraokeStep content={content} onAction={onAction} />;
    case 'complete':
      return <CompleteStep content={content} onAction={onAction} />;
    default:
      return null;
  }
}

interface StepProps {
  content: (typeof STEP_CONTENT)[TutorialStepType];
  onAction: () => void;
}

function WelcomeStep({ content, onAction }: StepProps) {
  return (
    <div className="text-center px-6 py-8">
      <h2 className="text-4xl font-bold text-white mb-2">{content.title}</h2>
      <p className="text-emerald-100 text-lg mb-4">{content.subtitle}</p>
      <p className="text-white/80 mb-8">{content.instruction}</p>
      <button
        onClick={onAction}
        className="px-8 py-4 bg-white text-emerald-600 font-bold rounded-xl shadow-lg hover:bg-emerald-50 transition-all hover:scale-105"
      >
        {content.buttonText}
      </button>
    </div>
  );
}

function ListenStep({ content, onAction }: StepProps) {
  const [hasPlayed, setHasPlayed] = useState(false);

  const handlePlay = () => {
    setHasPlayed(true);
    // Play a sample sound
    const utterance = new SpeechSynthesisUtterance('Xin chao');
    utterance.lang = 'vi-VN';
    utterance.onend = onAction;
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="text-center px-6 py-8">
      <h2 className="text-2xl font-bold text-white mb-2">{content.title}</h2>
      <p className="text-emerald-100 mb-6">{content.instruction}</p>

      {/* Animated speaker button */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handlePlay}
          disabled={hasPlayed}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            hasPlayed
              ? 'bg-emerald-300 text-emerald-700'
              : 'bg-white text-emerald-600 animate-spotlight hover:scale-110'
          }`}
        >
          <Volume2 className="w-10 h-10" />
          {!hasPlayed && (
            <span className="absolute -bottom-8 text-white/80 text-sm animate-bounce">
              Tap me!
            </span>
          )}
        </button>

        {hasPlayed && (
          <p className="text-emerald-200 text-sm animate-fade-in">
            Completing...
          </p>
        )}
      </div>
    </div>
  );
}

function SwipeStep({ content, onAction }: StepProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    startX.current = clientX;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - startX.current;
    setOffsetX(diff);
  };

  const handleEnd = useCallback(() => {
    if (Math.abs(offsetX) > 80) {
      onAction();
    } else {
      setOffsetX(0);
    }
    setIsDragging(false);
  }, [offsetX, onAction]);

  return (
    <div className="text-center px-6 py-8">
      <h2 className="text-2xl font-bold text-white mb-2">{content.title}</h2>
      <p className="text-emerald-100 mb-6">{content.instruction}</p>

      {/* Demo swipeable card */}
      <div className="relative h-40 flex items-center justify-center">
        {/* Chevron hints */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <ChevronLeft className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <ChevronRight className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Demo card */}
        <div
          ref={cardRef}
          onMouseDown={(e) => handleStart(e.clientX)}
          onMouseMove={(e) => handleMove(e.clientX)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={(e) => handleStart(e.touches[0].clientX)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX)}
          onTouchEnd={handleEnd}
          className="w-32 h-32 bg-white rounded-2xl shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
          style={{
            transform: `translateX(${offsetX}px) rotate(${offsetX * 0.05}deg)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          <span className="text-3xl">🇻🇳</span>
        </div>
      </div>

      {/* Hand gesture hint */}
      <div className="mt-4 flex justify-center">
        <div className="animate-swipe-hint text-3xl">👆</div>
      </div>
    </div>
  );
}

function KaraokeStep({ content, onAction }: StepProps) {
  const [hasPlayed, setHasPlayed] = useState(false);

  const handlePlay = () => {
    setHasPlayed(true);
    setTimeout(onAction, 500);
  };

  return (
    <div className="text-center px-6 py-8">
      <h2 className="text-2xl font-bold text-white mb-2">{content.title}</h2>
      <p className="text-emerald-100 mb-6">{content.instruction}</p>

      {/* Play button */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handlePlay}
          disabled={hasPlayed}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            hasPlayed
              ? 'bg-purple-300 text-purple-700'
              : 'bg-purple-100 text-purple-600 animate-spotlight hover:scale-110'
          }`}
        >
          <Play className="w-10 h-10 ml-1" />
          {!hasPlayed && (
            <span className="absolute -bottom-8 text-white/80 text-sm animate-bounce">
              Tap me!
            </span>
          )}
        </button>

        {/* Music notes decoration */}
        <div className="flex gap-2 text-2xl opacity-60">
          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>🎵</span>
          <span className="animate-bounce" style={{ animationDelay: '150ms' }}>🎶</span>
          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>🎵</span>
        </div>
      </div>
    </div>
  );
}

function CompleteStep({ content, onAction }: StepProps) {
  return (
    <div className="text-center px-6 py-8">
      <div className="text-5xl mb-4">🎉</div>
      <h2 className="text-4xl font-bold text-white mb-2">{content.title}</h2>
      <p className="text-emerald-100 text-lg mb-4">{content.subtitle}</p>
      <p className="text-white/80 mb-8">{content.instruction}</p>
      <button
        onClick={onAction}
        className="px-8 py-4 bg-white text-emerald-600 font-bold rounded-xl shadow-lg hover:bg-emerald-50 transition-all hover:scale-105"
      >
        {content.buttonText}
      </button>
    </div>
  );
}
