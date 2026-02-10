/**
 * EZVIET Book Engine - CSS Generation
 *
 * Generates print-ready CSS from template tokens.
 */

import type { BookTemplate } from './types';

/**
 * Generate CSS from template tokens
 */
export function generateCSS(template: BookTemplate): string {
  const { typography, spacing, colors } = template;

  return `
/* EZVIET Book Engine - Template: ${template.name} */

@page {
  size: var(--page-width) var(--page-height);
  margin: ${spacing.page.marginTop} ${spacing.page.marginOuter} ${spacing.page.marginBottom} ${spacing.page.marginInner};
  @top-center { content: string(chapter-title); font-size: ${typography.fontSize.small}; color: ${colors.textMuted}; }
  @bottom-center { content: counter(page); font-size: ${typography.fontSize.small}; color: ${colors.textMuted}; }
}
@page :first { @top-center { content: none; } @bottom-center { content: none; } }

:root {
  --font-heading: ${typography.fontFamily.heading};
  --font-body: ${typography.fontFamily.body};
  --font-mono: ${typography.fontFamily.mono};
  --font-vietnamese: ${typography.fontFamily.vietnamese || typography.fontFamily.body};
  --color-primary: ${colors.primary};
  --color-secondary: ${colors.secondary};
  --color-text: ${colors.text};
  --color-text-muted: ${colors.textMuted};
  --color-border: ${colors.border};
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font-body); font-size: ${typography.fontSize.body}; line-height: ${typography.lineHeight.normal}; color: var(--color-text); }

h1, h2, h3, h4 { font-family: var(--font-heading); color: var(--color-primary); page-break-after: avoid; }
h1 { font-size: ${typography.fontSize.h1}; margin-bottom: 0.5em; }
h2 { font-size: ${typography.fontSize.h2}; margin-top: 1.5em; margin-bottom: 0.5em; }
h3 { font-size: ${typography.fontSize.h3}; margin-top: 1em; margin-bottom: 0.4em; }
h4 { font-size: ${typography.fontSize.h4}; margin-top: 0.8em; margin-bottom: 0.3em; }
p { margin-bottom: ${spacing.block.paragraphSpacing}; text-align: justify; hyphens: auto; }

.vietnamese-text { font-family: var(--font-vietnamese); }
.chapter { page-break-before: always; string-set: chapter-title attr(data-title); }
.chapter-header { text-align: center; margin-bottom: 2em; padding-bottom: 1em; border-bottom: 2px solid var(--color-primary); }
.chapter-number { font-size: ${typography.fontSize.h3}; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5em; }
.chapter-title { font-size: ${typography.fontSize.h1}; color: var(--color-primary); margin: 0; }

.vocabulary-card { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid var(--color-border); border-left: 4px solid var(--color-primary); border-radius: 8px; padding: 1em 1.25em; margin: 1em 0; page-break-inside: avoid; }
.vocabulary-card.size-small { padding: 0.5em 0.75em; }
.vocabulary-card.size-large { padding: 1.5em 2em; }
.vocabulary-target { font-family: var(--font-vietnamese); font-size: 1.5em; font-weight: 600; color: var(--color-primary); margin-bottom: 0.25em; }
.vocabulary-romanization { font-size: 0.9em; color: var(--color-text-muted); font-style: italic; margin-bottom: 0.5em; }
.vocabulary-base { font-size: 1.1em; }

.vocabulary-list { margin: 1em 0; }
.vocabulary-list-title { font-weight: 600; color: var(--color-primary); margin-bottom: 0.5em; }
.vocabulary-list-grid { display: grid; gap: 0.5em; }
.vocabulary-list-grid.columns-2 { grid-template-columns: repeat(2, 1fr); }
.vocabulary-list-grid.columns-3 { grid-template-columns: repeat(3, 1fr); }
.vocabulary-list-item { display: flex; justify-content: space-between; padding: 0.25em 0.5em; background: #f8fafc; border-radius: 4px; }

.dialogue { margin: 1.5em 0; page-break-inside: avoid; }
.dialogue-title { font-weight: 600; color: var(--color-primary); margin-bottom: 0.5em; }
.dialogue-context { font-style: italic; color: var(--color-text-muted); margin-bottom: 1em; }
.dialogue-line { display: flex; margin-bottom: 0.75em; }
.dialogue-speaker { font-weight: 600; min-width: 80px; color: var(--color-secondary); }
.dialogue-target { font-family: var(--font-vietnamese); }
.dialogue-translation { font-size: 0.9em; color: var(--color-text-muted); font-style: italic; }

.exercise { background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 1.25em; margin: 1.5em 0; page-break-inside: avoid; }
.exercise-type { font-size: ${typography.fontSize.small}; text-transform: uppercase; letter-spacing: 0.05em; color: #b45309; margin-bottom: 0.5em; }
.exercise-prompt { font-family: var(--font-vietnamese); font-size: 1.1em; margin-bottom: 0.5em; }
.exercise-answer-area { border: 1px dashed var(--color-border); border-radius: 4px; padding: 0.5em; margin-top: 0.75em; min-height: 2em; background: white; }
.exercise-hint { font-size: 0.9em; color: var(--color-text-muted); font-style: italic; margin-top: 0.5em; }

.note-card { border-radius: 8px; padding: 1em 1.25em; margin: 1em 0; page-break-inside: avoid; }
.note-card.variant-info { background: #eff6ff; border-left: 4px solid ${colors.info}; }
.note-card.variant-warning { background: #fff7ed; border-left: 4px solid ${colors.warning}; }
.note-card.variant-tip { background: #f0fdf4; border-left: 4px solid ${colors.success}; }
.note-title { font-weight: 600; margin-bottom: 0.5em; }

.callout { border-radius: 8px; padding: 1em 1.25em; margin: 1em 0; page-break-inside: avoid; }
.callout.variant-info { background: #eff6ff; border-left: 4px solid ${colors.info}; }
.callout.variant-warning { background: #fff7ed; border-left: 4px solid ${colors.warning}; }
.callout.variant-success { background: #f0fdf4; border-left: 4px solid ${colors.success}; }
.callout.variant-example { background: #faf5ff; border-left: 4px solid ${colors.example}; }
.callout-title { font-weight: 600; margin-bottom: 0.5em; }

blockquote { border-left: 3px solid var(--color-primary); padding-left: 1em; margin: 1em 0; font-style: italic; }
.quote-attribution { text-align: right; color: var(--color-text-muted); font-size: 0.9em; }

ul, ol { margin: 0.5em 0 0.5em 1.5em; }
li { margin-bottom: 0.25em; }

table { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 0.95em; }
th, td { border: 1px solid var(--color-border); padding: 0.5em 0.75em; text-align: left; }
th { background: #f8fafc; font-weight: 600; }
.table-caption { font-size: 0.9em; color: var(--color-text-muted); text-align: center; margin-top: 0.5em; }

figure { margin: 1em 0; page-break-inside: avoid; }
figure img { max-width: 100%; height: auto; }
figcaption { font-size: ${typography.fontSize.caption}; color: var(--color-text-muted); text-align: center; margin-top: 0.5em; }

.page-break { page-break-after: always; }
.section-break { margin: 2em 0; text-align: center; }
.section-break.style-line::before { content: ""; display: block; width: 30%; margin: 0 auto; border-top: 1px solid var(--color-border); }
.section-break.style-ornament::before { content: "❧"; font-size: 1.5em; color: var(--color-text-muted); }

.mark-bold { font-weight: 600; }
.mark-italic { font-style: italic; }
.mark-underline { text-decoration: underline; }
.mark-highlight { background: #fef08a; padding: 0 0.2em; }

p, li, .vocabulary-card, .dialogue-line { widows: 2; orphans: 2; }

/* Illustrated Page Blocks */
.illustrated-scene { position: relative; margin: 1.5em 0; page-break-inside: avoid; }
.illustrated-scene-image { width: 100%; height: auto; border-radius: 8px; }
.speech-bubble { position: absolute; padding: 0.5em 0.75em; border-radius: 12px; font-family: var(--font-vietnamese); font-size: 0.9em; line-height: 1.4; max-width: 35%; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.speech-bubble.color-blue { background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; }
.speech-bubble.color-orange { background: #ffedd5; color: #c2410c; border: 1px solid #fdba74; }
.speech-bubble.color-white { background: #ffffff; color: #374151; border: 1px solid #d1d5db; }
.speech-bubble.color-green { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
.speech-bubble.color-pink { background: #fce7f3; color: #9d174d; border: 1px solid #f9a8d4; }
.speech-bubble.style-label { border-radius: 4px; font-style: italic; font-size: 0.85em; }

.vocabulary-grid { margin: 1.5em 0; page-break-inside: avoid; }
.vocabulary-grid-header { display: flex; align-items: center; gap: 0.5em; margin-bottom: 1em; padding: 0.5em 1em; background: var(--color-primary); color: white; border-radius: 8px 8px 0 0; }
.vocabulary-grid-title { font-size: 1.25em; font-weight: 600; }
.vocabulary-grid-icon { font-size: 1.5em; }
.vocabulary-grid-items { display: grid; gap: 0.75em; padding: 1em; background: #f8fafc; border: 1px solid var(--color-border); border-top: none; border-radius: 0 0 8px 8px; }
.vocabulary-grid-items.columns-2 { grid-template-columns: repeat(2, 1fr); }
.vocabulary-grid-items.columns-3 { grid-template-columns: repeat(3, 1fr); }
.vocabulary-grid-items.columns-4 { grid-template-columns: repeat(4, 1fr); }
.vocabulary-grid-item { background: white; border: 1px solid var(--color-border); border-radius: 8px; padding: 0.75em; text-align: center; }
.vocabulary-grid-item-image { width: 100%; max-height: 80px; object-fit: contain; margin-bottom: 0.5em; }
.vocabulary-grid-item-target { font-family: var(--font-vietnamese); font-size: 1.1em; font-weight: 600; color: var(--color-primary); }
.vocabulary-grid-item-romanization { font-size: 0.8em; color: var(--color-text-muted); font-style: italic; }
.vocabulary-grid-item-base { font-size: 0.85em; color: var(--color-text-muted); }

.qr-code-block { display: inline-flex; flex-direction: column; align-items: center; gap: 0.25em; padding: 0.5em; background: white; border: 1px solid var(--color-border); border-radius: 4px; }
.qr-code-block.size-small { max-width: 60px; }
.qr-code-block.size-medium { max-width: 100px; }
.qr-code-block.size-large { max-width: 150px; }
.qr-code-label { font-size: 0.7em; color: var(--color-text-muted); text-align: center; }

.did-you-know { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; border-radius: 8px; padding: 1em 1.25em; margin: 1em 0; page-break-inside: avoid; }
.did-you-know-title { font-weight: 600; color: #b45309; margin-bottom: 0.5em; display: flex; align-items: center; gap: 0.5em; }
.did-you-know-content { color: #92400e; font-size: 0.95em; }

.two-column { display: grid; gap: 1.5em; margin: 1em 0; }
.two-column.ratio-1-1 { grid-template-columns: 1fr 1fr; }
.two-column.ratio-2-1 { grid-template-columns: 2fr 1fr; }
.two-column.ratio-1-2 { grid-template-columns: 1fr 2fr; }
.two-column-left, .two-column-right { min-width: 0; }

.canvas-page { position: relative; width: 100%; aspect-ratio: 8.5/11; background-size: cover; page-break-after: always; }
.canvas-element { position: absolute; }

@media print { body { background: white; } .no-print { display: none; } }

${template.customCSS || ''}
`;
}
