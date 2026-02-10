/**
 * Conversation Card Types
 *
 * These types define the structure for interactive conversation flashcards.
 * Once the database migration is run and types.ts is regenerated,
 * these will be replaced by the auto-generated types.
 */

import type { Category } from '@/lib/supabase/types';

// Base conversation card (matches database schema)
export interface ConversationCard {
  id: string;
  slug: string;
  title: string;
  title_vi: string | null;
  scene_image_path: string;
  category_id: string | null;
  difficulty: number;
  generated_by_ai: boolean;
  prompt_used: string | null;
  prompt_version: string | null;
  meta_description: string | null;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

// Individual dialogue line within a conversation
export interface ConversationLine {
  id: string;
  conversation_card_id: string;
  speaker: string;
  speaker_vi: string | null;
  vietnamese: string;
  english: string;
  romanization: string | null;
  audio_path: string | null;
  audio_source: 'auto' | 'admin' | 'community' | null;
  sort_order: number;
  created_at: string;
}

// Complete conversation with lines and category (for rendering)
export interface ConversationCardWithLines extends ConversationCard {
  lines: ConversationLine[];
  category: Category | null;
}

// Form data for creating a new conversation
export interface ConversationFormData {
  prompt: string; // The scene/situation description
  scene_image_path: string;
  scene_image_preview_url: string;
  category_id: string;
  difficulty: number;
  // Generated content (filled by AI)
  title: string;
  title_vi: string;
  lines: Array<{
    speaker: string;
    speaker_vi: string;
    vietnamese: string;
    english: string;
    romanization: string;
  }>;
  meta_description: string;
}

// AI generation response
export interface ConversationAIResponse {
  title: string;
  title_vi: string;
  lines: Array<{
    speaker: string;
    speaker_vi: string;
    vietnamese: string;
    english: string;
    romanization: string;
  }>;
  meta_description: string;
  prompt_version: string;
}

// Union type for deck items (can be a regular card OR conversation card)
export type DeckItem =
  | { type: 'card'; data: import('@/lib/supabase/types').CardWithTerms }
  | { type: 'conversation'; data: ConversationCardWithLines };
