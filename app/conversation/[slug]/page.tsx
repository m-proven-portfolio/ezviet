import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { ConversationPageClient } from './ConversationPageClient';
import type { ConversationCardWithLines } from '@/lib/types/conversation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getConversation(slug: string): Promise<ConversationCardWithLines | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('conversation_cards')
    .select(`
      *,
      category:categories(*),
      lines:conversation_lines(*)
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error || !data) {
    return null;
  }

  // Sort lines by sort_order
  if (data.lines) {
    data.lines.sort((a: { sort_order: number }, b: { sort_order: number }) =>
      a.sort_order - b.sort_order
    );
  }

  // Increment view count
  await supabase.rpc('increment_conversation_view_count', { p_slug: slug });

  return data as ConversationCardWithLines;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const conversation = await getConversation(resolvedParams.slug);

  if (!conversation) {
    return {
      title: 'Conversation Not Found | EZViet',
    };
  }

  return {
    title: `${conversation.title} | Learn Vietnamese Conversation | EZViet`,
    description: conversation.meta_description ||
      `Learn Vietnamese through an interactive ${conversation.title.toLowerCase()} conversation with audio and translations.`,
    openGraph: {
      title: conversation.title,
      description: conversation.meta_description || undefined,
    },
  };
}

export default async function ConversationPage({ params }: PageProps) {
  const resolvedParams = await params;
  const conversation = await getConversation(resolvedParams.slug);

  if (!conversation) {
    notFound();
  }

  return <ConversationPageClient conversation={conversation} />;
}
