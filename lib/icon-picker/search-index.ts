import { ALL_EMOJIS } from './emoji-data';
import { LUCIDE_ICON_DATA, toPascalCase } from './lucide-data';
import type { SearchResult } from './types';

// Pre-built search index for faster lookups
// Key: keyword -> Value: array of matching items
type SearchIndex = Map<string, SearchResult[]>;

let emojiIndex: SearchIndex | null = null;
let lucideIndex: SearchIndex | null = null;

function buildEmojiIndex(): SearchIndex {
  const index = new Map<string, SearchResult[]>();

  for (const item of ALL_EMOJIS) {
    const result: SearchResult = {
      type: 'emoji',
      value: item.emoji,
      keywords: item.keywords,
      category: item.category,
    };

    for (const keyword of item.keywords) {
      const existing = index.get(keyword) || [];
      existing.push(result);
      index.set(keyword, existing);
    }
  }

  return index;
}

function buildLucideIndex(): SearchIndex {
  const index = new Map<string, SearchResult[]>();

  for (const item of LUCIDE_ICON_DATA) {
    const result: SearchResult = {
      type: 'lucide',
      value: item.name,
      keywords: item.keywords,
    };

    // Index by name parts
    for (const part of item.name.split('-')) {
      const existing = index.get(part) || [];
      existing.push(result);
      index.set(part, existing);
    }

    // Index by keywords
    for (const keyword of item.keywords) {
      const existing = index.get(keyword) || [];
      existing.push(result);
      index.set(keyword, existing);
    }
  }

  return index;
}

export function getEmojiIndex(): SearchIndex {
  if (!emojiIndex) {
    emojiIndex = buildEmojiIndex();
  }
  return emojiIndex;
}

export function getLucideIndex(): SearchIndex {
  if (!lucideIndex) {
    lucideIndex = buildLucideIndex();
  }
  return lucideIndex;
}

// Search function that uses the index for partial matching
export function searchEmojis(query: string): SearchResult[] {
  if (!query.trim()) return [];

  const normalizedQuery = query.toLowerCase().trim();
  const index = getEmojiIndex();
  const results = new Map<string, SearchResult>();

  // Find all keywords that contain the query
  for (const [keyword, items] of index) {
    if (keyword.includes(normalizedQuery)) {
      for (const item of items) {
        results.set(item.value, item);
      }
    }
  }

  return Array.from(results.values());
}

export function searchLucideIcons(query: string): SearchResult[] {
  if (!query.trim()) return [];

  const normalizedQuery = query.toLowerCase().trim();
  const index = getLucideIndex();
  const results = new Map<string, SearchResult>();

  // Find all keywords that contain the query
  for (const [keyword, items] of index) {
    if (keyword.includes(normalizedQuery)) {
      for (const item of items) {
        results.set(item.value, item);
      }
    }
  }

  return Array.from(results.values());
}

// Utility to check if a Lucide icon exists
export function lucideIconExists(name: string): boolean {
  const pascalName = toPascalCase(name);
  // We'll validate this at render time, but this gives a quick check
  return LUCIDE_ICON_DATA.some(icon => icon.name === name);
}
