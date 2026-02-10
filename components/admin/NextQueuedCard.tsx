'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import type { CardQueue } from '@/lib/supabase/types';

interface NextQueuedCardProps {
  categoryId: string | null;
  onSelect: (vietnamese: string, english: string) => void;
}

export function NextQueuedCard({ categoryId, onSelect }: NextQueuedCardProps) {
  const [nextItem, setNextItem] = useState<CardQueue | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!categoryId) {
      setNextItem(null);
      setDismissed(false);
      return;
    }

    setLoading(true);
    setDismissed(false);

    fetch(`/api/card-queue?category_id=${categoryId}&status=pending`)
      .then((res) => res.json())
      .then((data: CardQueue[]) => {
        // Get the first pending item (oldest)
        setNextItem(data.length > 0 ? data[0] : null);
      })
      .catch(() => setNextItem(null))
      .finally(() => setLoading(false));
  }, [categoryId]);

  if (!categoryId || loading || !nextItem || dismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-amber-800">Next card needed</span>
            <span className="text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
              from queue
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-900">
            <span className="font-semibold text-lg">{nextItem.vietnamese}</span>
            <span className="text-gray-400">—</span>
            <span className="text-gray-700">{nextItem.english}</span>
          </div>
          {nextItem.notes && (
            <p className="text-xs text-gray-500 mt-1">{nextItem.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => onSelect(nextItem.vietnamese, nextItem.english)}
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Use this
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
