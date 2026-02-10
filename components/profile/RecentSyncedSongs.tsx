'use client';

import { Play, Flame, Clock, Zap } from 'lucide-react';
import Link from 'next/link';
import { useAudioStore } from '@/lib/stores/audioStore';
import { setProfileSource, markCardAsSeenFromProfile } from '@/lib/progression';
import type { CardSong } from '@/lib/supabase/types';

interface SyncedSongData {
  submission: {
    id: string;
    accuracy_score: number | null;
    points_earned: number;
    best_streak: number;
    created_at: string;
  };
  song: {
    id: string;
    title: string;
    artist: string | null;
    cover_image_path: string | null;
    storage_path: string;
    lyrics_lrc: string | null;
    card_id: string;
    slug: string;
    mime_type: string;
    duration_seconds: number | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
  };
  cardSlug: string | null;
}

interface RecentSyncedSongsProps {
  songs: SyncedSongData[];
  username: string;
}

// Grade thresholds and styling
const getGrade = (score: number | null): { letter: string; color: string; glow: string; bg: string } => {
  if (score === null) return { letter: '?', color: 'text-gray-400', glow: '', bg: 'bg-gray-700' };
  if (score >= 95) return { letter: 'S', color: 'text-amber-300', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.5)]', bg: 'bg-gradient-to-br from-amber-500 to-yellow-600' };
  if (score >= 85) return { letter: 'A', color: 'text-emerald-400', glow: 'shadow-[0_0_15px_rgba(52,211,153,0.4)]', bg: 'bg-gradient-to-br from-emerald-500 to-green-600' };
  if (score >= 70) return { letter: 'B', color: 'text-sky-400', glow: '', bg: 'bg-gradient-to-br from-sky-500 to-blue-600' };
  if (score >= 50) return { letter: 'C', color: 'text-orange-400', glow: '', bg: 'bg-gradient-to-br from-orange-500 to-amber-600' };
  return { letter: 'D', color: 'text-red-400', glow: '', bg: 'bg-gradient-to-br from-red-500 to-rose-600' };
};

// Format duration as mm:ss
const formatDuration = (seconds: number | null): string => {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Format relative date
const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export function RecentSyncedSongs({ songs, username }: RecentSyncedSongsProps) {
  const playSong = useAudioStore((s) => s.playSong);
  const launchKaraokeHero = useAudioStore((s) => s.launchKaraokeHero);

  const handlePlay = (songData: SyncedSongData) => {
    setProfileSource(username);
    if (songData.cardSlug) {
      markCardAsSeenFromProfile(songData.cardSlug);
    }

    const cardSong: CardSong = {
      id: songData.song.id,
      card_id: songData.song.card_id,
      slug: songData.song.slug,
      storage_path: songData.song.storage_path,
      duration_seconds: songData.song.duration_seconds,
      file_size: null,
      mime_type: songData.song.mime_type,
      title: songData.song.title,
      artist: songData.song.artist,
      album: null,
      year: null,
      cover_image_path: songData.song.cover_image_path,
      level: null,
      purpose: null,
      learning_goal: null,
      lyrics_lrc: songData.song.lyrics_lrc,
      lyrics_plain: null,
      lyrics_enhanced: null,
      genre: null,
      genres: null,
      timing_offset: null,
      sort_order: songData.song.sort_order,
      created_at: songData.song.created_at,
      updated_at: songData.song.updated_at,
      parent_song_id: null,
      variation_label: null,
      is_primary: null,
    };

    playSong(cardSong, songData.cardSlug || '', [cardSong]);
    launchKaraokeHero();
  };

  if (songs.length === 0) return null;

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          Recent Plays
        </h3>
        <Link
          href={`/@${username}/songs`}
          className="text-xs font-medium text-gray-500 hover:text-emerald-600 transition-colors"
        >
          View All
        </Link>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {songs.map((item) => {
          const grade = getGrade(item.submission.accuracy_score);
          const isHighScore = item.submission.accuracy_score !== null && item.submission.accuracy_score >= 85;

          return (
            <div
              key={item.submission.id}
              className={`
                relative overflow-hidden rounded-2xl
                bg-gradient-to-br from-slate-800 to-slate-900
                border border-slate-700/50
                transition-all duration-300 group
                hover:scale-[1.02] hover:border-slate-600
                ${isHighScore ? grade.glow : ''}
              `}
            >
              {/* Top Section - Cover + Grade Badge */}
              <div className="relative">
                {/* Cover Image */}
                <div className="aspect-[16/10] relative overflow-hidden">
                  {item.song.cover_image_path ? (
                    <img
                      src={item.song.cover_image_path}
                      alt={item.song.title}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                      <div className="text-4xl opacity-30">🎤</div>
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

                  {/* Play Button Overlay */}
                  <button
                    onClick={() => handlePlay(item)}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Play ${item.song.title}`}
                  >
                    <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-colors">
                      <Play className="w-6 h-6 text-white fill-white ml-1" />
                    </div>
                  </button>
                </div>

                {/* Grade Badge - Positioned top right */}
                <div
                  className={`
                    absolute top-3 right-3
                    w-10 h-10 rounded-xl
                    ${grade.bg}
                    flex items-center justify-center
                    font-black text-lg text-white
                    shadow-lg
                    ${isHighScore ? 'animate-pulse' : ''}
                  `}
                >
                  {grade.letter}
                </div>

                {/* Duration Badge - Top left */}
                <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm">
                  <span className="text-xs font-mono text-white/80">
                    {formatDuration(item.song.duration_seconds)}
                  </span>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-4">
                {/* Title + Artist */}
                <div className="mb-3">
                  <h4 className="font-semibold text-white truncate text-sm leading-tight">
                    {item.song.title}
                  </h4>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {item.song.artist || 'Unknown Artist'}
                  </p>
                  {/* Song slug for differentiation */}
                  <p className="text-[10px] text-slate-500 font-mono truncate mt-1">
                    {item.song.slug}
                  </p>
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between">
                  {/* Points */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-400 font-bold text-lg">
                      {item.submission.points_earned.toLocaleString()}
                    </span>
                    <span className="text-amber-400/60 text-xs font-medium">pts</span>
                  </div>

                  {/* Streak */}
                  {item.submission.best_streak > 0 && (
                    <div className="flex items-center gap-1 text-orange-400">
                      <Flame className="w-3.5 h-3.5" />
                      <span className="text-sm font-bold">{item.submission.best_streak}</span>
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">{formatRelativeDate(item.submission.created_at)}</span>
                  </div>
                </div>

                {/* Accuracy Bar */}
                <div className="mt-3">
                  <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.submission.accuracy_score === null
                          ? 'bg-gray-500 w-0'
                          : item.submission.accuracy_score >= 85
                            ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                            : item.submission.accuracy_score >= 50
                              ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                              : 'bg-gradient-to-r from-red-400 to-rose-500'
                      }`}
                      style={{ width: `${item.submission.accuracy_score ?? 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wide">Accuracy</span>
                    <span className={`text-xs font-bold ${grade.color}`}>
                      {item.submission.accuracy_score !== null ? `${Math.round(item.submission.accuracy_score)}%` : '--'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile Play Button */}
              <div className="px-4 pb-4 sm:hidden">
                <button
                  onClick={() => handlePlay(item)}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Play Again
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
