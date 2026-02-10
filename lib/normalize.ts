/**
 * Normalizes text for dictionary lookup by:
 * - Unicode NFC normalization
 * - Trimming whitespace
 * - Converting to lowercase
 * - Collapsing multiple spaces into one
 * - Optionally stripping leading/trailing punctuation
 * 
 * NOTE: Does NOT remove diacritics - preserves Vietnamese characters
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^[.,!?;:]+|[.,!?;:]+$/g, ''); // strip leading/trailing punctuation
}
