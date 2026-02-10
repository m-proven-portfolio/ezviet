/**
 * EZVIET Book Engine
 *
 * Core engine for creating print-ready Vietnamese learning books.
 * Supports any language pair and multiple export formats.
 */

// Types
export * from './types';

// Templates
export { TEMPLATES, getTemplate, TEMPLATE_CLASSIC, TEMPLATE_MODERN, TEMPLATE_EZVIET } from './templates';

// Renderer
export { renderBook, renderChapterPreview, generateCSS } from './renderer';

// Re-export commonly used types for convenience
export type {
  BookDocument,
  BookMeta,
  Chapter,
  Section,
  Block,
  BlockType,
  LanguageCode,
  LanguagePair,
  CEFRLevel,
  BookTemplate,
} from './types';
