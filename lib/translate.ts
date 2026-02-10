import fruitsDict from '@/data/fruits.json';
import { normalizeText } from './normalize';

/**
 * Looks up Vietnamese fruit name in the dictionary
 * Returns the English translation or null if not found
 */
export function translateFruit(vietnamese: string): string | null {
    const normalized = normalizeText(vietnamese);

    // Search the dictionary with normalized keys
    for (const [key, value] of Object.entries(fruitsDict)) {
        if (normalizeText(key) === normalized) {
            return value;
        }
    }

    return null;
}
