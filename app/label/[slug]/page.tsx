import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { JsonLd } from '@/components/JsonLd';
import { Header } from '@/components/Header';
import { LabelPageClient } from './LabelPageClient';
import type { LabelSetWithLabels, Label } from '@/lib/labels/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Revalidate pages every 60 seconds for fresh data
export const revalidate = 60;

// Generate static params for all published label sets (skip when env not set, e.g. at build time)
export async function generateStaticParams() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  const supabase = createAdminClient();
  const { data: labelSets } = await supabase
    .from('label_sets')
    .select('slug')
    .eq('is_published', true);

  return (labelSets || []).map((set) => ({ slug: set.slug }));
}

// Dynamic metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const labelSet = await getLabelSet(slug);

  if (!labelSet) {
    return { title: 'Label Set Not Found - EZViet' };
  }

  const labelCount = labelSet.labels?.length || 0;
  const title = `${labelSet.title} | Interactive Vietnamese Learning | EZViet`;
  const description =
    labelSet.description ||
    `Learn ${labelCount} Vietnamese words interactively. Click to explore, then test yourself with a quiz!`;

  return {
    title,
    description,
    keywords: [
      'Vietnamese',
      'learn Vietnamese',
      'Vietnamese vocabulary',
      'interactive learning',
      'Vietnamese quiz',
      labelSet.title,
      ...(labelSet.labels || []).slice(0, 5).map((l: Label) => l.vietnamese),
    ].filter(Boolean) as string[],
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: 'EZViet',
      images: labelSet.image_url ? [{ url: labelSet.image_url }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://ezviet.com/label/${slug}`,
    },
  };
}

async function getLabelSet(slug: string): Promise<LabelSetWithLabels | null> {
  const supabase = createAdminClient();

  const { data: labelSet, error } = await supabase
    .from('label_sets')
    .select(
      `
      *,
      category:categories(id, name, slug, icon),
      labels:labels(
        id, label_set_id, x, y, vietnamese, english,
        pronunciation, audio_url, hints, card_id, sort_order, created_at
      )
    `
    )
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error || !labelSet) return null;

  // Sort labels by sort_order
  if (labelSet.labels) {
    labelSet.labels.sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    );
  }

  return labelSet as LabelSetWithLabels;
}

export default async function LabelPage({ params }: PageProps) {
  const { slug } = await params;
  const labelSet = await getLabelSet(slug);

  if (!labelSet) {
    notFound();
  }

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: labelSet.title,
    description: labelSet.description || `Interactive Vietnamese vocabulary learning`,
    educationalLevel: labelSet.difficulty,
    learningResourceType: 'Interactive Resource',
    inLanguage: ['vi', 'en'],
    image: labelSet.image_url,
    provider: {
      '@type': 'Organization',
      name: 'EZViet',
      url: 'https://ezviet.com',
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      <JsonLd data={jsonLd} />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <LabelPageClient labelSet={labelSet} />
      </main>
    </div>
  );
}
