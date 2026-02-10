/**
 * EZVIET Book Engine - Templates
 *
 * Predefined design templates using design tokens.
 * Templates control typography, colors, and spacing.
 */

import type { BookTemplate } from './types';

/**
 * Classic Template
 * Traditional book design with serif fonts
 * Good for formal textbooks
 */
export const TEMPLATE_CLASSIC: BookTemplate = {
  id: 'classic',
  name: 'Classic',
  description: 'Traditional textbook design with elegant serif typography',

  typography: {
    fontFamily: {
      heading: '"Merriweather", "Georgia", serif',
      body: '"Source Serif Pro", "Georgia", serif',
      mono: '"Source Code Pro", "Courier New", monospace',
      vietnamese: '"Noto Serif", serif', // Excellent Vietnamese diacritic support
    },
    fontSize: {
      h1: '28pt',
      h2: '22pt',
      h3: '18pt',
      h4: '14pt',
      body: '11pt',
      small: '9pt',
      caption: '8pt',
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.8,
    },
  },

  spacing: {
    page: {
      marginTop: '0.75in',
      marginBottom: '0.75in',
      marginInner: '0.875in',  // Larger for binding
      marginOuter: '0.625in',
      bleed: '0.125in',
    },
    block: {
      paragraphSpacing: '0.5em',
      sectionSpacing: '1.5em',
      chapterSpacing: '2in',
    },
  },

  colors: {
    primary: '#1a365d',      // Deep blue
    secondary: '#2c5282',
    accent: '#d69e2e',       // Gold
    text: '#1a202c',
    textMuted: '#4a5568',
    background: '#ffffff',
    border: '#e2e8f0',
    info: '#3182ce',
    warning: '#dd6b20',
    success: '#38a169',
    example: '#805ad5',
  },
};

/**
 * Modern Template
 * Clean, contemporary design with sans-serif fonts
 * Good for casual learners
 */
export const TEMPLATE_MODERN: BookTemplate = {
  id: 'modern',
  name: 'Modern',
  description: 'Clean, contemporary design for casual learners',

  typography: {
    fontFamily: {
      heading: '"Inter", "Helvetica Neue", sans-serif',
      body: '"Inter", "Helvetica Neue", sans-serif',
      mono: '"JetBrains Mono", "Consolas", monospace',
      vietnamese: '"Be Vietnam Pro", sans-serif', // Modern Vietnamese font
    },
    fontSize: {
      h1: '32pt',
      h2: '24pt',
      h3: '18pt',
      h4: '14pt',
      body: '11pt',
      small: '9pt',
      caption: '8pt',
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.6,
      relaxed: 1.9,
    },
  },

  spacing: {
    page: {
      marginTop: '0.875in',
      marginBottom: '0.875in',
      marginInner: '0.875in',
      marginOuter: '0.75in',
      bleed: '0.125in',
    },
    block: {
      paragraphSpacing: '0.75em',
      sectionSpacing: '2em',
      chapterSpacing: '2.5in',
    },
  },

  colors: {
    primary: '#059669',      // Emerald (EZViet brand)
    secondary: '#10b981',
    accent: '#f59e0b',       // Amber
    text: '#111827',
    textMuted: '#6b7280',
    background: '#ffffff',
    border: '#e5e7eb',
    info: '#0ea5e9',
    warning: '#f97316',
    success: '#22c55e',
    example: '#8b5cf6',
  },
};

/**
 * EZViet Brand Template
 * Matches the EZViet platform design
 */
export const TEMPLATE_EZVIET: BookTemplate = {
  id: 'ezviet',
  name: 'EZViet Brand',
  description: 'Official EZViet brand design',

  typography: {
    fontFamily: {
      heading: '"Be Vietnam Pro", "Inter", sans-serif',
      body: '"Be Vietnam Pro", "Inter", sans-serif',
      mono: '"JetBrains Mono", monospace',
      vietnamese: '"Be Vietnam Pro", sans-serif',
    },
    fontSize: {
      h1: '30pt',
      h2: '22pt',
      h3: '16pt',
      h4: '13pt',
      body: '11pt',
      small: '9pt',
      caption: '8pt',
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.6,
      relaxed: 1.85,
    },
  },

  spacing: {
    page: {
      marginTop: '0.75in',
      marginBottom: '0.75in',
      marginInner: '0.875in',
      marginOuter: '0.625in',
      bleed: '0.125in',
    },
    block: {
      paragraphSpacing: '0.6em',
      sectionSpacing: '1.75em',
      chapterSpacing: '2in',
    },
  },

  colors: {
    primary: '#10b981',      // Emerald-500 (from your existing UI)
    secondary: '#059669',    // Emerald-600
    accent: '#8b5cf6',       // Purple accent
    text: '#1f2937',         // Gray-800
    textMuted: '#6b7280',    // Gray-500
    background: '#ffffff',
    border: '#e5e7eb',
    info: '#3b82f6',
    warning: '#f59e0b',
    success: '#10b981',
    example: '#8b5cf6',
  },
};

/**
 * All available templates
 */
export const TEMPLATES: Record<string, BookTemplate> = {
  classic: TEMPLATE_CLASSIC,
  modern: TEMPLATE_MODERN,
  ezviet: TEMPLATE_EZVIET,
};

/**
 * Get a template by ID
 */
export function getTemplate(id: string): BookTemplate {
  return TEMPLATES[id] || TEMPLATE_EZVIET;
}
