'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useVietQuestStore } from '@/lib/stores/vietquestStore';
import { Coins, Clock, Languages, Star, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioManager } from '@/lib/vietquest/audioManager';

/**
 * LevelComplete - End screen showing level completion stats and grade
 *
 * Features:
 * - Animated grade reveal
 * - Detailed stats breakdown
 * - Confetti celebration for good grades
 * - Navigation to next level or hub
 */
export function LevelComplete() {
  const router = useRouter();
  // Select individual values to avoid object reference issues
  const completionData = useVietQuestStore((state) => state.completionData);
  const dong = useVietQuestStore((state) => state.dong);
  const exitLevel = useVietQuestStore((state) => state.exitLevel);
  const currentLevel = useVietQuestStore((state) => state.currentLevel);
  const confettiFired = useRef(false);

  // Fire confetti on mount for good grades
  useEffect(() => {
    if (confettiFired.current || !completionData) return;

    const grade = completionData.grade;
    if (grade === 'S' || grade === 'A' || grade === 'B') {
      confettiFired.current = true;
      
      // Play success sound
      audioManager.playSound('reward');

      // Fire confetti
      const duration = grade === 'S' ? 3000 : grade === 'A' ? 2000 : 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#10b981', '#6366f1', '#f59e0b'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#10b981', '#6366f1', '#f59e0b'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [completionData]);

  if (!completionData) return null;

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format đồng
  const formatDong = (amount: number): string => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}k`;
    }
    return amount.toString();
  };

  // Get grade styling
  const getGradeStyle = (grade: string) => {
    switch (grade) {
      case 'S':
        return 'text-yellow-400 bg-yellow-400/20 border-yellow-400';
      case 'A':
        return 'text-emerald-400 bg-emerald-400/20 border-emerald-400';
      case 'B':
        return 'text-blue-400 bg-blue-400/20 border-blue-400';
      case 'C':
        return 'text-purple-400 bg-purple-400/20 border-purple-400';
      case 'D':
        return 'text-orange-400 bg-orange-400/20 border-orange-400';
      default:
        return 'text-slate-400 bg-slate-400/20 border-slate-400';
    }
  };

  // Get grade message
  const getGradeMessage = (grade: string): { vi: string; en: string } => {
    switch (grade) {
      case 'S':
        return { vi: 'Xuất sắc!', en: 'Outstanding!' };
      case 'A':
        return { vi: 'Rất tốt!', en: 'Excellent!' };
      case 'B':
        return { vi: 'Tốt lắm!', en: 'Good job!' };
      case 'C':
        return { vi: 'Khá tốt', en: 'Not bad' };
      case 'D':
        return { vi: 'Cần cố gắng hơn', en: 'Keep trying' };
      default:
        return { vi: 'Tiếp tục luyện tập', en: 'Keep practicing' };
    }
  };

  const gradeMessage = getGradeMessage(completionData.grade);

  const handleContinue = () => {
    exitLevel();
    router.push('/vietquest');
  };

  const handleReplay = () => {
    // Reset and replay current level
    exitLevel();
    if (currentLevel) {
      router.push(`/vietquest/${currentLevel.slug}`);
    } else {
      router.push('/vietquest');
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 flex flex-col items-center justify-center p-6">
      {/* Grade display */}
      <div className="text-center mb-8 animate-fade-in">
        <div
          className={`
            w-32 h-32 rounded-full border-4 flex items-center justify-center mx-auto mb-4
            ${getGradeStyle(completionData.grade)}
          `}
        >
          <span className="text-6xl font-black">{completionData.grade}</span>
        </div>

        <h1 className="text-white text-2xl font-bold mb-1">{gradeMessage.vi}</h1>
        <p className="text-slate-400">{gradeMessage.en}</p>
      </div>

      {/* Stats grid */}
      <div className="w-full max-w-sm grid grid-cols-2 gap-3 mb-8">
        {/* Net đồng */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Coins className="w-4 h-4" />
            <span>Net earnings</span>
          </div>
          <p className={`text-xl font-bold ${completionData.netDong >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {completionData.netDong >= 0 ? '+' : ''}{formatDong(completionData.netDong)}đ
          </p>
        </div>

        {/* Time */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Clock className="w-4 h-4" />
            <span>Time</span>
          </div>
          <p className="text-xl font-bold text-white">
            {formatTime(completionData.timeSpentSeconds)}
          </p>
        </div>

        {/* Perfect responses */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Star className="w-4 h-4" />
            <span>Perfect</span>
          </div>
          <p className="text-xl font-bold text-yellow-400">
            {completionData.perfectResponses}/{completionData.totalResponses}
          </p>
        </div>

        {/* Translator uses */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Languages className="w-4 h-4" />
            <span>Translator</span>
          </div>
          <p className={`text-xl font-bold ${completionData.translatorUses === 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
            {completionData.translatorUses}x
          </p>
        </div>
      </div>

      {/* Total đồng */}
      <div className="bg-amber-500/20 backdrop-blur-sm rounded-xl px-6 py-3 border border-amber-500/30 mb-8">
        <p className="text-amber-300 text-sm text-center mb-1">Total đồng</p>
        <p className="text-amber-400 text-3xl font-bold text-center">
          {formatDong(dong)}đ
        </p>
      </div>

      {/* Actions */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={handleContinue}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          Continue
          <ChevronRight className="w-5 h-5" />
        </button>

        <button
          onClick={handleReplay}
          className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-xl transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
