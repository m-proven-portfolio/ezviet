/**
 * Learning Block Renderers - Vocabulary, Dialogue, Exercise, Grammar, Cultural
 */

import type {
  VocabularyBlock,
  VocabularyListBlock,
  DialogueBlock,
  ToneChartBlock,
  ExerciseBlock,
  GrammarNoteBlock,
  CulturalNoteBlock,
} from '../types';
import { escapeHtml, renderRichText } from './utils';

export function renderVocabulary(block: VocabularyBlock): string {
  const sizeClass = block.size ? `size-${block.size}` : '';
  return `
    <div class="vocabulary-card ${sizeClass}">
      <div class="vocabulary-target vietnamese-text">${escapeHtml(block.targetText)}</div>
      ${block.romanization ? `<div class="vocabulary-romanization">/${escapeHtml(block.romanization)}/</div>` : ''}
      <div class="vocabulary-base">${escapeHtml(block.baseText)}</div>
      ${block.ipa ? `<div class="vocabulary-ipa">${escapeHtml(block.ipa)}</div>` : ''}
    </div>
  `;
}

export function renderVocabularyList(block: VocabularyListBlock): string {
  const columnsClass = block.columns ? `columns-${block.columns}` : '';
  const items = block.items.map(item => `
    <div class="vocabulary-list-item">
      <span class="vietnamese-text">${escapeHtml(item.targetText)}</span>
      <span>${escapeHtml(item.baseText)}</span>
    </div>
  `).join('');
  return `
    <div class="vocabulary-list">
      ${block.title ? `<div class="vocabulary-list-title">${escapeHtml(block.title)}</div>` : ''}
      <div class="vocabulary-list-grid ${columnsClass}">${items}</div>
    </div>
  `;
}

export function renderDialogue(block: DialogueBlock): string {
  const lines = block.lines.map(line => `
    <div class="dialogue-line">
      <span class="dialogue-speaker">${escapeHtml(line.speaker)}:</span>
      <div class="dialogue-content">
        <div class="dialogue-target vietnamese-text">${escapeHtml(line.targetText)}</div>
        ${block.showTranslations !== false && line.baseText
          ? `<div class="dialogue-translation">${escapeHtml(line.baseText)}</div>`
          : ''}
      </div>
    </div>
  `).join('');
  return `
    <div class="dialogue">
      ${block.title ? `<div class="dialogue-title">${escapeHtml(block.title)}</div>` : ''}
      ${block.context ? `<div class="dialogue-context">${escapeHtml(block.context)}</div>` : ''}
      ${lines}
    </div>
  `;
}

export function renderToneChart(_block: ToneChartBlock): string {
  const tones = [
    { name: 'Ngang (level)', example: 'ma' },
    { name: 'Huyền (falling)', example: 'mà' },
    { name: 'Sắc (rising)', example: 'má' },
    { name: 'Hỏi (dipping)', example: 'mả' },
    { name: 'Ngã (broken)', example: 'mã' },
    { name: 'Nặng (heavy)', example: 'mạ' },
  ];
  const rows = tones.map(t => `<tr><td>${t.name}</td><td class="vietnamese-text" style="font-size: 1.2em; font-weight: 600;">${t.example}</td></tr>`).join('');
  return `<div class="tone-chart" style="margin: 1em 0;"><table><thead><tr><th>Tone</th><th>Example</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

export function renderExercise(block: ExerciseBlock): string {
  const typeLabels: Record<string, string> = {
    'fill-blank': 'Fill in the Blank', 'translate': 'Translation', 'match': 'Matching',
    'multiple-choice': 'Multiple Choice', 'listen-write': 'Listening', 'order-words': 'Word Order',
  };
  let content = '';
  if (block.prompt) content += `<div class="exercise-prompt vietnamese-text">${escapeHtml(block.prompt)}</div>`;
  if (block.exerciseType === 'match' && block.pairs) {
    content += '<div class="exercise-match">' + block.pairs.map((pair, i) => `<div>${i + 1}. ${escapeHtml(pair.left)} _______ ${escapeHtml(pair.right)}</div>`).join('') + '</div>';
  }
  if (block.exerciseType === 'multiple-choice' && block.choices) {
    content += '<div class="exercise-choices">' + block.choices.map((choice, i) => `<div>${String.fromCharCode(65 + i)}. ${escapeHtml(choice)}</div>`).join('') + '</div>';
  }
  if (block.showAnswerArea !== false) {
    const lines = block.linesForAnswer || 2;
    content += `<div class="exercise-answer-area" style="min-height: ${lines * 1.5}em;"></div>`;
  }
  if (block.hint) content += `<div class="exercise-hint">Hint: ${escapeHtml(block.hint)}</div>`;
  return `<div class="exercise"><div class="exercise-type">${typeLabels[block.exerciseType] || block.exerciseType}</div>${block.instructions ? `<div class="exercise-instructions">${escapeHtml(block.instructions)}</div>` : ''}${content}</div>`;
}

export function renderGrammarNote(block: GrammarNoteBlock): string {
  let examples = '';
  if (block.examples?.length) {
    examples = '<div class="note-examples">' + block.examples.map(ex => `<div><span class="vietnamese-text">${escapeHtml(ex.targetText)}</span> — ${escapeHtml(ex.baseText)}</div>`).join('') + '</div>';
  }
  return `<div class="note-card variant-${block.variant || 'info'}"><div class="note-title">${escapeHtml(block.title)}</div><div class="note-content">${renderRichText(block.content)}</div>${examples}</div>`;
}

export function renderCulturalNote(block: CulturalNoteBlock): string {
  return `<div class="note-card variant-tip"><div class="note-title">🇻🇳 ${escapeHtml(block.title)}</div><div class="note-content">${renderRichText(block.content)}</div></div>`;
}
