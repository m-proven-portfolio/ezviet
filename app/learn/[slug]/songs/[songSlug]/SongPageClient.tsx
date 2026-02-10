'use client';

import { useState } from 'react';
import { VocabularyPills } from '@/components/VocabularyPills';
import { StaticLyrics } from '@/components/StaticLyrics';
import type { ExtractedVocabulary } from '@/lib/lyrics-seo';

interface SongPageClientProps {
  vocabulary: ExtractedVocabulary[];
  lrcLyrics: string | null;
  plainLyrics: string | null;
  songTitle: string;
  songId: string;
}

export function SongPageClient({
  vocabulary,
  lrcLyrics,
  plainLyrics,
  songTitle,
}: SongPageClientProps) {
  const [lyricsExpanded, setLyricsExpanded] = useState(true); // Default open for SEO

  const hasLyrics = !!(lrcLyrics || plainLyrics);

  return (
    <>
      {/* Vocabulary Spotlight - Interactive */}
      {vocabulary.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 shadow-lg border-t vocabulary-spotlight">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Vietnamese Words in This Song
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Learn {vocabulary.length} Vietnamese vocabulary words from &quot;{songTitle}&quot;
          </p>
          <VocabularyPills
            vocabulary={vocabulary}
            lrcLyrics={lrcLyrics}
            onExpandLyrics={() => setLyricsExpanded(true)}
          />
        </div>
      )}

      {/* Static Lyrics - SEO only, always visible for crawlers */}
      {hasLyrics && (
        <div className="bg-white shadow-lg border-t">
          <StaticLyrics
            lrcLyrics={lrcLyrics}
            plainLyrics={plainLyrics}
            isExpanded={lyricsExpanded}
            onToggle={() => setLyricsExpanded(!lyricsExpanded)}
          />
        </div>
      )}
    </>
  );
}
