import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Tags, ArrowLeft } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'Picture Quiz | Learn Vietnamese Vocabulary | EZViet',
  description:
    'Interactive picture quizzes to learn Vietnamese vocabulary. Click on images to discover words and test yourself!',
};

// Revalidate every 60 seconds for fresh content
export const revalidate = 60;

interface LabelSet {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
  labels: { id: string }[];
}

async function getPublishedLabelSets(): Promise<LabelSet[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('label_sets')
    .select(
      `
      id, slug, title, description, image_url, difficulty, created_at,
      labels(id)
    `
    )
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch label sets:', error);
    return [];
  }

  return data as LabelSet[];
}

export default async function LabelsPage() {
  const labelSets = await getPublishedLabelSets();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-(--text-tertiary) hover:text-(--text-secondary) mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to flashcards
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-(--interactive-subtle)">
              <Tags className="h-6 w-6 text-(--interactive)" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Picture Quiz</h1>
          </div>
          <p className="text-(--text-secondary)">
            Click on images to discover Vietnamese words, then test yourself with a quiz!
          </p>
        </div>

        {/* Quiz grid */}
        {labelSets.length === 0 ? (
          <div className="text-center py-16">
            <Tags className="h-12 w-12 text-(--text-disabled) mx-auto mb-4" />
            <p className="text-(--text-tertiary)">No quizzes available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {labelSets.map((set) => (
              <Link
                key={set.id}
                href={`/label/${set.slug}`}
                className="group block rounded-xl border border-(--border-default) bg-(--surface-card) overflow-hidden hover:border-(--interactive) hover:shadow-lg transition-all"
              >
                {/* Image */}
                <div className="relative aspect-video bg-(--surface-elevated)">
                  {set.image_url && (
                    <Image
                      src={set.image_url}
                      alt={set.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  {/* Word count badge */}
                  <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium">
                    {set.labels.length} words
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h2 className="font-semibold text-foreground group-hover:text-(--interactive) transition-colors">
                    {set.title}
                  </h2>
                  {set.description && (
                    <p className="mt-1 text-sm text-(--text-tertiary) line-clamp-2">{set.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
