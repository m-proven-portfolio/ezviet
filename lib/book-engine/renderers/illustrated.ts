/**
 * Illustrated Block Renderers - Visual-heavy pages with positioned elements
 */

import type {
  IllustratedSceneBlock,
  VocabularyGridBlock,
  QRCodeBlock,
  DidYouKnowBlock,
  TwoColumnBlock,
  CanvasPageBlock,
  SpeechBubble,
  Block,
} from '../types';
import { escapeHtml, RenderContext } from './utils';

function renderSpeechBubble(bubble: SpeechBubble): string {
  const style = `left: ${bubble.position.x}%; top: ${bubble.position.y}%; width: ${bubble.width || 20}%;`;
  return `<div class="speech-bubble color-${bubble.color} style-${bubble.style}" style="${style}">${escapeHtml(bubble.text)}</div>`;
}

export function renderIllustratedScene(block: IllustratedSceneBlock): string {
  const bubbles = block.bubbles.map(b => renderSpeechBubble(b)).join('\n');
  return `
    <div class="illustrated-scene">
      <img src="${escapeHtml(block.imagePath)}" alt="${escapeHtml(block.imageAlt)}" class="illustrated-scene-image" />
      ${bubbles}
      ${block.caption ? `<p class="illustrated-scene-caption">${escapeHtml(block.caption)}</p>` : ''}
    </div>
  `;
}

export function renderVocabularyGrid(block: VocabularyGridBlock): string {
  const items = block.items.map(item => `
    <div class="vocabulary-grid-item">
      <img src="${escapeHtml(item.imagePath)}" alt="${escapeHtml(item.targetText)}" class="vocabulary-grid-item-image" />
      <div class="vocabulary-grid-item-target vietnamese-text">${escapeHtml(item.targetText)}</div>
      ${block.showRomanization !== false && item.romanization ? `<div class="vocabulary-grid-item-romanization">${escapeHtml(item.romanization)}</div>` : ''}
      <div class="vocabulary-grid-item-base">${escapeHtml(item.baseText)}</div>
    </div>
  `).join('');
  return `
    <div class="vocabulary-grid">
      ${block.title ? `<div class="vocabulary-grid-header">${block.titleIcon ? `<span class="vocabulary-grid-icon">${block.titleIcon}</span>` : ''}<span class="vocabulary-grid-title">${escapeHtml(block.title)}</span></div>` : ''}
      <div class="vocabulary-grid-items columns-${block.columns}">${items}</div>
    </div>
  `;
}

export function renderQRCode(block: QRCodeBlock): string {
  return `
    <div class="qr-code-block size-${block.size || 'medium'}" data-qr-url="${escapeHtml(block.url)}">
      <div class="qr-code-placeholder" style="width: 80px; height: 80px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #9ca3af;">QR</div>
      ${block.label ? `<div class="qr-code-label">${escapeHtml(block.label)}</div>` : ''}
    </div>
  `;
}

export function renderDidYouKnow(block: DidYouKnowBlock): string {
  const regionFlag = block.region === 'north' ? '🏔️' : block.region === 'south' ? '🌴' : '🇻🇳';
  return `<div class="did-you-know"><div class="did-you-know-title">${regionFlag} Did you know?</div><div class="did-you-know-content">${escapeHtml(block.content)}</div></div>`;
}

export function renderTwoColumn(
  block: TwoColumnBlock,
  ctx: RenderContext,
  renderBlock: (b: Block, c: RenderContext) => string
): string {
  const ratio = block.ratio?.replace(':', '-') || '1-1';
  const leftContent = block.leftColumn.map(b => renderBlock(b, ctx)).join('\n');
  const rightContent = block.rightColumn.map(b => renderBlock(b, ctx)).join('\n');
  return `<div class="two-column ratio-${ratio}"><div class="two-column-left">${leftContent}</div><div class="two-column-right">${rightContent}</div></div>`;
}

export function renderCanvasPage(block: CanvasPageBlock): string {
  const bgStyle = block.backgroundImage
    ? `background-image: url('${escapeHtml(block.backgroundImage)}');`
    : block.backgroundColor ? `background-color: ${escapeHtml(block.backgroundColor)};` : '';
  const elements = block.elements.map(el => {
    const posStyle = `left: ${el.position.x}%; top: ${el.position.y}%; width: ${el.width}%;${el.height ? ` height: ${el.height}%;` : ''}${el.rotation ? ` transform: rotate(${el.rotation}deg);` : ''}`;
    switch (el.type) {
      case 'text': return `<div class="canvas-element canvas-text" style="${posStyle}">${escapeHtml(String(el.data.text || ''))}</div>`;
      case 'image': return `<img class="canvas-element canvas-image" style="${posStyle}" src="${escapeHtml(String(el.data.src || ''))}" alt="" />`;
      case 'bubble': return `<div class="canvas-element speech-bubble color-${el.data.color || 'white'}" style="${posStyle}">${escapeHtml(String(el.data.text || ''))}</div>`;
      default: return '';
    }
  }).join('\n');
  return `<div class="canvas-page" style="${bgStyle}">${elements}</div>`;
}
