/**
 * Book Studio Types
 *
 * Simplified page-based book structure for easy book creation.
 * Each page is one of 9 template types with specific data shapes.
 */

import type { GridLayoutPreset } from './grid-layouts';

// ============================================================================
// Page Types
// ============================================================================

export type PageType =
  | 'intro'
  | 'vocabulary-grid'
  | 'conversation'
  | 'cultural-tips'
  | 'revision'
  | 'lexics'
  | 'free-form'
  | 'image-labeling'
  | 'lesson';

// Base interface for all pages
interface BasePage {
  id: string;
  type: PageType;
  order: number;
}

// 1. Intro Page - Book/chapter opener
export interface IntroPage extends BasePage {
  type: 'intro';
  unitNumber?: string; // "Unit 6" or "Chapter 1"
  title: string; // "FRUITS"
  titleVietnamese?: string; // "Trái Cây"
  subtitle?: string; // "Learn to buy fruit at the Vietnamese market!"
  illustration?: string; // Image URL
}

// 2. Vocabulary Grid Page - Cards in configurable grid layout
export interface VocabularyGridPage extends BasePage {
  type: 'vocabulary-grid';
  title: string;
  layout: GridLayoutPreset; // Preset grid layout (default '2x3')
  cards: VocabCard[];
}

export interface VocabCard {
  id: string;
  image?: string; // URL or storage path
  vietnamese: string;
  english: string;
  pronunciation?: string; // Romanization
  audioSlug?: string; // For QR code linking to ezviet.org/learn/[slug]
  showQRCode: boolean;
}

// 3. Conversation Scene Page - Dialogue with illustration
export type ConversationLayoutStyle =
  | 'chat-bubbles' // Original: simple chat bubbles
  | 'comic-strip' // Vertical panels with image per exchange
  | 'side-by-side' // Image on one side, dialogue on other (alternating)
  | 'illustrated-scene' // Speech bubbles overlaid on scene image
  | 'picture-book'; // Full-page image with 1-2 sentences below (storybook style)

export interface ConversationPage extends BasePage {
  type: 'conversation';
  title?: string;
  sceneImage?: string;
  layoutStyle: ConversationLayoutStyle;
  dialogues: DialogueLine[]; // Flat list (for chat-bubbles, illustrated-scene, picture-book)
  panels?: ConversationPanel[]; // Panel-based structure (for comic-strip, side-by-side)
  showTranslations: boolean;
}

export interface DialogueLine {
  id: string;
  speaker: 'buyer' | 'seller' | 'custom';
  speakerName?: string; // For custom speaker
  vietnamese: string;
  english: string;
  position: 'left' | 'right';
  image?: string; // Per-dialogue image (for comic-strip/side-by-side layouts) - DEPRECATED: use ConversationPanel.image
}

// Panel structure for comic-strip/side-by-side layouts (one image, multiple lines)
export interface ConversationPanel {
  id: string;
  image?: string; // One image per panel
  lines: DialogueLine[]; // Multiple dialogue lines in this panel
}

// 4. Cultural Tips Page - Info boxes about Vietnamese culture
export interface CulturalTipsPage extends BasePage {
  type: 'cultural-tips';
  title: string; // "CULTURAL TIPS - UNIT 1"
  headerImage?: string;
  sections: CulturalSection[];
  footerTip?: string; // Optional tip with lightbulb icon
}

export interface CulturalSection {
  id: string;
  title: string; // "GREETINGS & POLITENESS"
  bullets: string[]; // Bullet points
}

// 5. Revision Quiz Page - Fill-in-the-blank exercises
export interface RevisionPage extends BasePage {
  type: 'revision';
  title: string; // "REVISION - FRUITS"
  prompt: string; // "What fruit is it?"
  promptRomanization?: string; // "/wot frut iz it/"
  headerImage?: string; // Boy/girl asking illustration
  answers: RevisionAnswer[];
}

export interface RevisionAnswer {
  id: string;
  image?: string;
  text: string;
}

// 6. Lexics Page - Glossary/word list table
export interface LexicsPage extends BasePage {
  type: 'lexics';
  title: string; // "LEXICS - UNIT 6: FRUITS"
  words: LexicsWord[];
  showQRCode: boolean; // Single QR for the page
}

