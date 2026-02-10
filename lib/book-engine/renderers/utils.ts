/**
 * Renderer Utilities - Shared helpers
 */

import type { RichText } from '../types';

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderRichText(content: RichText[]): string {
  return content.map(segment => {
    let html = escapeHtml(segment.text);
    if (segment.marks) {
      segment.marks.forEach(mark => {
        html = `<span class="mark-${mark}">${html}</span>`;
      });
    }
    return html;
  }).join('');
}

export interface RenderContext {
  baseLang: string;
  targetLang: string;
  pageNumber: number;
  chapterNumber: number;
  generateTOC: boolean;
  tocEntries: { level: number; title: string; page: number }[];
}
