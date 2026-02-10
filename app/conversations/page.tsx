import { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { Header } from '@/components/Header';
import { getStorageUrl } from '@/lib/utils';
import type { ConversationCardWithLines } from '@/lib/types/conversation';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Vietnamese Conversations | EZViet',
  description: 'Learn Vietnamese through interactive conversations with audio. Practice real-life dialogues and improve your speaking skills.',
};

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
    .order('created_at', { ascending: false });

  if (!data) return [];

  return data.map(conv => ({
    ...conv,
    lines: conv.lines?.sort((a: { sort_order: number }, b: { sort_order: number }) =>
      a.sort_order - b.sort_order
    ) || [],
  })) as ConversationCardWithLines[];
}

export default async function ConversationsPage() {
  const conversations = await getConversations();

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-3">
            💬 Vietnamese Conversations
          </h1>
          <p className="text-xl text-(--text-secondary) max-w-2xl mx-auto">
            Learn Vietnamese through real-life dialogues. Tap to reveal translations and hear native pronunciation.
          </p>
        </div>

        {conversations.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16">
            <div className="bg-(--surface-card) rounded-3xl shadow-xl p-12 max-w-md mx-auto border border-(--border-default)">
              <div className="text-6xl mb-6">💬</div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Coming Soon!
              </h2>
              <p className="text-(--text-secondary) mb-6">
                Interactive conversation flashcards are being created. Check back soon!
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-(--interactive) text-(--text-inverse) rounded-xl font-bold hover:bg-(--interactive-hover) transition-colors"
              >
                ← Practice Vocabulary
              </Link>
            </div>
          </div>
        ) : (
          /* Conversations Grid */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/conversation/${conv.slug}`}
                className="group bg-(--surface-card) rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1 border border-(--border-default)"
              >
                {/* Scene Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getStorageUrl('cards-images', conv.scene_image_path)}
                    alt={conv.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-white font-bold text-xl mb-1">
                      {conv.title}
                    </h2>
                    {conv.title_vi && (
                      <p className="text-white/80 text-sm">
                        {conv.title_vi}
                      </p>
                    )}
                  </div>
                  {/* Stats badge */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <span className="px-2 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-sm">
                      💬 {conv.lines?.length || 0} lines
                    </span>
                    <span className="px-2 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-sm">
                      📊 Level {conv.difficulty}
                    </span>
                  </div>
                </div>

                {/* Preview */}
                <div className="p-4">
                  {conv.lines?.[0] && (
                    <div className="space-y-2">
                      <div className="bg-(--surface-elevated) rounded-xl px-3 py-2">
                        <p className="text-xs text-(--text-tertiary) mb-1">{conv.lines[0].speaker}</p>
                        <p className="text-foreground font-medium text-sm">
                          {conv.lines[0].vietnamese}
                        </p>
                      </div>
                      {conv.lines?.[1] && (
                        <div className="bg-(--feedback-warning-subtle) rounded-xl px-3 py-2">
                          <p className="text-xs text-(--feedback-warning) mb-1">{conv.lines[1].speaker}</p>
                          <p className="text-foreground font-medium text-sm">
                            {conv.lines[1].vietnamese}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Category */}
                  {conv.category && (
                    <div className="mt-3 pt-3 border-t border-(--border-subtle)">
                      <span className="text-xs text-(--text-tertiary)">
                        {conv.category.name}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Back to home */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="text-(--interactive) hover:text-(--interactive-hover) font-medium"
          >
            ← Back to Vocabulary Flashcards
          </Link>
        </div>
      </div>
    </main>
  );
}
