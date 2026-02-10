'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToneGymStore } from '@/lib/stores/toneGymStore';
import { ToneExercise, ToneSessionComplete } from '@/components/tone-gym';
import type { ToneExercise as ToneExerciseType, ToneSessionResults } from '@/lib/tone-gym/types';
import { createClient } from '@/lib/supabase/client';

export default function ToneGymSessionPage() {
  const params = useParams();
  const router = useRouter();
  const difficultyParam = params.difficulty as string;

  // Validate and parse difficulty
  const difficulty = parseInt(difficultyParam, 10) as 1 | 2 | 3;
  const isValidDifficulty = [1, 2, 3].includes(difficulty);

  // Store state
  const phase = useToneGymStore((state) => state.phase);
  const session = useToneGymStore((state) => state.session);
  const startSession = useToneGymStore((state) => state.startSession);
  const resetSession = useToneGymStore((state) => state.resetSession);
  const getCurrentQuestion = useToneGymStore((state) => state.getCurrentQuestion);

  // Local state for loading exercises
  const [exercises, setExercises] = useState<ToneExerciseType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ToneSessionResults | null>(null);

  // Fetch exercises on mount
  useEffect(() => {
    if (!isValidDifficulty) {
      router.replace('/tone-gym');
      return;
    }

    async function fetchExercises() {
      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('tone_exercises')
          .select('*')
          .eq('is_active', true)
          .lte('difficulty', difficulty) // Include easier exercises too
          .order('difficulty', { ascending: false });

        if (fetchError) throw fetchError;

        if (!data || data.length === 0) {
          setError('No exercises available. Please check back later.');
          return;
        }

        setExercises(data as ToneExerciseType[]);
      } catch (err) {
        console.error('Failed to fetch exercises:', err);
        setError('Failed to load exercises. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchExercises();

    // Cleanup on unmount
    return () => {
      resetSession();
    };
  }, [difficulty, isValidDifficulty, router, resetSession]);

  // Start session when exercises are loaded and we're idle
  useEffect(() => {
    if (exercises.length > 0 && phase === 'idle') {
      startSession(difficulty, exercises);
    }
  }, [exercises, phase, difficulty, startSession]);

  // Capture results when session completes
  useEffect(() => {
    if (phase === 'complete' && session) {
      // Calculate results from session
      const correctAnswers = session.answers.filter((a) => a.isCorrect).length;
      const totalQuestions = session.answers.length;
      const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      const timeSeconds = session.endTime
        ? (session.endTime - session.startTime) / 1000
        : 0;

      // Tone breakdown
      const toneBreakdown = {
        ngang: { correct: 0, total: 0 },
        sắc: { correct: 0, total: 0 },
        huyền: { correct: 0, total: 0 },
        hỏi: { correct: 0, total: 0 },
        ngã: { correct: 0, total: 0 },
        nặng: { correct: 0, total: 0 },
      };

      const confusedPairs: Array<{ selected: typeof session.answers[0]['selectedTone']; correct: typeof session.answers[0]['correctTone'] }> = [];

      for (const answer of session.answers) {
        toneBreakdown[answer.correctTone].total++;
        if (answer.isCorrect) {
          toneBreakdown[answer.correctTone].correct++;
        } else {
          confusedPairs.push({
            selected: answer.selectedTone,
            correct: answer.correctTone,
          });
        }
      }

      const streak = useToneGymStore.getState().currentStreak;
      const bestStreak = useToneGymStore.getState().bestStreak;

      setResults({
        totalQuestions,
        correctAnswers,
        accuracy,
        timeSeconds,
        avgTimePerQuestion: totalQuestions > 0 ? timeSeconds / totalQuestions : 0,
        currentStreak: streak,
        newBestStreak: streak > bestStreak,
        toneBreakdown,
        confusedPairs,
      });
    }
  }, [phase, session]);

  // Handle back button
  const handleBack = () => {
    resetSession();
    router.push('/tone-gym');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading exercises...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Session complete
  if (phase === 'complete' && results) {
    return <ToneSessionComplete results={results} difficulty={difficulty} />;
  }

  // Get current question
  const currentQuestion = getCurrentQuestion();

  // Playing state
  if ((phase === 'playing' || phase === 'feedback') && currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        {/* Header with back button */}
        <div className="flex-shrink-0 px-4 pt-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Exit</span>
          </button>
        </div>

        {/* Exercise */}
        <div className="flex-1 overflow-hidden">
          <ToneExercise question={currentQuestion} />
        </div>
      </div>
    );
  }

  // Fallback loading
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
    </div>
  );
}
