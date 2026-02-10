'use client';

import type { ExtractedVocabulary } from '@/lib/lyrics-seo';

interface VocabularyPillsProps {
  vocabulary: ExtractedVocabulary[];
  lrcLyrics: string | null;
  onExpandLyrics: () => void;
}

export function VocabularyPills({
  vocabulary,
}: VocabularyPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {vocabulary.slice(0, 12).map((vocab) => (
        <span
          key={vocab.word}
          lang="vi"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-white border border-orange-200"
        >
          <span className="font-medium text-orange-700">{vocab.word}</span>
          {vocab.frequency > 1 && (
            <span className="text-xs text-orange-500">×{vocab.frequency}</span>
          )}
        </span>
      ))}
    </div>
  );
}
