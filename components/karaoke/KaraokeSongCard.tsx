'use client';

import Link from 'next/link';
import { Play, Music, Clock, Sparkles, ChevronRight } from 'lucide-react';
import { getStorageUrl } from '@/lib/utils';
import type { CardSong } from '@/lib/supabase/types';

interface CardTerm {
  lang: string;
  text: string;
  romanization: string | null;
}

interface CardInfo {
  id: string;
  slug: string;
  image_path: string;
  category: { name: string; icon: string | null } | null;
  terms: CardTerm[];
}

export interface KaraokeSong extends CardSong {
  card: CardInfo | null;
}

interface KaraokeSongCardProps {
  song: KaraokeSong;
  isPlaying: boolean;
  onClick: () => void;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getVietnameseTerm(card: CardInfo | null): { text: string; romanization: string | null } | null {
  if (!card?.terms) return null;
  const viTerm = card.terms.find((t) => t.lang === 'vi');
  return viTerm ? { text: viTerm.text, romanization: viTerm.romanization } : null;
}

export function KaraokeSongCard({ song, isPlaying, onClick }: KaraokeSongCardProps) {
  const viTerm = getVietnameseTerm(song.card);

  return (
    <button
      onClick={onClick}
      className={`group relative bg-white/5 hover:bg-white/10 rounded-2xl overflow-hidden text-left transition-all ${
        isPlaying ? 'ring-2 ring-purple-500' : ''
      }`}
    >
      {/* Cover image */}
      <div className="aspect-square relative">
        {song.cover_image_path ? (
          <img
            src={getStorageUrl('cards-images', song.cover_image_path)}
            alt={song.title}
            className="w-full h-full object-cover"
          />
        ) : song.card?.image_path ? (
          <img
            src={getStorageUrl('cards-images', song.card.image_path)}
            alt={song.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Music className="w-16 h-16 text-white/30" />
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>

        {/* Now playing indicator */}
        {isPlaying && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-purple-500 rounded-full flex items-center gap-1">
            <span className="flex gap-0.5">
              <span className="w-1 h-3 bg-white rounded-full animate-pulse" />
              <span className="w-1 h-4 bg-white rounded-full animate-pulse delay-75" />
              <span className="w-1 h-2 bg-white rounded-full animate-pulse delay-150" />
            </span>
            <span className="text-xs text-white font-medium">Playing</span>
          </div>
        )}

        {/* Duration badge */}
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg flex items-center gap-1">
          <Clock className="w-3 h-3 text-white/70" />
          <span className="text-xs text-white/90 font-medium">{formatDuration(song.duration_seconds)}</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white truncate">{song.title}</h3>
        <p className="text-sm text-white/60 truncate">{song.artist || 'Unknown artist'}</p>

        {/* Vietnamese word being learned - clickable link to flashcard */}
        {viTerm && song.card?.slug && (
          <Link
            href={`/learn/${song.card.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="mt-3 pt-3 border-t border-white/10 block group/learn"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-amber-400 font-medium">Learn this word</span>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400/60 group-hover/learn:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-white font-medium mt-1 group-hover/learn:text-amber-200 transition-colors">
              {viTerm.text}
              {viTerm.romanization && (
                <span className="text-white/50 font-normal ml-2">/{viTerm.romanization}/</span>
              )}
            </p>
          </Link>
        )}
      </div>
    </button>
  );
}
