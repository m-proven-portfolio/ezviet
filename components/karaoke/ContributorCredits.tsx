'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Users } from 'lucide-react';
import { type CoreTier, getCoreTierConfig } from '@/lib/core-tiers';

interface SongContributor {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  editCount: number;
  totalPoints: number;
  tier: {
    id: string;
    name: string;
    icon: string;
  };
}

interface ContributorCreditsProps {
  songId: string;
  className?: string;
}

/**
 * ContributorCredits - Shows who improved a song's timing
 *
 * Displays top contributors with their tier badges and edit counts.
 * Links to user profiles for recognition.
 */
export function ContributorCredits({
  songId,
  className = '',
}: ContributorCreditsProps) {
  const [contributors, setContributors] = useState<SongContributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContributors() {
      try {
        const res = await fetch(`/api/songs/${songId}/contributors`);
        if (!res.ok) {
          throw new Error('Failed to fetch contributors');
        }
        const data = await res.json();
        setContributors(data.contributors || []);
      } catch (err) {
        console.error('Error fetching contributors:', err);
        setError('Failed to load contributors');
      } finally {
        setLoading(false);
      }
    }

    fetchContributors();
  }, [songId]);

  // Don't render anything if no contributors or loading/error
  if (loading || error || contributors.length === 0) {
    return null;
  }

  return (
    <div
      className={`
        bg-gradient-to-br from-zinc-900/80 to-zinc-800/60
        border border-zinc-700/50 rounded-xl p-4
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-medium text-zinc-300">
          Timing improved by EZViet Core
        </h3>
      </div>

      {/* Contributor List */}
      <div className="space-y-2">
        {contributors.map((contributor) => {
          const tierConfig = getCoreTierConfig(contributor.tier.id as CoreTier);

          return (
            <Link
              key={contributor.userId}
              href={`/@${contributor.username}`}
              className="
                flex items-center gap-3 p-2 -mx-2
                rounded-lg hover:bg-white/5 transition-colors
                group
              "
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {contributor.avatarUrl ? (
                  <Image
                    src={contributor.avatarUrl}
                    alt={contributor.username}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                    <span className="text-xs text-zinc-400">
                      {contributor.username[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                {/* Tier badge overlay */}
                <span
                  className="
                    absolute -bottom-1 -right-1
                    text-xs leading-none
                  "
                  title={tierConfig.label}
                >
                  {contributor.tier.icon}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors">
                  @{contributor.username}
                </p>
                <p className="text-xs text-zinc-500">
                  {contributor.editCount} {contributor.editCount === 1 ? 'edit' : 'edits'}
                </p>
              </div>

              {/* Tier name on hover */}
              <span
                className={`
                  text-xs px-2 py-0.5 rounded-full
                  bg-gradient-to-r ${tierConfig.bgGradient}
                  border ${tierConfig.borderColor}
                  ${tierConfig.textColor}
                  opacity-0 group-hover:opacity-100 transition-opacity
                `}
              >
                {tierConfig.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Footer CTA */}
      <div className="mt-3 pt-3 border-t border-zinc-700/50">
        <p className="text-xs text-zinc-500 text-center">
          Help improve timing and join EZViet Core
        </p>
      </div>
    </div>
  );
}