export interface LexicsWord {
  id: string;
  vietnamese: string;
  pronunciation: string; // Romanization
  english: string;
  audioSlug?: string;
}

// 7. Free Form Page - Rich text editor
export interface FreeFormPage extends BasePage {
  type: 'free-form';
  title?: string;
  content: string; // Rich text (HTML)
}

// 8. Image Labeling Page - Click-to-label vocabulary on images
// Creates THREE experiences: Print worksheet, Explore mode, Game modes
export type GameMode = 'tap-identify' | 'speed-challenge' | 'memory-explorer';

export interface ImageLabel {
  id: string;
  x: number; // Percentage (0-100) from left edge
  y: number; // Percentage (0-100) from top edge
  vietnamese: string;
  english: string;
  pronunciation?: string;
  audioUrl?: string; // Generated TTS URL
  hints?: string[]; // Hints for game mode
  card_id?: string; // Optional link to a flashcard for "Learn More"
  cardName?: string; // Cached display name (e.g., "số sáu (number six)")
}

export interface ImageLabelingPage extends BasePage {
  type: 'image-labeling';
  title: string;
  instructions?: string; // "Label the kitchen items"
  backgroundImage?: string; // URL of the scene image
  labels: ImageLabel[]; // Array of placed labels

  // Print settings (simple)
  showLegend: boolean; // Show numbered legend below image

  // Interactive settings
  interactiveEnabled: boolean; // Enable online interactive mode
  gameModes: GameMode[]; // Which games are available
  difficulty: 'easy' | 'medium' | 'hard';
}

// 9. Lesson Page - Composite page with multiple optional sections
// Fixed order: dialogue -> vocabulary -> tastes -> cultural tips
export interface LessonPage extends BasePage {
  type: 'lesson';
  title: string;
  subtitle?: string;

  // Section visibility toggles
  sections: {
    dialogue: boolean;
    vocabulary: boolean;
    tastes: boolean;
    culturalTips: boolean;
  };

  // SECTION 1: Dialogue (simplified conversation)
  dialogue?: {
    sceneImage?: string;
    lines: SimplifiedDialogueLine[];
    showTranslations: boolean;
  };

  // SECTION 2: Vocabulary Grid
  vocabulary?: {
    sectionTitle?: string; // "Key Words" or custom
    layout: GridLayoutPreset;
    cards: VocabCard[];
  };

  // SECTION 3: Tastes (flexible content - text OR images)
  tastes?: {
    sectionTitle?: string; // "Did You Know?" or custom
    contentType: 'text' | 'images';
    textContent?: string; // For text mode
    images?: TastesImage[]; // For images mode
  };

  // SECTION 4: Cultural Tips
  culturalTips?: {
    sectionTitle?: string;
    tips: string[];
    footerTip?: string;
  };
}

// Simplified dialogue line (no per-line images, simpler than ConversationPage)
export interface SimplifiedDialogueLine {
  id: string;
  speaker: 'A' | 'B' | 'custom';
  speakerName?: string;
  vietnamese: string;
  english: string;
}

// Tastes image item
export interface TastesImage {
  id: string;
  image: string;
  caption?: string;
  captionVietnamese?: string;
}

// Union type for all pages
export type StudioPage =
  | IntroPage
  | VocabularyGridPage
  | ConversationPage
  | CulturalTipsPage
  | RevisionPage
  | LexicsPage
  | FreeFormPage
  | ImageLabelingPage
  | LessonPage;

// ============================================================================
// Unit Structure (NEW: intermediate layer between Book and Pages)
// ============================================================================

export interface StudioUnit {
  id: string;
  title: string; // "Unit 1", "Unit 2", etc.
  order: number;
  pages: StudioPage[];
}

// ============================================================================
// Book Structure
// ============================================================================

