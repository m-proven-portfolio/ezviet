/**
 * Book Preview API
 *
 * Renders a book document to HTML for preview.
 * GET: Returns book preview (from database if id provided, else sample)
 * POST: Renders provided book document
 */

import { NextRequest, NextResponse } from 'next/server';
import { renderBook, renderChapterPreview, getTemplate } from '@/lib/book-engine';
import { SAMPLE_BOOK } from '@/lib/book-engine/fixtures/sample-book';
import { createAdminClient } from '@/lib/supabase/server';
import type { BookDocument, Chapter, Block, LanguageCode, CEFRLevel, RegionCode, FrontMatter, BackMatter } from '@/lib/book-engine';

// Helper to safely cast language codes
function toLanguageCode(val: string | null, fallback: LanguageCode): LanguageCode {
  const valid: LanguageCode[] = ['vi', 'en', 'fr', 'ru', 'es', 'zh', 'ja', 'ko'];
  return valid.includes(val as LanguageCode) ? (val as LanguageCode) : fallback;
}

function toCEFRLevel(val: string | null): CEFRLevel {
  const valid: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  return valid.includes(val as CEFRLevel) ? (val as CEFRLevel) : 'A1';
}

function toRegionCode(val: string | null): RegionCode | undefined {
  const valid: RegionCode[] = ['north', 'south', 'central', null];
  return valid.includes(val as RegionCode) ? (val as RegionCode) : undefined;
}

// Helper to safely get string from data
function str(val: unknown): string {
  return typeof val === 'string' ? val : '';
}

function strOrUndef(val: unknown): string | undefined {
  return typeof val === 'string' && val ? val : undefined;
}

function num(val: unknown, fallback: number): number {
  return typeof val === 'number' ? val : fallback;
}

function arr<T>(val: unknown): T[] {
  return Array.isArray(val) ? val : [];
}

/**
 * Convert database book format to BookDocument format
 */
function convertDbToBookDocument(dbBook: DbBook): BookDocument {
  const frontMatter: FrontMatter = dbBook.front_matter
    ? (dbBook.front_matter as unknown as FrontMatter)
    : { titlePage: true, tableOfContents: true };

  const backMatter: BackMatter = dbBook.back_matter
    ? (dbBook.back_matter as unknown as BackMatter)
    : {};

  return {
    meta: {
      id: dbBook.id,
      slug: dbBook.slug,
      title: dbBook.title,
      subtitle: dbBook.subtitle || undefined,
      author: dbBook.author,
      description: dbBook.description || undefined,
      languages: {
        baseLang: toLanguageCode(dbBook.base_lang, 'en'),
        targetLang: toLanguageCode(dbBook.target_lang, 'vi'),
        targetRegion: toRegionCode(dbBook.target_region),
      },
      level: toCEFRLevel(dbBook.level),
      trimSize: dbBook.trim_size || 'kdp-6x9',
      templateId: dbBook.template_id || 'ezviet',
      version: dbBook.version || '1.0',
      createdAt: dbBook.created_at,
      updatedAt: dbBook.updated_at,
    },
    frontMatter,
    chapters: (dbBook.book_chapters || []).map((ch) => convertDbChapter(ch)),
    backMatter,
  };
}

/**
 * Convert database chapter to Book Engine Chapter format
 */
function convertDbChapter(dbChapter: DbChapter): Chapter {
  // Convert flat content array to sections
  // For now, wrap all blocks in a single section
  const blocks = convertContentBlocks(dbChapter.content || []);

  return {
    id: dbChapter.id,
    number: dbChapter.number,
    title: dbChapter.title,
    subtitle: dbChapter.subtitle || undefined,
    sections: [
      {
        id: `${dbChapter.id}-main`,
        blocks,
      },
    ],
    objectives: dbChapter.objectives || undefined,
    summary: dbChapter.summary ? convertContentBlocks(dbChapter.summary) : undefined,
  };
}

/**
 * Convert editor content blocks to Book Engine blocks
 */
function convertContentBlocks(content: EditorBlock[]): Block[] {
  return content.map((block) => convertBlock(block)).filter((b): b is Block => b !== null);
}

/**
 * Convert a single editor block to Book Engine block
 */
