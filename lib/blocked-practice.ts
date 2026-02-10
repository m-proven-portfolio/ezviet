/**
 * Configuration for blocked practice learning mode
 *
 * "Blocked practice" shows cards grouped by category (e.g., 6 Fruits -> 6 Numbers)
 * to reduce cognitive load and build stronger neural pathways for language learning.
 */

export const BLOCKED_PRACTICE_CONFIG = {
  /** Default total card limit (matches guest tier) */
  DEFAULT_TOTAL_LIMIT: 6,

  /** Max cards per category when distributing across categories */
  MAX_CARDS_PER_CATEGORY: 3,

  /** Category slugs to show first for new/guest users (high-engagement, simple topics) */
  STARTER_CATEGORIES: ['fruits', 'food', 'numbers', 'greetings'],

  /** Number of cards viewed before showing "Choose a topic?" prompt */
  SHOW_CATEGORY_PICKER_AFTER: 12,

  /** localStorage key for user's selected categories */
  STORAGE_KEY_SELECTED_CATEGORIES: 'ezviet_selected_categories',
};
