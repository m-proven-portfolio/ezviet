import type { EmojiData } from '../types';
import { PEOPLE_EMOJI_DATA } from './people';
import { ANIMALS_NATURE_EMOJI_DATA } from './animals-nature';
import { FOOD_EMOJI_DATA } from './food';
import { ACTIVITIES_EMOJI_DATA } from './activities';
import { OBJECTS_EMOJI_DATA } from './objects';
import { SYMBOLS_EMOJI_DATA } from './symbols';

// Combine all emoji data into a single object
export const EMOJI_DATA: EmojiData = {
  ...PEOPLE_EMOJI_DATA,
  ...ANIMALS_NATURE_EMOJI_DATA,
  ...FOOD_EMOJI_DATA,
  ...ACTIVITIES_EMOJI_DATA,
  ...OBJECTS_EMOJI_DATA,
  ...SYMBOLS_EMOJI_DATA,
};

// Flatten all emojis for easy iteration
export const ALL_EMOJIS = Object.entries(EMOJI_DATA).flatMap(([category, data]) =>
  data.emojis.map((item) => ({ ...item, category }))
);

export const EMOJI_CATEGORIES = Object.keys(EMOJI_DATA);