function convertBlock(block: EditorBlock): Block | null {
  const { id, type, data } = block;

  switch (type) {
    case 'paragraph':
      return {
        id,
        type: 'paragraph',
        content: [{ text: str(data.text) }],
      };

    case 'heading': {
      const level = num(data.level, 2);
      return {
        id,
        type: 'heading',
        level: (level >= 1 && level <= 4 ? level : 2) as 1 | 2 | 3 | 4,
        content: str(data.text),
      };
    }

    case 'list':
      return {
        id,
        type: 'list',
        style: data.ordered ? 'numbered' : 'bullet',
        items: arr<string>(data.items).map((item) => [{ text: item }]),
      };

    case 'image':
      return {
        id,
        type: 'image',
        path: str(data.src),
        alt: str(data.alt),
        caption: strOrUndef(data.caption),
      };

    case 'callout': {
      const variant = str(data.type) || 'info';
      return {
        id,
        type: 'callout',
        title: strOrUndef(data.title),
        content: [{ text: str(data.text) }],
        variant: (['info', 'warning', 'success', 'example'].includes(variant)
          ? variant
          : 'info') as 'info' | 'warning' | 'success' | 'example',
      };
    }

    case 'vocabulary':
      return {
        id,
        type: 'vocabulary',
        targetText: str(data.targetWord),
        baseText: str(data.baseWord),
        romanization: strOrUndef(data.romanization),
        audioPath: strOrUndef(data.audioPath),
      };

    case 'vocabulary-list':
      return {
        id,
        type: 'vocabulary-list',
        title: strOrUndef(data.title),
        items: arr<VocabItem>(data.items).map((item) => ({
          targetText: item.targetWord || '',
          baseText: item.baseWord || '',
          romanization: item.romanization || undefined,
        })),
      };

    case 'dialogue':
      return {
        id,
        type: 'dialogue',
        title: strOrUndef(data.title),
        lines: arr<DialogueLine>(data.lines).map((line) => ({
          speaker: line.speaker || '',
          targetText: line.targetText || '',
          baseText: line.baseText || undefined,
          romanization: line.romanization || undefined,
        })),
      };

    case 'exercise': {
      const exerciseType = str(data.type) || 'fill-blank';
      return {
        id,
        type: 'exercise',
        exerciseType: (['fill-blank', 'translate', 'match', 'multiple-choice', 'listen-write', 'order-words'].includes(exerciseType)
          ? exerciseType
          : 'fill-blank') as 'fill-blank' | 'translate' | 'match',
        instructions: strOrUndef(data.instructions),
        prompt: strOrUndef(data.prompt),
        answer: strOrUndef(data.answer),
      };
    }

    case 'grammar-note':
      return {
        id,
        type: 'grammar-note',
        title: str(data.title),
        content: [{ text: str(data.explanation) }],
        examples: Array.isArray(data.examples)
          ? (data.examples as { targetText: string; baseText: string }[])
          : undefined,
      };

    case 'cultural-note':
      return {
        id,
        type: 'cultural-note',
        title: str(data.title),
        content: [{ text: str(data.text) }],
      };

    case 'illustrated-scene':
      return {
        id,
        type: 'illustrated-scene',
        imagePath: str(data.backgroundImage),
        imageAlt: 'Illustrated scene',
        bubbles: arr<BubbleData>(data.bubbles).map((b, i) => ({
          id: `${id}-bubble-${i}`,
          position: { x: b.x || 50, y: b.y || 50 },
          text: b.text || '',
          style: 'speech' as const,
          color: 'blue' as const,
        })),
      };

    case 'did-you-know':
      return {
        id,
        type: 'did-you-know',
        content: str(data.fact),
      };

    default:
      // Return paragraph as fallback for unknown types
      return {
        id,
        type: 'paragraph',
        content: [{ text: `[Unsupported block type: ${type}]` }],
      };
  }
}

// Types for database data
interface DbBook {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  author: string;
  description: string | null;
  base_lang: string | null;
  target_lang: string | null;
  target_region: string | null;
  level: string | null;
  trim_size: string | null;
  template_id: string | null;
  version: string | null;
  front_matter: Record<string, unknown> | null;
  back_matter: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  book_chapters: DbChapter[] | null;
}

interface DbChapter {
  id: string;
  number: number;
  title: string;
  subtitle: string | null;
  objectives: string[] | null;
  content: EditorBlock[] | null;
  summary: EditorBlock[] | null;
}

interface EditorBlock {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

interface VocabItem {
  targetWord?: string;
  baseWord?: string;
  romanization?: string;
}

interface DialogueLine {
  speaker?: string;
  targetText?: string;
  baseText?: string;
  romanization?: string;
}

interface BubbleData {
  x?: number;
  y?: number;
  text?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bookId = searchParams.get('id');
  const chapterIndex = searchParams.get('chapter');
  const templateId = searchParams.get('template') || 'ezviet';

  try {
    let book: BookDocument;

    if (bookId) {
      // Fetch actual book from database
      const supabase = createAdminClient();
      const { data: dbBook, error } = await supabase
        .from('books')
        .select(`
          *,
          book_chapters(
            id,
            number,
            title,
            subtitle,
            objectives,
            content,
            summary
          )
        `)
        .eq('id', bookId)
        .order('number', { referencedTable: 'book_chapters', ascending: true })
        .single();

      if (error || !dbBook) {
        return NextResponse.json(
          { error: 'Book not found' },
          { status: 404 }
        );
      }

      book = convertDbToBookDocument(dbBook as DbBook);
      book.meta.templateId = templateId;
    } else {
      // Fall back to sample book
      book = { ...SAMPLE_BOOK };
      book.meta = { ...book.meta, templateId };
    }

    let html: string;

    if (chapterIndex !== null) {
      // Render single chapter
      const index = parseInt(chapterIndex, 10);
      const chapter = book.chapters[index];
      if (!chapter) {
        return NextResponse.json(
          { error: 'Chapter not found' },
          { status: 404 }
        );
      }
      const template = getTemplate(templateId);
      html = renderChapterPreview(chapter, template);
    } else {
      // Render full book
      html = renderBook(book);
    }

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Book preview error:', error);
    return NextResponse.json(
      { error: 'Failed to render book' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { document, chapterIndex, templateId } = body as {
      document?: BookDocument;
      chapterIndex?: number;
      templateId?: string;
    };

    if (!document) {
      return NextResponse.json(
        { error: 'Book document required' },
        { status: 400 }
      );
    }

    // Override template if specified
    if (templateId) {
      document.meta.templateId = templateId;
    }

    let html: string;

    if (typeof chapterIndex === 'number') {
      const chapter = document.chapters[chapterIndex];
      if (!chapter) {
        return NextResponse.json(
          { error: 'Chapter not found' },
          { status: 404 }
        );
      }
      const template = getTemplate(document.meta.templateId);
      html = renderChapterPreview(chapter, template);
    } else {
      html = renderBook(document);
    }

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Book preview error:', error);
    return NextResponse.json(
      { error: 'Failed to render book' },
      { status: 500 }
    );
  }
}
