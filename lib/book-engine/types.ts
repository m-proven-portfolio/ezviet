/**
 * EZVIET Book Engine - Core Types
 *
 * Language-agnostic schema for creating print-ready books.
 * Supports any language pair (EN→VI, FR→VI, VI→EN, etc.)
 */

// =============================================================================
// LANGUAGE CONFIGURATION
// =============================================================================

/**
 * ISO 639-1 language codes we support
 * Extensible - add more as needed
 */
export type LanguageCode = 'vi' | 'en' | 'fr' | 'ru' | 'es' | 'zh' | 'ja' | 'ko';

/**
 * Regional variants for languages with dialects
 * Vietnamese: 'north' (Hanoi), 'south' (Saigon), 'central' (Hue)
 */
export type RegionCode = 'north' | 'south' | 'central' | null;

/**
 * Language pair configuration for a book
 * baseLang: The learner's native language (what they know)
 * targetLang: The language they're learning
 */
export interface LanguagePair {
  baseLang: LanguageCode;
  targetLang: LanguageCode;
  targetRegion?: RegionCode;
}

// =============================================================================
// BOOK METADATA
// =============================================================================

/**
 * CEFR proficiency levels for content difficulty
 */
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

/**
 * Book series for grouping related books
 */
export interface BookSeries {
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverImagePath?: string;
}

/**
 * Trim sizes for print (in inches)
 * Common presets for Amazon KDP and other printers
 */
export interface TrimSize {
  width: number;  // inches
  height: number; // inches
  name: string;   // human-readable name
}

export const TRIM_SIZES: Record<string, TrimSize> = {
  'kdp-6x9': { width: 6, height: 9, name: 'KDP Standard (6×9)' },
  'kdp-5x8': { width: 5, height: 8, name: 'KDP Compact (5×8)' },
  'kdp-5.5x8.5': { width: 5.5, height: 8.5, name: 'KDP Digest (5.5×8.5)' },
  'kdp-8.5x11': { width: 8.5, height: 11, name: 'KDP Large (8.5×11)' },
  'a5': { width: 5.83, height: 8.27, name: 'A5 International' },
  'a4': { width: 8.27, height: 11.69, name: 'A4 International' },
} as const;

/**
 * Book metadata
 */
export interface BookMeta {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  author: string;
  description?: string;

  // Language configuration
  languages: LanguagePair;
  level: CEFRLevel;

  // Series (optional)
  seriesId?: string;
  seriesOrder?: number;

  // Print configuration
  trimSize: keyof typeof TRIM_SIZES;
  templateId: string;

  // Publishing
  isbn?: string;
  publishedAt?: string;
  version: string;

  // Cover
  coverImagePath?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// CONTENT BLOCKS - The building blocks of books
// =============================================================================

/**
 * Base properties for all blocks
 */
interface BlockBase {
  id: string;
  type: string;
}

/**
 * Rich text content (simplified - can be extended)
 * For inline formatting within paragraphs
 */
export interface RichText {
  text: string;
  marks?: ('bold' | 'italic' | 'underline' | 'highlight')[];
}

// -----------------------------------------------------------------------------
// TEXT BLOCKS
// -----------------------------------------------------------------------------

export interface ParagraphBlock extends BlockBase {
  type: 'paragraph';
  content: RichText[];
  align?: 'left' | 'center' | 'right';
}

export interface HeadingBlock extends BlockBase {
  type: 'heading';
  level: 1 | 2 | 3 | 4;
  content: string;
  // For TOC generation
  tocTitle?: string;
}

export interface ListBlock extends BlockBase {
  type: 'list';
  style: 'bullet' | 'numbered';
  items: RichText[][];
}

export interface QuoteBlock extends BlockBase {
  type: 'quote';
  content: RichText[];
  attribution?: string;
}

// -----------------------------------------------------------------------------
// LANGUAGE LEARNING BLOCKS (Our differentiator!)
// -----------------------------------------------------------------------------

/**
 * Vocabulary Card Block
 * Can reference an existing card from the database OR be standalone
 */
export interface VocabularyBlock extends BlockBase {
  type: 'vocabulary';

  // Reference to existing card (optional)
  cardId?: string;

  // Standalone data (used if no cardId, or for overrides)
  targetText: string;        // Vietnamese: "Xin chào"
  baseText: string;          // English: "Hello"
  romanization?: string;     // "sin chào"
  ipa?: string;              // /sɪn tʃaʊ/
  audioPath?: string;
  imagePath?: string;

  // Learning metadata
  difficulty?: CEFRLevel;

