'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Lock, ChevronRight, Coins, Zap, Star, ArrowLeft } from 'lucide-react';
import type { VQWorld, VQLevelSummary } from '@/lib/vietquest/types';

interface WorldWithLevels extends VQWorld {
  vq_levels: VQLevelSummary[];
}

interface VietQuestHubProps {
  worlds: WorldWithLevels[];
}

/**
 * VietQuestHub - Client component for world/level selection
 *
 * Features:
 * - World cards with cover images
 * - Level list with completion status
 * - Progress tracking
 * - Lock state for unreleased content
 */
export function VietQuestHub({ worlds }: VietQuestHubProps) {
  const [selectedWorld, setSelectedWorld] = useState<WorldWithLevels | null>(
    worlds.length > 0 ? worlds[0] : null
  );

  // Format đồng for display
  const formatDong = (amount: number): string => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}k`;
    }
    return amount.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="sr-only">Back to EZViet</span>
          </Link>

          <h1 className="text-white font-bold text-xl">VietQuest</h1>

          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Intro */}
        <div className="text-center mb-8">
          <h2 className="text-emerald-400 text-2xl font-bold mb-2">
            Chào mừng đến Việt Nam!
          </h2>
          <p className="text-slate-400">
            Learn Vietnamese by living it. Choose your destination.
          </p>
        </div>

        {/* World Cards */}
        {worlds.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No worlds available yet</p>
            <p className="text-slate-500 text-sm mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {worlds.map((world) => {
              const isSelected = selectedWorld?.id === world.id;
              const levelCount = world.vq_levels.length;

              return (
                <div key={world.id}>
                  {/* World Card */}
                  <button
                    onClick={() => setSelectedWorld(isSelected ? null : world)}
                    className={`
                      w-full text-left rounded-2xl overflow-hidden transition-all
                      ${isSelected
                        ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-900'
                        : 'hover:ring-1 hover:ring-slate-600'
                      }
                    `}
                  >
                    {/* Cover image */}
                    <div
                      className="h-40 bg-cover bg-center relative"
                      style={{
                        backgroundImage: world.cover_image_path
                          ? `url(/vietquest/worlds/${world.cover_image_path})`
                          : 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

                      {/* World info overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-emerald-400 text-sm font-medium flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {world.name_en}
                            </p>
                            <h3 className="text-white text-2xl font-bold">
                              {world.name_vi}
                            </h3>
                          </div>

                          <div className="flex items-center gap-1 bg-slate-800/80 rounded-full px-3 py-1">
                            <Star className="w-4 h-4 text-amber-400" />
                            <span className="text-white text-sm font-medium">
                              {levelCount} levels
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="bg-slate-800/60 backdrop-blur-sm p-4 border-t border-slate-700/50">
                      <p className="text-slate-300 text-sm line-clamp-2">
                        {world.description}
                      </p>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1 text-slate-500 text-sm">
                          <span>Difficulty:</span>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < world.difficulty ? 'bg-emerald-500' : 'bg-slate-700'
                              }`}
                            />
                          ))}
                        </div>

                        <ChevronRight
                          className={`w-5 h-5 text-slate-400 transition-transform ${
                            isSelected ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </button>

                  {/* Level List (expanded) */}
                  {isSelected && (
                    <div className="mt-2 space-y-2 animate-fade-in">
                      {world.vq_levels.map((level) => (
                        <Link
                          key={level.id}
                          href={`/vietquest/${world.slug}/${level.slug}`}
                          className="
                            flex items-center gap-4 p-4 bg-slate-800/40 rounded-xl
                            border border-slate-700/30 hover:border-emerald-500/30
                            transition-all group
                          "
                        >
                          {/* Level number */}
                          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-emerald-400 font-bold">
                              {level.level_number}
                            </span>
                          </div>

                          {/* Level info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">
                              {level.title_vi}
                            </p>
                            <p className="text-slate-400 text-sm truncate">
                              {level.title_en}
                            </p>
                          </div>

                          {/* Reward */}
                          <div className="flex items-center gap-1 text-amber-400 text-sm flex-shrink-0">
                            <Coins className="w-4 h-4" />
                            <span>{formatDong(level.base_dong_reward)}đ</span>
                          </div>

                          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                        </Link>
                      ))}

                      {/* Coming soon placeholder */}
                      <div className="flex items-center gap-4 p-4 bg-slate-800/20 rounded-xl border border-slate-700/20 opacity-50">
                        <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center">
                          <Lock className="w-5 h-5 text-slate-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-slate-500 font-medium">More levels coming soon...</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        <div className="text-center pt-8 pb-4">
          <p className="text-slate-500 text-sm">
            Learn by doing. Vietnamese is your key to the world.
          </p>
        </div>
      </main>
    </div>
  );
}