export interface StudioBook {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  coverImage?: string;
  units: StudioUnit[]; // NEW: books now contain units
  pages: StudioPage[]; // DEPRECATED: kept for backward compatibility, migrate to units
  settings: BookSettings;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface BookSettings {
  pageSize: PageSize;
  stylePrompt: string; // Sticky AI style prompt
  showRomanization: boolean; // Show pronunciation guides (hidden by default)
}

export type PageSize = 'a4' | 'letter' | '6x9' | 'a5' | '17x24';

export const PAGE_SIZE_DIMENSIONS: Record<
  PageSize,
  { width: string; height: string; label: string }
> = {
  a4: { width: '210mm', height: '297mm', label: 'A4 (210x297mm)' },
  letter: { width: '8.5in', height: '11in', label: 'US Letter (8.5x11in)' },
  '6x9': { width: '6in', height: '9in', label: '6x9 inches (KDP)' },
  a5: { width: '148mm', height: '210mm', label: 'A5 (148x210mm)' },
  '17x24': { width: '170mm', height: '240mm', label: '17x24 cm (123Vietnamese)' },
};

// ============================================================================
// Template Metadata
// ============================================================================

export interface PageTemplate {
  type: PageType;
  label: string;
  description: string;
  icon: string; // Lucide icon name
  defaultData: Partial<StudioPage>;
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    type: 'intro',
    label: 'Intro Page',
    description: 'Book or chapter opener with title and illustration',
    icon: 'BookOpen',
    defaultData: {
      title: 'Unit Title',
      titleVietnamese: '',
      subtitle: '',
    },
  },
  {
    type: 'vocabulary-grid',
    label: 'Vocabulary Grid',
    description: 'Vocabulary cards in configurable grid layout',
    icon: 'Grid3X3',
    defaultData: {
      title: 'Vocabulary',
      layout: '2x3',
      cards: [],
    },
  },
  {
    type: 'conversation',
    label: 'Conversation Scene',
    description: 'Dialogue between buyer and seller with illustration',
    icon: 'MessageSquare',
    defaultData: {
      layoutStyle: 'comic-strip',
      dialogues: [],
      showTranslations: true,
    },
  },
  {
    type: 'cultural-tips',
    label: 'Cultural Tips',
    description: 'Information boxes about Vietnamese culture',
    icon: 'Lightbulb',
    defaultData: {
      title: 'Cultural Tips',
      sections: [],
    },
  },
  {
    type: 'revision',
    label: 'Revision Quiz',
    description: 'Fill-in-the-blank practice exercises',
    icon: 'CheckSquare',
    defaultData: {
      title: 'Revision',
      prompt: 'What is this?',
      answers: [],
    },
  },
  {
    type: 'lexics',
    label: 'Lexics',
    description: 'Compact glossary and word list table',
    icon: 'List',
    defaultData: {
      title: 'Lexics',
      words: [],
      showQRCode: true,
    },
  },
  {
    type: 'free-form',
    label: 'Free Form',
    description: 'Rich text editor for custom content',
    icon: 'FileText',
    defaultData: {
      content: '',
    },
  },
  {
    type: 'image-labeling',
    label: 'Image Labeling',
    description: 'Label objects in an image - prints + interactive games!',
    icon: 'MousePointerClick',
    defaultData: {
      title: 'Label the Picture',
      labels: [],
      showLegend: true,
      interactiveEnabled: true,
      gameModes: ['tap-identify', 'speed-challenge', 'memory-explorer'],
      difficulty: 'medium',
    },
  },
  {
    type: 'lesson',
    label: 'Lesson Page',
    description: 'Composite page with dialogue, vocabulary, tastes & tips',
    icon: 'LayoutTemplate',
    defaultData: {
      title: 'Lesson',
      sections: {
        dialogue: true,
        vocabulary: true,
        tastes: false,
        culturalTips: false,
      },
    },
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createEmptyPage(type: PageType, order: number): StudioPage {
  const template = PAGE_TEMPLATES.find(t => t.type === type);
  const baseData = {
    id: generateId(),
    type,
    order,
    ...template?.defaultData,
  };

  switch (type) {
    case 'intro':
      return {
        ...baseData,
        type: 'intro',
        title: 'Unit Title',
      } as IntroPage;

    case 'vocabulary-grid':
      return {
        ...baseData,
        type: 'vocabulary-grid',
        title: 'Vocabulary',
        layout: '2x3',
        cards: Array.from({ length: 6 }, () => ({
          id: generateId(),
          vietnamese: '',
          english: '',
          showQRCode: true,
        })),
      } as VocabularyGridPage;

    case 'conversation':
      return {
        ...baseData,
        type: 'conversation',
        layoutStyle: 'comic-strip', // Default to the most visually appealing style
        dialogues: [],
        showTranslations: true,
      } as ConversationPage;

    case 'cultural-tips':
      return {
        ...baseData,
        type: 'cultural-tips',
        title: 'Cultural Tips',
        sections: [
          {
            id: generateId(),
            title: 'Section Title',
            bullets: ['First point', 'Second point'],
          },
        ],
      } as CulturalTipsPage;

    case 'revision':
      return {
        ...baseData,
        type: 'revision',
        title: 'Revision',
        prompt: 'What is this?',
        answers: [],
      } as RevisionPage;

    case 'lexics':
      return {
        ...baseData,
        type: 'lexics',
        title: 'Lexics',
        words: [],
        showQRCode: true,
      } as LexicsPage;

    case 'free-form':
      return {
        ...baseData,
        type: 'free-form',
        content: '<p>Start typing here...</p>',
      } as FreeFormPage;

    case 'image-labeling':
      return {
        ...baseData,
        type: 'image-labeling',
        title: 'Label the Picture',
        labels: [],
        showLegend: true,
        interactiveEnabled: true,
        gameModes: ['tap-identify', 'speed-challenge', 'memory-explorer'],
        difficulty: 'medium',
      } as ImageLabelingPage;

    case 'lesson':
      return {
        ...baseData,
        type: 'lesson',
        title: 'Lesson',
        sections: {
          dialogue: true,
          vocabulary: true,
          tastes: false,
          culturalTips: false,
        },
        dialogue: {
          lines: [],
          showTranslations: true,
        },
        vocabulary: {
          sectionTitle: 'Key Words',
          layout: '2x3',
          cards: [],
        },
      } as LessonPage;

    default:
      throw new Error(`Unknown page type: ${type}`);
  }
}

export function createEmptyUnit(title: string, order: number): StudioUnit {
  return {
    id: generateId(),
    title,
    order,
    pages: [],
  };
}

export function createEmptyBook(title: string, createdBy: string): StudioBook {
  return {
    id: generateId(),
    title,
    units: [createEmptyUnit('Unit 1', 0)], // Start with one empty unit
    pages: [], // Deprecated, kept for backward compatibility
    settings: {
      pageSize: 'a4',
      stylePrompt: 'white background, photo shoot studio pro, ultra realistic',
      showRomanization: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy,
  };
}

// Migration helper: converts old books (with pages) to new structure (with units)
export function migrateBookToUnits(book: StudioBook): StudioBook {
  // If already has units with pages, no migration needed
  if (book.units && book.units.length > 0 && book.units.some(u => u.pages.length > 0)) {
    return book;
  }

  // If has legacy pages but no units, migrate them to Unit 1
  if (book.pages && book.pages.length > 0) {
    return {
      ...book,
      units: [
        {
          id: generateId(),
          title: 'Unit 1',
          order: 0,
          pages: book.pages,
        },
      ],
      pages: [], // Clear legacy pages after migration
    };
  }

  // If no units at all, create empty Unit 1
  if (!book.units || book.units.length === 0) {
    return {
      ...book,
      units: [createEmptyUnit('Unit 1', 0)],
      pages: [],
    };
  }

  return book;
}

// Helper to count total pages across all units
export function getTotalPageCount(book: StudioBook): number {
  if (!book.units) return book.pages?.length || 0;
  return book.units.reduce((total, unit) => total + unit.pages.length, 0);
}

// Migration helper: converts old dialogues (1 image per line) to panels (1 image per panel)
export function migrateDialoguesToPanels(page: ConversationPage): ConversationPanel[] {
  // If already has panels, return them
  if (page.panels && page.panels.length > 0) {
    return page.panels;
  }

  // Convert old format: each dialogue becomes a single-line panel
  return (page.dialogues || []).map(line => ({
    id: generateId(),
    image: line.image,
    lines: [{ ...line, image: undefined }], // Move image to panel level
  }));
}