  // Display options
  showImage?: boolean;
  showAudio?: boolean;
  showRomanization?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Vocabulary List Block - Multiple words in a compact format
 */
export interface VocabularyListBlock extends BlockBase {
  type: 'vocabulary-list';
  title?: string;
  items: {
    targetText: string;
    baseText: string;
    romanization?: string;
    cardId?: string;
  }[];
  columns?: 1 | 2 | 3;
}

/**
 * Dialogue Block - Conversation format
 */
export interface DialogueLine {
  speaker: string;
  targetText: string;
  baseText?: string;      // Translation (optional, can be hidden)
  romanization?: string;
  audioPath?: string;
}

export interface DialogueBlock extends BlockBase {
  type: 'dialogue';
  title?: string;
  context?: string;       // Scene description
  lines: DialogueLine[];
  showTranslations?: boolean;
}

/**
 * Tone Chart Block (Vietnamese-specific, but could work for Chinese too)
 */
export interface ToneChartBlock extends BlockBase {
  type: 'tone-chart';
  word: string;
  showAllTones?: boolean; // Show all 6 tones for comparison
}

/**
 * Exercise Block - Various exercise types
 */
export type ExerciseType =
  | 'fill-blank'      // Fill in the missing word
  | 'translate'       // Translate sentence
  | 'match'           // Match pairs
  | 'multiple-choice' // Choose correct answer
  | 'listen-write'    // Listen and write what you hear
  | 'order-words';    // Put words in correct order

export interface ExerciseBlock extends BlockBase {
  type: 'exercise';
  exerciseType: ExerciseType;
  instructions?: string;

  // For fill-blank, translate, listen-write
  prompt?: string;
  answer?: string;
  hint?: string;
  audioPath?: string;

  // For match
  pairs?: { left: string; right: string }[];

  // For multiple-choice
  question?: string;
  choices?: string[];
  correctIndex?: number;

  // For order-words
  words?: string[];
  correctOrder?: number[];

  // Display
  showAnswerArea?: boolean;
  linesForAnswer?: number;
}

/**
 * Grammar Note Block
 */
export interface GrammarNoteBlock extends BlockBase {
  type: 'grammar-note';
  title: string;
  content: RichText[];
  examples?: {
    targetText: string;
    baseText: string;
  }[];
  variant?: 'info' | 'warning' | 'tip';
}

/**
 * Cultural Note Block
 */
export interface CulturalNoteBlock extends BlockBase {
  type: 'cultural-note';
  title: string;
  content: RichText[];
  imagePath?: string;
}

// -----------------------------------------------------------------------------
// MEDIA BLOCKS
// -----------------------------------------------------------------------------

export interface ImageBlock extends BlockBase {
  type: 'image';
  path: string;
  alt: string;
  caption?: string;
  width?: 'full' | 'half' | 'third';
  align?: 'left' | 'center' | 'right';
  // Print quality check
  dpi?: number;
}

export interface TableBlock extends BlockBase {
  type: 'table';
  headers?: string[];
  rows: string[][];
  caption?: string;
}

// -----------------------------------------------------------------------------
// ILLUSTRATED PAGE BLOCKS (For visual-heavy pages like your partner's design)
// -----------------------------------------------------------------------------

/**
 * Position on a canvas (percentage-based for responsiveness)
 */
export interface Position {
  x: number;  // 0-100 percentage from left
  y: number;  // 0-100 percentage from top
}

/**
 * Speech Bubble - Positioned text on an illustration
 */
export interface SpeechBubble {
  id: string;
  position: Position;
  text: string;
  speaker?: string;
  style: 'speech' | 'thought' | 'label' | 'shout';
  color: 'blue' | 'orange' | 'white' | 'green' | 'pink';
  tailDirection?: 'left' | 'right' | 'bottom' | 'top' | 'none';
  width?: number;  // percentage width, default 20
}

/**
 * Illustrated Scene Block - Full illustration with speech bubbles
 * This matches your partner's dialogue scenes
 */
export interface IllustratedSceneBlock extends BlockBase {
  type: 'illustrated-scene';
  imagePath: string;
  imageAlt: string;
  bubbles: SpeechBubble[];
  caption?: string;
  // For print
  aspectRatio?: '16:9' | '4:3' | '1:1' | 'auto';
}

/**
 * Vocabulary Grid Block - Grid of image+word cards
 * Matches the "Unit 6: Fruits" vocabulary panel
 */
export interface VocabularyGridBlock extends BlockBase {
  type: 'vocabulary-grid';
  title?: string;
  titleIcon?: string;  // emoji or image path
  columns: 2 | 3 | 4;
  items: {
    id: string;
    imagePath: string;
    targetText: string;      // Vietnamese
    baseText: string;        // English
    romanization?: string;
    audioUrl?: string;       // For QR code generation
    cardId?: string;         // Reference to existing card
  }[];
  showRomanization?: boolean;
  generateQRCodes?: boolean;
}

/**
 * QR Code Block - Links to audio/content
 */
export interface QRCodeBlock extends BlockBase {
  type: 'qr-code';
  url: string;
  label?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Did You Know Block - Cultural fact callout
 */
export interface DidYouKnowBlock extends BlockBase {
  type: 'did-you-know';
  content: string;
  region?: 'north' | 'south' | 'central';
}

/**
 * Two Column Layout - For illustrated page + vocabulary side by side
 */
export interface TwoColumnBlock extends BlockBase {
  type: 'two-column';
  leftColumn: Block[];
  rightColumn: Block[];
  ratio?: '1:1' | '2:1' | '1:2' | '3:2' | '2:3';
}

/**
 * Canvas Page - Full page with absolutely positioned elements
 * Maximum flexibility for custom layouts
 */
export interface CanvasPageBlock extends BlockBase {
  type: 'canvas-page';
  backgroundImage?: string;
  backgroundColor?: string;
  elements: CanvasElement[];
}

export interface CanvasElement {
  id: string;
  type: 'image' | 'text' | 'bubble' | 'vocabulary-card' | 'qr-code';
  position: Position;
  width: number;   // percentage
  height?: number; // percentage, auto if not set
  rotation?: number;
  data: Record<string, unknown>;  // Type-specific data
}

// -----------------------------------------------------------------------------
// LAYOUT BLOCKS
// -----------------------------------------------------------------------------

export interface PageBreakBlock extends BlockBase {
  type: 'page-break';
}

export interface SectionBreakBlock extends BlockBase {
  type: 'section-break';
  style?: 'line' | 'ornament' | 'space';
}

export interface CalloutBlock extends BlockBase {
  type: 'callout';
  title?: string;
  content: RichText[];
  variant: 'info' | 'warning' | 'success' | 'example';
  icon?: string;
}

// -----------------------------------------------------------------------------
// UNION TYPE FOR ALL BLOCKS
// -----------------------------------------------------------------------------

export type Block =
  | ParagraphBlock
  | HeadingBlock
  | ListBlock
  | QuoteBlock
  | VocabularyBlock
  | VocabularyListBlock
  | DialogueBlock
  | ToneChartBlock
  | ExerciseBlock
  | GrammarNoteBlock
  | CulturalNoteBlock
  | ImageBlock
  | TableBlock
  | PageBreakBlock
  | SectionBreakBlock
  | CalloutBlock
  // Illustrated page blocks
  | IllustratedSceneBlock
  | VocabularyGridBlock
  | QRCodeBlock
  | DidYouKnowBlock
  | TwoColumnBlock
  | CanvasPageBlock;

export type BlockType = Block['type'];

// =============================================================================
// DOCUMENT STRUCTURE
// =============================================================================

/**
 * Section within a chapter
 */
export interface Section {
  id: string;
  title?: string;
  blocks: Block[];
}

/**
 * Chapter in a book
 */
export interface Chapter {
  id: string;
  number: number;
  title: string;
  subtitle?: string;
  sections: Section[];

