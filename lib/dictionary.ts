import concepts from '@/data/concepts.json';
import { normalizeText } from './normalize';

export type Concept = {
    id: string;
    category: string;
    en: string;
    vi: string[];
};

type LookupMap = Map<string, string>;

let enToViMap: LookupMap | null = null;
let viToEnMap: LookupMap | null = null;

/**
 * Build lookup maps from concepts.json
 */
function buildMaps() {
    if (enToViMap && viToEnMap) return;

    enToViMap = new Map();
    viToEnMap = new Map();

    for (const concept of concepts as Concept[]) {
        // English -> Vietnamese (canonical first variant)
        const normalizedEn = normalizeText(concept.en);
        if (enToViMap.has(normalizedEn)) {
            console.warn(`Duplicate English key: ${concept.en}`);
        }
        enToViMap.set(normalizedEn, concept.vi[0]);

        // Vietnamese variants -> English
        for (const viVariant of concept.vi) {
            const normalizedVi = normalizeText(viVariant);
            if (viToEnMap.has(normalizedVi)) {
                console.warn(`Duplicate Vietnamese key: ${viVariant}`);
            }
            viToEnMap.set(normalizedVi, concept.en);
        }
    }
}

/**
 * Translate English to Vietnamese (canonical)
 */
export function translateEnToVi(english: string): string | null {
    buildMaps();
    const normalized = normalizeText(english);
    return enToViMap!.get(normalized) || null;
}

/**
 * Translate Vietnamese to English
 */
export function translateViToEn(vietnamese: string): string | null {
    buildMaps();
    const normalized = normalizeText(vietnamese);
    return viToEnMap!.get(normalized) || null;
}
