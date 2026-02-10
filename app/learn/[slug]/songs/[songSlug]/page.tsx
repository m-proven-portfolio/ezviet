import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { getStorageUrl } from '@/lib/utils';
import type { CardSong } from '@/lib/supabase/types';
import { JsonLd } from '@/components/JsonLd';
import { SongPagePlayer } from './SongPagePlayer';
import { SongPageClient } from './SongPageClient';
import { SongActions } from '@/components/SongActions';
import { ContributorCredits } from '@/components/karaoke/ContributorCredits';
import {
  parseBilingualLyrics,
  extractVocabulary,
  generateLyricsFAQs,
  generateLyricsSchema,
  generatePronunciationHowTo,
  generateVocabularyListSchema,
} from '@/lib/lyrics-seo';

interface PageProps {
  params: Promise<{ slug: string; songSlug: string }>;
}

async function getSongWithCard(cardSlug: string, songSlug: string) {
  const supabase = createAdminClient();

  // Get the card first
  const { data: card, error: cardError } = await supabase
    .from('cards')
    .select(`
      id,
      slug,
      terms:card_terms(lang, text)
    `)
    .eq('slug', cardSlug)
    .single();

  if (cardError || !card) return null;

  // Get the song by slug (not id)
  const { data: song, error: songError } = await supabase
    .from('card_songs')
    .select('*')
    .eq('slug', songSlug)
    .eq('card_id', card.id)
    .single();

  if (songError || !song) return null;

  const enTerm = card.terms.find((t: { lang: string }) => t.lang === 'en');
  const viTerm = card.terms.find((t: { lang: string }) => t.lang === 'vi');

  return {
    song: song as CardSong,
    cardSlug: card.slug,
    englishWord: enTerm?.text || cardSlug,
    vietnameseWord: viTerm?.text || '',
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, songSlug } = await params;
  const data = await getSongWithCard(slug, songSlug);

  if (!data) {
    return { title: 'Song Not Found - EZViet' };
  }

  const { song, englishWord, vietnameseWord, cardSlug } = data;
  const title = `${song.title} - Learn "${englishWord}" in Vietnamese | EZViet`;
  const description = song.purpose
    || `Learn Vietnamese vocabulary for "${englishWord}" (${vietnameseWord}) through music. ${song.title} by ${song.artist || 'EZViet'}.`;

  const audioUrl = getStorageUrl('cards-songs', song.storage_path);

  return {
    title,
    description,
    keywords: [
      englishWord,
      vietnameseWord,
      'Vietnamese song',
      'learn Vietnamese',
      'Vietnamese vocabulary',
      song.title,
      song.artist,
    ].filter(Boolean) as string[],
    openGraph: {
      title,
      description,
      type: 'music.song',
      audio: audioUrl,
      siteName: 'EZViet',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `https://ezviet.org/learn/${cardSlug}/songs/${song.slug}`,
    },
  };
}