  // Learning objectives for this chapter
  objectives?: string[];

  // Summary/review at end
  summary?: Block[];
}

/**
 * Front matter (before main content)
 */
export interface FrontMatter {
  titlePage: boolean;
  copyright?: string;
  dedication?: string;
  preface?: Block[];
  tableOfContents: boolean;
  howToUse?: Block[];
}

/**
 * Back matter (after main content)
 */
export interface BackMatter {
  appendices?: {
    id: string;
    title: string;
    blocks: Block[];
  }[];
  glossary?: {
    term: string;
    definition: string;
  }[];
  answerKey?: boolean; // Generate from exercises
  index?: boolean;
  aboutAuthor?: Block[];
}

/**
 * Complete book document
 */
export interface BookDocument {
  meta: BookMeta;
  frontMatter: FrontMatter;
  chapters: Chapter[];
  backMatter: BackMatter;
}

// =============================================================================
// TEMPLATE & DESIGN TOKENS
// =============================================================================

/**
 * Typography settings
 */
export interface TypographyTokens {
  fontFamily: {
    heading: string;
    body: string;
    mono: string;
    vietnamese?: string; // Optional: specific font for Vietnamese diacritics
  };
  fontSize: {
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    body: string;
    small: string;
    caption: string;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

/**
 * Spacing settings (in points for print)
 */
export interface SpacingTokens {
  page: {
    marginTop: string;
    marginBottom: string;
    marginInner: string;  // Gutter side
    marginOuter: string;
    bleed?: string;
  };
  block: {
    paragraphSpacing: string;
    sectionSpacing: string;
    chapterSpacing: string;
  };
}

/**
 * Color tokens
 */
export interface ColorTokens {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textMuted: string;
  background: string;
  border: string;
  // Callout variants
  info: string;
  warning: string;
  success: string;
  example: string;
}

/**
 * Complete template definition
 */
export interface BookTemplate {
  id: string;
  name: string;
  description?: string;

  typography: TypographyTokens;
  spacing: SpacingTokens;
  colors: ColorTokens;

  // CSS overrides for fine-tuning
  customCSS?: string;
}

// =============================================================================
// EXPORT CONFIGURATION
// =============================================================================

export interface PDFExportConfig {
  includeBleed: boolean;
  bleedSize: string;  // e.g., "0.125in"
  colorProfile: 'sRGB' | 'CMYK';
  embedFonts: boolean;
  generateTOC: boolean;
  generateIndex: boolean;
}

export interface EPUBExportConfig {
  version: '2.0' | '3.0';
  includeAudio: boolean;
  coverImage: boolean;
  generateTOC: boolean;
}

export interface ExportConfig {
  pdf?: PDFExportConfig;
  epub?: EPUBExportConfig;
}

// =============================================================================
// VALIDATION
// =============================================================================

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  blockId?: string;
  chapterId?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}
