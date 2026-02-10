/**
 * Unit Templates for BookStudio
 *
 * Pre-built unit structures that create multiple pages at once.
 * Each template defines a specific learning pattern.
 */

import {
  type StudioPage,
  type PageType,
  createEmptyPage,
} from './types';

export interface UnitTemplate {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or Lucide icon name
  pages: PageType[];
}

export const UNIT_TEMPLATES: UnitTemplate[] = [
  {
    id: 'standard',
    name: 'Standard Learning Unit',
    description: 'Complete learning cycle: vocabulary, conversation, glossary, and quiz',
    icon: '📚',
    pages: ['intro', 'vocabulary-grid', 'conversation', 'lexics', 'revision'],
  },
  {
    id: 'vocabulary-focus',
    name: 'Vocabulary Focus',
    description: 'Heavy vocabulary practice with two grids and a glossary',
    icon: '🔤',
    pages: ['intro', 'vocabulary-grid', 'vocabulary-grid', 'lexics'],
  },
  {
    id: 'conversation-practice',
    name: 'Conversation Practice',
    description: 'Multiple dialogue scenarios for speaking practice',
    icon: '💬',
    pages: ['intro', 'conversation', 'conversation', 'conversation'],
  },
  {
    id: 'cultural-deep-dive',
    name: 'Cultural Deep Dive',
    description: 'Focus on cultural tips with vocabulary and conversation',
    icon: '🎎',
    pages: ['intro', 'vocabulary-grid', 'cultural-tips', 'conversation'],
  },
  {
    id: 'quick-review',
    name: 'Quick Review',
    description: 'Compact revision with lexics and quiz',
    icon: '⚡',
    pages: ['intro', 'lexics', 'revision'],
  },
];

/**
 * Generate pages for a unit template
 */
export function generateTemplatePages(
  templateId: string,
  unitTitle: string
): StudioPage[] {
  const template = UNIT_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    throw new Error(`Unknown template: ${templateId}`);
  }

  return template.pages.map((pageType, index) => {
    const page = createEmptyPage(pageType, index);

    // Customize page titles based on unit title
    switch (pageType) {
      case 'intro':
        return {
          ...page,
          title: unitTitle,
          subtitle: `Learn ${unitTitle.toLowerCase()} vocabulary and phrases`,
        };
      case 'vocabulary-grid':
        return {
          ...page,
          title: `${unitTitle} - Vocabulary${template.pages.filter(p => p === 'vocabulary-grid').length > 1 ? ` ${index}` : ''}`,
        };
      case 'conversation':
        return {
          ...page,
          title: `${unitTitle} - Dialogue${template.pages.filter(p => p === 'conversation').length > 1 ? ` ${template.pages.slice(0, index + 1).filter(p => p === 'conversation').length}` : ''}`,
        };
      case 'lexics':
        return {
          ...page,
          title: `LEXICS - ${unitTitle.toUpperCase()}`,
        };
      case 'revision':
        return {
          ...page,
          title: `REVISION - ${unitTitle.toUpperCase()}`,
        };
      case 'cultural-tips':
        return {
          ...page,
          title: `CULTURAL TIPS - ${unitTitle.toUpperCase()}`,
        };
      default:
        return page;
    }
  });
}
