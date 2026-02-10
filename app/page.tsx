import { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { FlashcardDeck } from '@/components/FlashcardDeck';
import { ConversationsSection } from '@/components/ConversationsSection';
import { JsonLd } from '@/components/JsonLd';
import { Header } from '@/components/Header';
import { BLOCKED_PRACTICE_CONFIG } from '@/lib/blocked-practice';
import { getCycleTimestamp, seededShuffle } from '@/lib/utils';
import type { CardWithTerms } from '@/lib/supabase/types';
import type { ConversationCardWithLines } from '@/lib/types/conversation';

// Revalidate every 60 seconds to pick up new cards/songs
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'EZViet - Learn Vietnamese with Free Flashcards',
  description: 'Learn Vietnamese vocabulary with beautiful, free flashcards. Audio pronunciation, spaced repetition, and instant value. Start learning Vietnamese today!',
  keywords: [
    'learn Vietnamese',
    'Vietnamese flashcards',
    'Vietnamese vocabulary',
    'free Vietnamese lessons',
    'Vietnamese pronunciation',
    'Vietnamese for beginners',
  ],
  openGraph: {
    title: 'EZViet - Learn Vietnamese with Free Flashcards',
    description: 'Learn Vietnamese vocabulary with beautiful, free flashcards. Start learning today!',
    url: 'https://ezviet.org',
    siteName: 'EZViet',
    type: 'website',
  },
  alternates: {
    canonical: 'https://ezviet.org',
  },
};

async function getInitialCards(): Promise<CardWithTerms[]> {
  const supabase = createAdminClient();

  // Total limit for initial cards (matches guest tier for consistent experience)
  const totalLimit = BLOCKED_PRACTICE_CONFIG.DEFAULT_TOTAL_LIMIT;

  // Get starter categories with card counts (only include categories that have cards)
  const { data: starterCategories } = await supabase
    .from('categories')
    .select('id, slug, cards(count)')
    .in('slug', BLOCKED_PRACTICE_CONFIG.STARTER_CATEGORIES);

  // Filter to only categories with at least 1 card
  const categoriesWithCards = (starterCategories || []).filter((c) => {
    const count = (c.cards as unknown as { count: number }[])?.[0]?.count ?? 0;
    return count > 0;
  });

  // If no starter categories exist with cards, fall back to recent cards
  if (categoriesWithCards.length === 0) {
    const { data: cards } = await supabase
      .from('cards')
      .select(`
        *,
        category:categories(*),
        terms:card_terms(*),
        songs:card_songs(id, storage_path, title, duration_seconds, sort_order, lyrics_lrc, lyrics_plain, cover_image_path, artist, level)
      `)
      .order('created_at', { ascending: false })
      .limit(totalLimit);

    const fallbackCards = (cards as CardWithTerms[]) || [];
    return seededShuffle(fallbackCards, getCycleTimestamp());
  }

  // Calculate cards per category to distribute evenly
  const cardsPerCategory = Math.max(
    1,
    Math.ceil(totalLimit / categoriesWithCards.length)
  );

  // Fetch cards category by category to maintain ordering
  const allCards: CardWithTerms[] = [];
  const categoryOrder = new Map(
    BLOCKED_PRACTICE_CONFIG.STARTER_CATEGORIES.map((slug, idx) => [slug, idx])
  );

  // Sort categories by the STARTER_CATEGORIES order
  const sortedCategories = [...categoriesWithCards].sort((a, b) => {
    const orderA = categoryOrder.get(a.slug) ?? 999;
    const orderB = categoryOrder.get(b.slug) ?? 999;
    return orderA - orderB;
  });

  for (const category of sortedCategories) {
    // Stop if we've reached the limit
    if (allCards.length >= totalLimit) break;

    const remainingSlots = totalLimit - allCards.length;
    const fetchLimit = Math.min(cardsPerCategory, remainingSlots);

    const { data: catCards } = await supabase
      .from('cards')
      .select(`
        *,
        category:categories(*),
        terms:card_terms(*),
        songs:card_songs(id, storage_path, title, duration_seconds, sort_order, lyrics_lrc, lyrics_plain, cover_image_path, artist, level)
      `)
      .eq('category_id', category.id)
      .order('sort_order', { ascending: true })
      .limit(fetchLimit);

    if (catCards && catCards.length > 0) {
      allCards.push(...(catCards as CardWithTerms[]));
    }
  }

  // Shuffle cards using 6-hour cycle timestamp as seed (same order for all users)
  return seededShuffle(allCards, getCycleTimestamp());
}

async function getConversations(): Promise<ConversationCardWithLines[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('conversation_cards')
    .select(`
      *,
      category:categories(*),
      lines:conversation_lines(*)
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(6);

  if (!data) return [];

  // Sort lines by sort_order for each conversation
  return data.map(conv => ({
    ...conv,
    lines: conv.lines?.sort((a: { sort_order: number }, b: { sort_order: number }) =>
      a.sort_order - b.sort_order
    ) || [],
  })) as ConversationCardWithLines[];
}

export default async function HomePage() {
  const [initialCards, conversations] = await Promise.all([
    getInitialCards(),
    getConversations(),
  ]);

  // JSON-LD for homepage
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'EZViet',
    url: 'https://ezviet.org',
    description: 'Learn Vietnamese with free flashcards, audio pronunciation, and spaced repetition.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://ezviet.org/learn/{search_term_string}',
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'EZViet',
      url: 'https://ezviet.org',
    },
  };

  const hasCards = initialCards.length > 0;

  return (
    <>
      <JsonLd data={jsonLd} />

      <main className="min-h-screen bg-background">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {hasCards ? (
            <>
              {/* Value proposition - minimal, instant understanding */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Learn Vietnamese
                </h1>
                <p className="text-(--text-secondary)">
                  Swipe through cards • Hear pronunciation • Learn fast
                </p>
              </div>

              {/* Flashcard Deck */}
              <FlashcardDeck initialCards={initialCards} />

              {/* Conversations Section */}
              <ConversationsSection conversations={conversations} />
            </>
          ) : (
            /* Empty state - no cards yet */
            <div className="text-center py-16">
              <div className="bg-(--surface-card) rounded-3xl shadow-xl p-12 max-w-md mx-auto">
                <div className="text-6xl mb-6">🇻🇳</div>
                <h1 className="text-3xl font-bold text-foreground mb-4">
                  Welcome to EZViet
                </h1>
                <p className="text-(--text-secondary) mb-8">
                  Learn Vietnamese with beautiful flashcards, audio pronunciation, and spaced repetition.
                </p>
                <div className="space-y-4">
                  <Link
                    href="/admin/cards/new"
                    className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors"
                  >
                    Create Your First Card
                  </Link>
                  <p className="text-sm text-(--text-tertiary)">
                    Teachers: Add vocabulary cards for learners
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-auto py-8 text-center">
          <p className="text-sm text-(--text-tertiary)">
            Learn Vietnamese the easy way • <Link href="/about" className="text-(--text-link) hover:underline">About EZViet</Link>
          </p>
        </footer>
      </main>
    </>
  );
}
