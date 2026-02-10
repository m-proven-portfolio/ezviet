'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { isNetworkError } from '@/lib/utils';
import { ExploreMode } from '@/components/labels/ExploreMode';
import { QuizMode } from '@/components/labels/QuizMode';
import { ResultsScreen } from '@/components/labels/ResultsScreen';
import { LabelActions } from '@/components/labels/LabelActions';
import type {
  LabelSetWithLabels,
  InteractiveMode,
  QuizAnswer,
  QuizResult,
  LabelSetProgress,
} from '@/lib/labels/types';

interface LabelPageClientProps {
  labelSet: LabelSetWithLabels;
}

export function LabelPageClient({ labelSet }: LabelPageClientProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<InteractiveMode>('explore');
  const [exploredIds, setExploredIds] = useState<Set<string>>(new Set());
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [progress, setProgress] = useState<LabelSetProgress | null>(null);

  // Fetch user's progress on mount
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch(`/api/labels/${labelSet.slug}/progress`);
        if (res.ok) {
          const data = await res.json();
          setProgress(data);
        }
      } catch (error) {
        if (!isNetworkError(error)) {
          console.error('Failed to fetch progress:', error);
        }
      }
    };

    if (user) {
      fetchProgress();
    }
  }, [user, labelSet.slug]);

  // Handle label exploration (click in explore mode)
  const handleLabelExplored = useCallback((labelId: string) => {
    setExploredIds((prev) => {
      const next = new Set(prev);
      next.add(labelId);
      return next;
    });
  }, []);

  // Save exploration progress periodically
  useEffect(() => {
    if (user && exploredIds.size > 0) {
      const saveExploration = async () => {
        try {
          await fetch(`/api/labels/${labelSet.slug}/progress`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ labels_explored: exploredIds.size }),
          });
        } catch (error) {
          if (!isNetworkError(error)) {
            console.error('Failed to save exploration:', error);
          }
        }
      };
      saveExploration();
    }
  }, [user, exploredIds.size, labelSet.slug]);

  // Start quiz mode
  const handleStartQuiz = useCallback(() => {
    setMode('quiz');
    setAnswers([]);
    setCurrentIndex(0);
    setQuizStartTime(Date.now());
  }, []);

  // Handle quiz answer submission
  const handleAnswer = useCallback((answer: QuizAnswer) => {
    setAnswers((prev) => [...prev, answer]);
    setCurrentIndex((prev) => prev + 1);
  }, []);

  // Handle quiz completion
  const handleQuizComplete = useCallback(async () => {
    const endTime = Date.now();
    const timeSeconds = Math.round(((endTime - (quizStartTime || endTime)) / 1000));
    const correct = answers.filter((a) => a.isCorrect).length;
    const total = labelSet.labels.length;
    const score = Math.round((correct / total) * 100);

    // Calculate hint penalties
    const totalHintPenalty = answers.reduce((sum, a) => sum + (a.hintPenalty || 0), 0);
    const questionsWithHints = answers.filter((a) => a.hintsUsed?.length > 0).length;

    // Create initial result
    let result: QuizResult = {
      correct,
      total,
      score,
      timeSeconds,
      answers,
      isNewBest: false,
      bestScore: score,
      bestTime: timeSeconds,
      attempts: 1,
      totalHintPenalty,
      questionsWithHints,
    };

    // Submit to API if user is logged in
    if (user) {
      try {
        const res = await fetch(`/api/labels/${labelSet.slug}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            correct,
            total,
            time_seconds: timeSeconds,
            answers, // Include individual answers for spaced repetition
          }),
        });

        if (res.ok) {
          const apiResult = await res.json();
          result = {
            ...result,
            isNewBest: apiResult.is_new_best,
            bestScore: apiResult.best_score,
            bestTime: apiResult.best_time,
            attempts: apiResult.attempts,
          };
        }
      } catch (error) {
        if (!isNetworkError(error)) {
          console.error('Failed to submit quiz results:', error);
        }
      }
    }

    setQuizResult(result);
    setMode('results');
  }, [answers, quizStartTime, labelSet.labels.length, labelSet.slug, user]);

  // Return to explore mode
  const handleExplore = useCallback(() => {
    setMode('explore');
    setQuizResult(null);
  }, []);

  // Retry quiz
  const handleRetry = useCallback(() => {
    setMode('quiz');
    setAnswers([]);
    setCurrentIndex(0);
    setQuizStartTime(Date.now());
    setQuizResult(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with title and instructions */}
      <header className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
          {labelSet.title}
        </h1>
        {labelSet.description && (
          <p className="text-slate-600 mb-2">{labelSet.description}</p>
        )}
        {labelSet.instructions && mode === 'explore' && (
          <p className="text-sm text-slate-500 italic">{labelSet.instructions}</p>
        )}

        {/* Progress indicator */}
        {progress && progress.best_score > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-jade-50 text-jade-700 rounded-full text-sm">
            <span>Best Score: {progress.best_score}%</span>
            {progress.completed_at && (
              <span className="text-jade-500">Completed</span>
            )}
          </div>
        )}

        {/* Share/QR/Print actions */}
        <LabelActions slug={labelSet.slug} title={labelSet.title} />
      </header>

      {/* Main content based on mode */}
      {mode === 'explore' && (
        <ExploreMode
          labelSet={labelSet}
          exploredIds={exploredIds}
          onLabelExplored={handleLabelExplored}
          onStartQuiz={handleStartQuiz}
        />
      )}

      {mode === 'quiz' && (
        <QuizMode
          labelSet={labelSet}
          currentIndex={currentIndex}
          answers={answers}
          onAnswer={handleAnswer}
          onComplete={handleQuizComplete}
        />
      )}

      {mode === 'results' && quizResult && (
        <ResultsScreen
          result={quizResult}
          labelSet={labelSet}
          onRetry={handleRetry}
          onExplore={handleExplore}
        />
      )}

      {/* Mode indicator */}
      <footer className="text-center text-xs text-slate-400">
        {mode === 'explore' && (
          <span>
            Explored {exploredIds.size} of {labelSet.labels.length} labels
          </span>
        )}
        {mode === 'quiz' && (
          <span>
            Question {Math.min(currentIndex + 1, labelSet.labels.length)} of{' '}
            {labelSet.labels.length}
          </span>
        )}
      </footer>
    </div>
  );
}