export default async function SongPage({ params }: PageProps) {
  const { slug, songSlug } = await params;
  const data = await getSongWithCard(slug, songSlug);

  if (!data) {
    notFound();
  }

  const { song, cardSlug, englishWord, vietnameseWord } = data;
  const songUrl = `https://ezviet.org/learn/${cardSlug}/songs/${song.slug}`;

  // Extract SEO-rich content from lyrics
  const plainLyrics = song.lyrics_plain || '';
  const bilingualLines = parseBilingualLyrics(plainLyrics);
  const vocabulary = extractVocabulary(plainLyrics);
  const dynamicFAQs = generateLyricsFAQs(
    song.title,
    song.artist || 'EZViet',
    englishWord,
    vietnameseWord,
    vocabulary,
    bilingualLines
  );

  // Enhanced JSON-LD for AI SEO - Multiple schema types
  // Note: @context is added automatically by JsonLd component when using @graph
  const jsonLd = [
    // Primary: MusicRecording schema with lyrics
    {
      '@type': 'MusicRecording',
      '@id': `${songUrl}#song`,
      name: song.title,
      byArtist: {
        '@type': 'MusicGroup',
        name: song.artist || 'EZViet',
      },
      duration: song.duration_seconds
        ? `PT${Math.floor(song.duration_seconds / 60)}M${song.duration_seconds % 60}S`
        : undefined,
      inLanguage: 'vi',
      genre: 'Educational Music',
      datePublished: song.created_at,
      url: songUrl,
      // Add lyrics as CreativeWork reference
      lyrics: plainLyrics ? { '@id': `${songUrl}#lyrics` } : undefined,
    },
    // Lyrics as standalone CreativeWork (for direct indexing)
    ...(plainLyrics ? [generateLyricsSchema(song.title, plainLyrics, songUrl)] : []),
    // LearningResource schema for AI understanding
    {
      '@type': 'LearningResource',
      '@id': `${songUrl}#learning`,
      name: `Learn "${englishWord}" in Vietnamese through "${song.title}"`,
      description: song.purpose || `Vietnamese learning song teaching the word "${vietnameseWord}" (${englishWord})`,
      learningResourceType: 'Song',
      educationalLevel: song.level ? `Level ${song.level}` : 'Beginner to Intermediate',
      inLanguage: ['vi', 'en'],
      teaches: vietnameseWord
        ? `Vietnamese word: ${vietnameseWord} (English: ${englishWord})`
        : `Vietnamese vocabulary for ${englishWord}`,
      // Include vocabulary words this song teaches
      ...(vocabulary.length > 0 && {
        keywords: vocabulary.slice(0, 10).map((v) => v.word),
      }),
      educationalUse: ['vocabulary learning', 'pronunciation practice', 'cultural immersion'],
      interactivityType: 'active',
      isAccessibleForFree: true,
      audience: {
        '@type': 'EducationalAudience',
        educationalRole: 'student',
        audienceType: 'Vietnamese language learners',
      },
      isPartOf: {
        '@type': 'Course',
        name: 'EZViet Vietnamese Learning',
        description: 'Learn Vietnamese vocabulary through flashcards, songs, and immersive content',
        provider: {
          '@type': 'Organization',
          name: 'EZViet',
          url: 'https://ezviet.org',
        },
      },
      mainEntity: {
        '@type': 'DefinedTerm',
        name: vietnameseWord || englishWord,
        description: `Vietnamese word meaning "${englishWord}"`,
        inDefinedTermSet: {
          '@type': 'DefinedTermSet',
          name: 'Vietnamese Vocabulary',
        },
      },
    },
    // FAQPage schema with dynamic questions from lyrics
    {
      '@type': 'FAQPage',
      '@id': `${songUrl}#faq`,
      mainEntity: dynamicFAQs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    },
    // HowTo schema for pronunciation learning
    ...(vietnameseWord
      ? [generatePronunciationHowTo(vietnameseWord, englishWord, song.title, songUrl)]
      : []),
    // Vocabulary ItemList schema
    ...(vocabulary.length > 0
      ? [generateVocabularyListSchema(vocabulary, song.title, songUrl)]
      : []),
    // Speakable schema for voice assistants
    {
      '@type': 'WebPage',
      '@id': songUrl,
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['h1', '.purpose', '.learning-goal', '.vocabulary-spotlight'],
      },
      name: `${song.title} - Vietnamese Learning Song`,
      description: `Learn Vietnamese vocabulary for "${englishWord}" through the song "${song.title}"`,
      inLanguage: ['vi', 'en'],
    },
  ];

  const audioUrl = getStorageUrl('cards-songs', song.storage_path);
  const coverUrl = song.cover_image_path
    ? getStorageUrl('cards-images', song.cover_image_path)
    : null;

  return (
    <>
      <JsonLd data={jsonLd} />

      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-emerald-50">
        {/* Header */}
        <header className="px-4 py-4 flex justify-between items-center max-w-4xl mx-auto">
          <Link href="/" className="text-2xl font-bold text-emerald-600">
            EZViet
          </Link>
          <Link
            href={`/learn/${cardSlug}`}
            className="text-purple-600 hover:text-purple-800"
          >
            ← Back to Card
          </Link>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Song Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-t-2xl p-6 text-white">
            <div className="flex items-start gap-4">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={song.title}
                  className="w-24 h-24 rounded-xl object-cover shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-purple-500 flex items-center justify-center text-4xl shadow-lg">
                  🎵
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{song.title}</h1>
                <p className="text-purple-200 mt-1">{song.artist || 'EZViet'}</p>
                <div className="flex gap-2 mt-3">
                  {song.level && (
                    <span className="px-2 py-1 bg-purple-500 rounded text-xs">
                      Level {song.level}
                    </span>
                  )}
                  {song.album && (
                    <span className="px-2 py-1 bg-purple-500/50 rounded text-xs">
                      {song.album}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Purpose - AI readable */}
          {song.purpose && (
            <div className="bg-purple-100 px-6 py-4 purpose">
              <p className="text-purple-800">{song.purpose}</p>
            </div>
          )}

          {/* Audio Player */}
          <div className="bg-white p-6 shadow-lg">
            <SongPagePlayer song={song} cardSlug={cardSlug} />

            {/* Actions: Download, Share, QR */}
            <div className="mt-4 pt-4 border-t">
              <SongActions cardSlug={cardSlug} songSlug={song.slug} songId={song.id} />
            </div>
          </div>

          {/* Contributor Credits - shows who improved this song's timing */}
          <ContributorCredits songId={song.id} className="mt-4" />

          {/* Interactive Vocabulary + Karaoke Lyrics (Client Component) */}
          <SongPageClient
            vocabulary={vocabulary}
            lrcLyrics={song.lyrics_lrc || null}
            plainLyrics={song.lyrics_plain || null}
            songTitle={song.title}
            songId={song.id}
          />

          {/* Bilingual Lyrics - with proper language attributes for SEO */}
          {bilingualLines.length > 0 && (
            <div className="bg-white p-6 shadow-lg border-t">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Lyrics <span className="text-sm font-normal text-gray-500">(Vietnamese with English)</span>
              </h2>
              <div className="space-y-4">
                {bilingualLines.map((line) => (
                  <div key={line.lineNumber} className="border-l-2 border-purple-200 pl-4">
                    <p lang="vi" className="text-gray-900 font-medium">
                      {line.vietnamese}
                    </p>
                    {line.english && (
                      <p lang="en" className="text-gray-500 text-sm mt-1 italic">
                        {line.english}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learning Goal - AI readable */}
          {song.learning_goal && (
            <div className="bg-green-50 p-6 rounded-b-2xl shadow-lg learning-goal">
              <h2 className="text-sm font-semibold text-green-800 mb-1">Learning Goal</h2>
              <p className="text-green-700">{song.learning_goal}</p>
            </div>
          )}

          {/* Back to card link */}
          <div className="mt-8 text-center">
            <Link
              href={`/learn/${cardSlug}`}
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              ← Back to "{englishWord}" Card
            </Link>
          </div>

          {/* AI-friendly summary section - rich with keywords for indexing */}
          <section className="mt-12 text-gray-600 text-sm space-y-4 bg-gray-50 rounded-xl p-6" aria-label="Learning Summary">
            <h2 className="text-base font-semibold text-gray-800">
              About This Vietnamese Learning Song
            </h2>
            <div className="space-y-2">
              <p>
                Learn Vietnamese vocabulary for &quot;{englishWord}&quot;
                {vietnameseWord && (
                  <> (<span lang="vi" className="font-medium">{vietnameseWord}</span>)</>
                )} through music with <strong>{song.title}</strong>.
              </p>
              {vocabulary.length > 0 && (
                <p>
                  This song teaches <strong>{vocabulary.length} Vietnamese words</strong> including:{' '}
                  <span lang="vi">
                    {vocabulary.slice(0, 5).map((v) => v.word).join(', ')}
                  </span>
                  {vocabulary.length > 5 && ` and ${vocabulary.length - 5} more`}.
                </p>
              )}
              <p>
                Perfect for Vietnamese language learners who want to improve pronunciation
                and vocabulary through immersive music-based learning.
              </p>
              {song.learning_goal && (
                <p className="text-gray-500 italic border-l-2 border-green-300 pl-3">
                  {song.learning_goal}
                </p>
              )}
            </div>
            {/* Hidden but crawlable FAQ content */}
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                Frequently Asked Questions
              </summary>
              <div className="mt-2 space-y-2 text-gray-600">
                {dynamicFAQs.slice(0, 3).map((faq, i) => (
                  <div key={i}>
                    <p className="font-medium">{faq.question}</p>
                    <p>{faq.answer}</p>
                  </div>
                ))}
              </div>
            </details>
          </section>
        </div>
      </main>
    </>
  );
}
