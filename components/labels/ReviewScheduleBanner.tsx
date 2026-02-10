'use client';

import { useEffect, useState, useCallback } from 'react';
import { Clock, CheckCircle, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import type { ReviewSchedule } from '@/lib/labels/types';
import { isNetworkError } from '@/lib/utils';

interface ReviewScheduleBannerProps {
  slug: string;
  onStartReview?: (labelIds: string[]) => void;
}

/**
 * Banner showing spaced repetition review status
 * Displays count of labels due for review and button to start review session
 */
export function ReviewScheduleBanner({ slug, onStartReview }: ReviewScheduleBannerProps) {
  const [schedule, setSchedule] = useState<ReviewSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await fetch(`/api/labels/${slug}/reviews`);

      if (!res.ok) {
        if (res.status === 401) {
          // Not logged in - don't show banner
          setSchedule(null);
          return;
        }
        throw new Error('Failed to fetch');
      }

      const data: ReviewSchedule = await res.json();
      setSchedule(data);
    } catch (err) {
      if (!isNetworkError(err)) {
        console.error('Failed to fetch review schedule:', err);
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Don't show if loading, error, or no schedule
  if (loading) {
    return null; // Silent loading - don't show spinner for banner
  }

  if (error || !schedule) {
    return null;
  }

  // Don't show if no labels are due
  if (schedule.due_count === 0 && schedule.upcoming_count === 0) {
    return null;
  }

  const handleStartReview = () => {
    if (onStartReview && schedule.labels_due.length > 0) {
      onStartReview(schedule.labels_due.map((l) => l.id));
    }
  };

  // Show different states based on due count
  if (schedule.due_count > 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-800">
                {schedule.due_count} word{schedule.due_count !== 1 ? 's' : ''} ready for
                review
              </p>
              <p className="text-sm text-amber-600">
                {schedule.mastered_count > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {schedule.mastered_count} mastered
                  </span>
                )}
                {schedule.mastered_count > 0 && schedule.learning_count > 0 && ' · '}
                {schedule.learning_count > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {schedule.learning_count} learning
                  </span>
                )}
              </p>
            </div>
          </div>
          {onStartReview && (
            <button
              onClick={handleStartReview}
              className="whitespace-nowrap rounded-lg bg-amber-500 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-600"
            >
              Review Now
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show upcoming reviews (within 24h)
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
          <Clock className="h-5 w-5 text-slate-500" />
        </div>
        <div>
          <p className="font-medium text-slate-700">
            {schedule.upcoming_count} word{schedule.upcoming_count !== 1 ? 's' : ''}{' '}
            coming up for review
          </p>
          <p className="text-sm text-slate-500">
            {schedule.mastered_count > 0 && `${schedule.mastered_count} mastered · `}
            Check back soon!
          </p>
        </div>
      </div>
    </div>
  );
}
