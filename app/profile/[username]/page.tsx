import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/Header';
import { JsonLd } from '@/components/JsonLd';
import { ProfileStats } from '@/components/stats/ProfileStats';
import { RecentSyncedSongs } from '@/components/profile/RecentSyncedSongs';
import { CoreMemberSection } from '@/components/profile/CoreMemberSection';

interface Props {
  params: Promise<{ username: string }>;
}

// Helper to get profile data (reused in metadata and page)
async function getProfile(username: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      display_name,
      avatar_url,
      bio,
      cards_viewed,
      cards_mastered,
      current_streak,
      longest_streak,
      created_at
    `)
    .eq('username', username)
    .single();
  return data;
}

// Helper to get LRC contributor stats
async function getLrcContributorStats(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('lrc_contributors')
    .select('total_points, level, songs_synced, accuracy_rate, best_streak')
    .eq('user_id', userId)
    .single();
  return data;
}

// Type for recent synced songs data
interface RecentSyncedSongData {
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

// Helper to get recent synced songs with full details
async function getRecentSyncedSongs(userId: string): Promise<RecentSyncedSongData[]> {
  const supabase = await createClient();

  // Get 3 most recent submissions
  const { data: submissions } = await supabase
    .from('lrc_submissions')
    .select('id, song_id, accuracy_score, points_earned, best_streak, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(3);

  if (!submissions?.length) return [];

  // Fetch song details for all submissions
  const songIds = submissions.map((s) => s.song_id);
  const { data: songs } = await supabase
    .from('card_songs')
    .select(
      'id, title, artist, cover_image_path, storage_path, card_id, lyrics_lrc, slug, mime_type, duration_seconds, sort_order, created_at, updated_at'
    )
    .in('id', songIds);

  // Get card slugs for linking
  const cardIds = songs?.map((s) => s.card_id).filter(Boolean) || [];
  const { data: cards } = await supabase
    .from('cards')
    .select('id, slug')
    .in('id', cardIds);

  // Combine data
  const songMap = new Map(songs?.map((s) => [s.id, s]) || []);
  const cardMap = new Map(cards?.map((c) => [c.id, c]) || []);

  const results: RecentSyncedSongData[] = [];

  for (const sub of submissions) {
    const song = songMap.get(sub.song_id);
    if (song) {
      results.push({
        submission: sub,
        song,
        cardSlug: cardMap.get(song.card_id)?.slug || null,
      });
    }
  }

  return results;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);

  if (!profile) {
    return {
      title: 'Profile Not Found | EZViet',
      robots: { index: false }
    };
  }

  const displayName = profile.display_name || profile.username;
  const title = `${displayName} (@${profile.username}) | EZViet`;
  const description = profile.bio
    || `${displayName} is learning Vietnamese on EZViet. ${profile.cards_mastered} cards mastered, ${profile.current_streak} day streak.`;
  const canonicalUrl = `https://ezviet.org/@${profile.username}`;
  const ogImage = profile.avatar_url || 'https://ezviet.org/og-default.png';

  return {
    title,
    description,
    keywords: ['Vietnamese learning', 'language learner', displayName, profile.username, 'EZViet'],
    authors: [{ name: displayName }],

    // Canonical URL (important for /@username vs /profile/username)
    alternates: {
      canonical: canonicalUrl,
    },

    // OpenGraph for social sharing
    openGraph: {
      type: 'profile',
      url: canonicalUrl,
      title,
      description,
      siteName: 'EZViet',
      images: [
        {
          url: ogImage,
          width: 400,
          height: 400,
          alt: `${displayName}'s profile picture`,
        },
      ],
      username: profile.username,
    },

    // Twitter Card
    twitter: {
      card: 'summary',
      title,
      description,
      images: [ogImage],
    },

    // Robots - index profiles for discoverability
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await getProfile(username);

  if (!profile) {
    notFound();
  }

  // Fetch LRC contributor stats and recent synced songs
  const [lrcStats, recentSongs] = await Promise.all([
    getLrcContributorStats(profile.id),
    getRecentSyncedSongs(profile.id),
  ]);

  const displayName = profile.display_name || profile.username;
  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const memberSinceISO = new Date(profile.created_at).toISOString();
  const canonicalUrl = `https://ezviet.org/@${profile.username}`;

  // JSON-LD Structured Data for AI/Search Engines
  const jsonLdData = [
    // Person schema - who this profile represents
    {
      '@type': 'Person',
      '@id': `${canonicalUrl}#person`,
      name: displayName,
      alternateName: `@${profile.username}`,
      url: canonicalUrl,
      image: profile.avatar_url || undefined,
      description: profile.bio || `Vietnamese language learner on EZViet`,
    },
    // ProfilePage schema - the page itself
    {
      '@type': 'ProfilePage',
      '@id': canonicalUrl,
      url: canonicalUrl,
      name: `${displayName}'s Vietnamese Learning Profile`,
      description: profile.bio || `${displayName} is learning Vietnamese on EZViet with ${profile.cards_mastered} cards mastered.`,
      mainEntity: { '@id': `${canonicalUrl}#person` },
      dateCreated: memberSinceISO,
      isPartOf: {
        '@type': 'WebSite',
        '@id': 'https://ezviet.org/#website',
        name: 'EZViet',
        url: 'https://ezviet.org',
        description: 'Learn Vietnamese with flashcards and spaced repetition',
      },
    },
    // Learning statistics as ItemList for AI to parse
    {
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#stats`,
      name: `${displayName}'s Learning Statistics`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Cards Viewed', description: `${profile.cards_viewed} Vietnamese flashcards viewed` },
        { '@type': 'ListItem', position: 2, name: 'Cards Mastered', description: `${profile.cards_mastered} Vietnamese flashcards mastered` },
        { '@type': 'ListItem', position: 3, name: 'Current Streak', description: `${profile.current_streak} day learning streak` },
        { '@type': 'ListItem', position: 4, name: 'Best Streak', description: `${profile.longest_streak} day best learning streak` },
      ],
    },
  ];

  return (
    <>
      {/* JSON-LD for AI/Search engines */}
      <JsonLd data={jsonLdData} />

      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <Header />

        {/* Profile Card - semantic article element */}
        <article className="max-w-2xl mx-auto px-4 py-8" itemScope itemType="https://schema.org/ProfilePage">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Profile Header Banner */}
            <div className="bg-gradient-to-r from-emerald-500 to-blue-500 h-24" aria-hidden="true" />

            <div className="px-6 pb-6">
              {/* Avatar */}
              <figure className="-mt-12 mb-4">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={`${displayName}'s profile picture`}
                    className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                    itemProp="image"
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-emerald-100 flex items-center justify-center"
                    role="img"
                    aria-label={`${displayName}'s initials`}
                  >
                    <span className="text-3xl text-emerald-600" aria-hidden="true">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </figure>

              {/* Name & Username - semantic header */}
              <header className="mb-4">
                <h1 className="text-2xl font-bold text-gray-900" itemProp="name">
                  {displayName}
                </h1>
                <p className="text-gray-500" itemProp="alternateName">
                  @{profile.username}
                </p>
              </header>

              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-700 mb-4" itemProp="description">
                  {profile.bio}
                </p>
              )}

              {/* Member Since - semantic time element */}
              <p className="text-sm text-gray-400 mb-6">
                Learning since{' '}
                <time dateTime={memberSinceISO} itemProp="dateCreated">
                  {memberSince}
                </time>
              </p>

              {/* Stats - client component for real-time updates */}
              <ProfileStats
                username={profile.username}
                initialStats={{
                  cardsViewed: profile.cards_viewed,
                  cardsMastered: profile.cards_mastered,
                  currentStreak: profile.current_streak,
                  longestStreak: profile.longest_streak,
                }}
              />

              {/* EZViet Core Member Section */}
              <CoreMemberSection
                lrcStats={lrcStats}
                recentSongsSlot={
                  recentSongs.length > 0 ? (
                    <RecentSyncedSongs
                      songs={recentSongs}
                      username={profile.username || ''}
                    />
                  ) : undefined
                }
              />
            </div>
          </div>

          {/* CTA */}
          <nav className="mt-8 text-center" aria-label="Get started">
            <Link
              href="/"
              className="inline-block px-8 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Start Learning Vietnamese
            </Link>
          </nav>
        </article>
      </main>
    </>
  );
}
