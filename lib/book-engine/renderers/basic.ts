/**
 * Basic Block Renderers - Paragraph, Heading, List, Quote, Image, Table
 */

import type {
  ParagraphBlock,
  HeadingBlock,
  ListBlock,
  QuoteBlock,
  ImageBlock,
  TableBlock,
  CalloutBlock,
} from '../types';
import { escapeHtml, renderRichText, RenderContext } from './utils';

export function renderParagraph(block: ParagraphBlock): string {
  const align = block.align ? `style="text-align: ${block.align}"` : '';
  return `<p ${align}>${renderRichText(block.content)}</p>`;
}

export function renderHeading(block: HeadingBlock, ctx: RenderContext): string {
  const tag = `h${block.level}`;
  if (ctx.generateTOC && block.level <= 2) {
    ctx.tocEntries.push({
      level: block.level,
      title: block.tocTitle || block.content,
      page: ctx.pageNumber,
    });
  }
  return `<${tag}>${escapeHtml(block.content)}</${tag}>`;
}

export function renderList(block: ListBlock): string {
  const tag = block.style === 'numbered' ? 'ol' : 'ul';
  const items = block.items.map(item => `<li>${renderRichText(item)}</li>`).join('\n');
  return `<${tag}>${items}</${tag}>`;
}

export function renderQuote(block: QuoteBlock): string {
  let html = `<blockquote>${renderRichText(block.content)}</blockquote>`;
  if (block.attribution) {
    html += `<p class="quote-attribution">— ${escapeHtml(block.attribution)}</p>`;
  }
  return html;
}

export function renderImage(block: ImageBlock): string {
  const widthClass = block.width ? `image-${block.width}` : '';
  const alignClass = block.align ? `image-${block.align}` : 'image-center';
  return `
    <figure class="${widthClass} ${alignClass}">
      <img src="${escapeHtml(block.path)}" alt="${escapeHtml(block.alt)}" />
      ${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ''}
    </figure>
  `;
}

export function renderTable(block: TableBlock): string {
  const headerHtml = block.headers
    ? '<thead><tr>' + block.headers.map(h => `<th>${escapeHtml(h)}</th>`).join('') + '</tr></thead>'
    : '';
  const bodyHtml = '<tbody>' +
    block.rows.map(row => '<tr>' + row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('') + '</tr>').join('') +
    '</tbody>';
  return `
    <table>${headerHtml}${bodyHtml}</table>
    ${block.caption ? `<p class="table-caption">${escapeHtml(block.caption)}</p>` : ''}
  `;
}

export function renderCallout(block: CalloutBlock): string {
  return `
    <div class="callout variant-${block.variant}">
      ${block.title ? `<div class="callout-title">${block.icon || ''} ${escapeHtml(block.title)}</div>` : ''}
      <div class="callout-content">${renderRichText(block.content)}</div>
    </div>
  `;
}
