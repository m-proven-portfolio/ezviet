export interface EmojiItem {
  emoji: string;
  keywords: string[];
}

export interface EmojiCategory {
  emojis: EmojiItem[];
}

export type EmojiData = Record<string, EmojiCategory>;

export interface LucideIconItem {
  name: string;
  keywords: string[];
}

export interface SearchResult {
  type: 'emoji' | 'lucide';
  value: string; // emoji character or icon name
  keywords: string[];
  category?: string; // only for emojis
}
