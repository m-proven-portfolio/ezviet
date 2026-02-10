/**
 * EZVIET Book Engine - Main Renderer
 *
 * Orchestrates rendering of book documents to HTML.
 * One source of truth: preview and export use the same pipeline.
 */

import type { BookDocument, Block, Chapter, Section, BookTemplate } from './types';
import { getTemplate } from './templates';
import { generateCSS } from './css';
import {
  escapeHtml,
  RenderContext,
  renderParagraph,
  renderHeading,
  renderList,
  renderQuote,
  renderImage,
  renderTable,
  renderCallout,
  renderVocabulary,
  renderVocabularyList,
  renderDialogue,
  renderToneChart,
  renderExercise,
  renderGrammarNote,
  renderCulturalNote,
  renderIllustratedScene,
  renderVocabularyGrid,
  renderQRCode,
  renderDidYouKnow,
  renderTwoColumn,
  renderCanvasPage,
} from './renderers';

function renderBlock(block: Block, ctx: RenderContext): string {
  switch (block.type) {
    case 'paragraph': return renderParagraph(block);
    case 'heading': return renderHeading(block, ctx);
    case 'list': return renderList(block);
    case 'quote': return renderQuote(block);
    case 'vocabulary': return renderVocabulary(block);
    case 'vocabulary-list': return renderVocabularyList(block);
    case 'dialogue': return renderDialogue(block);
    case 'tone-chart': return renderToneChart(block);
    case 'exercise': return renderExercise(block);
    case 'grammar-note': return renderGrammarNote(block);
    case 'cultural-note': return renderCulturalNote(block);
    case 'image': return renderImage(block);
    case 'table': return renderTable(block);
    case 'page-break': return '<div class="page-break"></div>';
    case 'section-break': return `<div class="section-break style-${block.style || 'line'}"></div>`;
    case 'callout': return renderCallout(block);
    case 'illustrated-scene': return renderIllustratedScene(block);
    case 'vocabulary-grid': return renderVocabularyGrid(block);
    case 'qr-code': return renderQRCode(block);
    case 'did-you-know': return renderDidYouKnow(block);
    case 'two-column': return renderTwoColumn(block, ctx, renderBlock);
    case 'canvas-page': return renderCanvasPage(block);
    default:
      console.warn(`Unknown block type: ${(block as Block).type}`);
      return '';
  }
}

function renderSection(section: Section, ctx: RenderContext): string {
  const blocks = section.blocks.map(b => renderBlock(b, ctx)).join('\n');
  return section.title
    ? `<section class="section"><h3>${escapeHtml(section.title)}</h3>${blocks}</section>`
    : `<section class="section">${blocks}</section>`;
}

function renderChapter(chapter: Chapter, ctx: RenderContext): string {
  ctx.chapterNumber = chapter.number;
  const sections = chapter.sections.map(s => renderSection(s, ctx)).join('\n');
  const objectives = chapter.objectives?.length
    ? `<div class="chapter-objectives callout variant-info"><div class="callout-title">📚 Learning Objectives</div><ul>${chapter.objectives.map(o => `<li>${escapeHtml(o)}</li>`).join('')}</ul></div>`
    : '';
  return `
    <article class="chapter" data-title="${escapeHtml(chapter.title)}">
      <header class="chapter-header">
        <div class="chapter-number">Chapter ${chapter.number}</div>
        <h1 class="chapter-title">${escapeHtml(chapter.title)}</h1>
        ${chapter.subtitle ? `<p class="chapter-subtitle">${escapeHtml(chapter.subtitle)}</p>` : ''}
      </header>
      ${objectives}${sections}
    </article>
  `;
}

/** Render a complete book document to HTML */
export function renderBook(doc: BookDocument): string {
  const template = getTemplate(doc.meta.templateId);
  const ctx: RenderContext = {
    baseLang: doc.meta.languages.baseLang,
    targetLang: doc.meta.languages.targetLang,
    pageNumber: 1,
    chapterNumber: 0,
    generateTOC: doc.frontMatter.tableOfContents,
    tocEntries: [],
  };
  const css = generateCSS(template);
  const chapters = doc.chapters.map(ch => renderChapter(ch, ctx)).join('\n');
  const titlePage = doc.frontMatter.titlePage
    ? `<div class="title-page" style="text-align: center; padding-top: 30%;"><h1 style="font-size: 36pt; margin-bottom: 0.5em;">${escapeHtml(doc.meta.title)}</h1>${doc.meta.subtitle ? `<p style="font-size: 18pt; color: var(--color-text-muted);">${escapeHtml(doc.meta.subtitle)}</p>` : ''}<p style="font-size: 16pt; margin-top: 2em;">${escapeHtml(doc.meta.author)}</p></div><div class="page-break"></div>`
    : '';
  return `<!DOCTYPE html><html lang="${doc.meta.languages.targetLang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(doc.meta.title)}</title><style>${css}</style></head><body>${titlePage}${chapters}</body></html>`;
}

/** Render a single chapter for preview */
export function renderChapterPreview(chapter: Chapter, template: BookTemplate): string {
  const ctx: RenderContext = {
    baseLang: 'en', targetLang: 'vi', pageNumber: 1, chapterNumber: chapter.number, generateTOC: false, tocEntries: [],
  };
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><style>${generateCSS(template)}</style></head><body>${renderChapter(chapter, ctx)}</body></html>`;
}

export { generateCSS } from './css';
