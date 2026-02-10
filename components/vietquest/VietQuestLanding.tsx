'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Sparkles, Zap, Coins, Map, ArrowRight, Volume2 } from 'lucide-react';
import { audioManager } from '@/lib/vietquest/audioManager';

interface VietQuestLandingProps {
  onStartGame: () => void;
}

/**
 * VietQuestLanding - Cinematic landing page with instant clarity
 * 
 * Shows:
 * - What VietQuest is (immersive language learning game)
 * - How it works (energy + money system)
 * - Play Now CTA
 */
export function VietQuestLanding({ onStartGame }: VietQuestLandingProps) {
  const [showContent, setShowContent] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    // Fade in content after mount
    setTimeout(() => setShowContent(true), 100);
    
    // Initialize audio on mount
    audioManager.initialize();
  }, []);

  const handlePlayClick = () => {
    audioManager.playSound('success');
    onStartGame();
  };

  const toggleAudio = () => {
    const newState = audioManager.toggle();
    setAudioEnabled(newState);
    audioManager.playSound('tap');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
      </div>

      {/* Audio toggle */}
      <button
        onClick={toggleAudio}
        className="absolute top-6 right-6 z-10 p-3 bg-slate-800/50 backdrop-blur-lg rounded-full border border-slate-700/50 hover:bg-slate-700/50 transition-all"
      >
        <Volume2 className={`w-5 h-5 ${audioEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
      </button>

      {/* Main content */}
      <div className={`relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12 transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="inline-block relative">
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-3 tracking-tight">
              VietQuest
            </h1>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
          </div>
          <p className="text-2xl text-emerald-300 font-medium">
            Đà Lạt Adventure
          </p>
        </div>

        {/* Tagline */}
        <div className="text-center mb-12 max-w-xl">
          <p className="text-xl text-slate-200 leading-relaxed">
            Don't just <span className="text-emerald-400 font-semibold">study</span> Vietnamese.
          </p>
          <p className="text-xl text-slate-200 leading-relaxed">
            <span className="text-amber-400 font-semibold">Live it</span> through adventure.
          </p>
        </div>

        {/* How it works - Quick cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-4xl w-full">
          {/* Energy card */}
          <div className="bg-slate-800/60 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 hover:border-purple-500/50 transition-all hover:scale-105">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Energy System</h3>
            <p className="text-slate-400 text-sm">
              Translation costs energy, not money. Think before you translate!
            </p>
          </div>

          {/* Dong card */}
          <div className="bg-slate-800/60 backdrop-blur-lg rounded-2xl p-6 border border-amber-500/30 hover:border-amber-500/50 transition-all hover:scale-105">
            <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
              <Coins className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Earn Đồng</h3>
            <p className="text-slate-400 text-sm">
              Make good choices, speak Vietnamese, earn real currency!
            </p>
          </div>

          {/* Adventure card */}
          <div className="bg-slate-800/60 backdrop-blur-lg rounded-2xl p-6 border border-emerald-500/30 hover:border-emerald-500/50 transition-all hover:scale-105">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
              <Map className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Real Scenarios</h3>
            <p className="text-slate-400 text-sm">
              From airport to hotel. Navigate Vietnam like a local.
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handlePlayClick}
          className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg rounded-full shadow-2xl hover:shadow-emerald-500/50 transition-all hover:scale-105 active:scale-95"
        >
          <div className="flex items-center gap-3">
            <Play className="w-6 h-6 fill-current" />
            <span>Start Adventure</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
          
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 blur-lg opacity-50 group-hover:opacity-75 transition-opacity -z-10" />
        </button>

        <p className="text-slate-400 text-sm mt-4">
          Start with <span className="text-purple-400 font-semibold">100 energy</span> • Level 1 ready
        </p>

        {/* Back to hub link */}
        <Link
          href="/vietquest"
          className="mt-8 text-slate-500 hover:text-slate-300 text-sm transition-colors"
        >
          ← Back to world selection
        </Link>
      </div>

      {/* CSS for blob animation */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
