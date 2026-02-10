/**
 * Lyrics SEO Utilities
 *
 * Extracts maximum SEO value from song lyrics:
 * - Vocabulary extraction for learning context
 * - Bilingual line pairing (Vietnamese/English)
 * - Dynamic FAQ generation
 * - Schema.org structured data helpers
 */

export interface LyricLine {
  vietnamese: string;
  english: string | null;
  lineNumber: number;
}

export interface ExtractedVocabulary {
  word: string;
  context: string; // The line where it appears
  frequency: number;
}

export interface LyricsFAQ {
  question: string;
  answer: string;
}

/**
 * Common Vietnamese words to exclude from vocabulary extraction
 * (articles, pronouns, conjunctions that don't add learning value)
 */
const STOP_WORDS = new Set([
  'và', 'của', 'là', 'có', 'được', 'cho', 'với', 'này', 'đó', 'khi',
  'để', 'như', 'từ', 'trong', 'ra', 'về', 'theo', 'qua', 'lại', 'đi',
  'đến', 'còn', 'hay', 'hoặc', 'nhưng', 'mà', 'thì', 'nếu', 'vì',
  'bởi', 'do', 'nên', 'cũng', 'rồi', 'đã', 'sẽ', 'đang', 'vẫn',
  'ơi', 'à', 'ừ', 'ạ', 'nhé', 'nha', 'hả', 'sao', 'gì', 'ai',
  'tôi', 'tao', 'mình', 'ta', 'chúng', 'họ', 'nó', 'anh', 'em',
  'ông', 'bà', 'cô', 'chú', 'bạn', 'người', 'một', 'hai', 'ba',
]);

/**
 * Detect if a line is likely Vietnamese or English
 * Uses Vietnamese diacritics and common patterns
 */
export function detectLanguage(text: string): 'vi' | 'en' | 'unknown' {
  const trimmed = text.trim();
  if (!trimmed) return 'unknown';

  // Vietnamese diacritics pattern
  const vietnamesePattern = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i;

  // Check for Vietnamese characters
  if (vietnamesePattern.test(trimmed)) {
    return 'vi';
  }

  // Common Vietnamese words without diacritics
  const commonViWords = /\b(xin|chao|cam|on|la|co|khong|voi|cho|nhu|the)\b/i;
  if (commonViWords.test(trimmed)) {
    return 'vi';
  }

  // Likely English if no Vietnamese indicators
  return 'en';
}

/**
 * Parse lyrics into bilingual pairs
 * Assumes alternating Vietnamese/English pattern or consecutive same-language lines
 */
export function parseBilingualLyrics(plainLyrics: string): LyricLine[] {
  const lines = plainLyrics.split('\n').filter((line) => line.trim());
  const result: LyricLine[] = [];

  let i = 0;
  let lineNumber = 1;

  while (i < lines.length) {
    const currentLine = lines[i].trim();
    const currentLang = detectLanguage(currentLine);
    const nextLine = lines[i + 1]?.trim();
    const nextLang = nextLine ? detectLanguage(nextLine) : 'unknown';

    if (currentLang === 'vi') {
      // Vietnamese line - check if next is English translation
      if (nextLang === 'en') {
        result.push({
          vietnamese: currentLine,
          english: nextLine,
          lineNumber,
        });
        i += 2;
      } else {
        result.push({
          vietnamese: currentLine,
          english: null,
          lineNumber,
        });
        i += 1;
      }
    } else if (currentLang === 'en') {
      // English line without Vietnamese - might be intro/outro
      // Skip or treat as context
      i += 1;
      continue;
    } else {
      i += 1;
      continue;
    }

    lineNumber++;
  }

  return result;
}

/**
 * Extract vocabulary words from Vietnamese lyrics
 * Returns unique words with their context and frequency
 */
export function extractVocabulary(
  plainLyrics: string,
  minWordLength = 2
): ExtractedVocabulary[] {
  const lines = plainLyrics.split('\n');
  const wordMap = new Map<string, { contexts: Set<string>; count: number }>();

  for (const line of lines) {
    if (detectLanguage(line) !== 'vi') continue;

    // Extract Vietnamese words (including diacritics)
    const words = line.match(/[\wàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]+/gi) || [];

    for (const word of words) {
      const normalized = word.toLowerCase();

      // Skip stop words and short words
      if (STOP_WORDS.has(normalized) || normalized.length < minWordLength) {
        continue;
      }

      const existing = wordMap.get(normalized);
      if (existing) {
        existing.contexts.add(line.trim());
        existing.count++;
      } else {
        wordMap.set(normalized, {
          contexts: new Set([line.trim()]),
          count: 1,
        });
      }
    }
  }

  // Convert to array and sort by frequency
  return Array.from(wordMap.entries())
    .map(([word, data]) => ({
      word,
      context: Array.from(data.contexts)[0], // Use first context
      frequency: data.count,
    }))
    .sort((a, b) => b.frequency - a.frequency);
}

/**
 * Generate FAQ schema entries from lyrics content
 */
export function generateLyricsFAQs(
  songTitle: string,
  artist: string,
  englishWord: string,
  vietnameseWord: string,
  vocabulary: ExtractedVocabulary[],
  bilingualLines: LyricLine[]
): LyricsFAQ[] {
  const faqs: LyricsFAQ[] = [];

  // Core learning FAQ
  faqs.push({
    question: `What Vietnamese words can I learn from "${songTitle}"?`,
    answer: vocabulary.length > 0
      ? `"${songTitle}" teaches ${vocabulary.length} Vietnamese vocabulary words including: ${vocabulary.slice(0, 5).map((v) => v.word).join(', ')}. The song focuses on "${vietnameseWord}" (${englishWord}) in musical context.`
      : `"${songTitle}" teaches the Vietnamese word "${vietnameseWord}" meaning "${englishWord}" through memorable musical context.`,
  });

  // Lyrics meaning FAQ
  if (bilingualLines.length > 0) {
    const sampleLine = bilingualLines.find((l) => l.english) || bilingualLines[0];
    faqs.push({
      question: `What do the lyrics of "${songTitle}" mean in English?`,
      answer: sampleLine.english
        ? `The song "${songTitle}" includes Vietnamese lyrics with English translations. For example: "${sampleLine.vietnamese}" means "${sampleLine.english}". The full lyrics are available with translations on EZViet.`
        : `"${songTitle}" features Vietnamese lyrics that teach vocabulary for "${englishWord}". Learn the meaning of each line with EZViet's bilingual lyrics display.`,
    });
  }

  // Artist FAQ
  faqs.push({
    question: `Who sings "${songTitle}" for learning Vietnamese?`,
    answer: `"${songTitle}" is performed by ${artist} and is part of EZViet's Vietnamese language learning collection. It's designed to help learners memorize "${vietnameseWord}" (${englishWord}) through music.`,
  });

  // Pronunciation FAQ
  if (vietnameseWord) {
    faqs.push({
      question: `How do you pronounce "${vietnameseWord}" in Vietnamese?`,
      answer: `"${vietnameseWord}" means "${englishWord}" in Vietnamese. You can learn the correct pronunciation by listening to "${songTitle}" on EZViet, where the word is used in musical context with natural Vietnamese rhythm.`,
    });
  }

  // Top vocabulary FAQs (if we have enough words)
  vocabulary.slice(0, 3).forEach((vocab) => {
    faqs.push({
      question: `What does "${vocab.word}" mean in the song "${songTitle}"?`,
      answer: `In "${songTitle}", "${vocab.word}" appears in the line: "${vocab.context}". This Vietnamese vocabulary word is used ${vocab.frequency} time${vocab.frequency > 1 ? 's' : ''} in the song.`,
    });
  });

  return faqs;
}

/**
 * Generate schema.org Lyrics CreativeWork
 */
export function generateLyricsSchema(
  songTitle: string,
  plainLyrics: string,
  songUrl: string
) {
  return {
    '@type': 'CreativeWork',
    '@id': `${songUrl}#lyrics`,
    name: `Lyrics for "${songTitle}"`,
    text: plainLyrics,
    inLanguage: 'vi',
    encodingFormat: 'text/plain',
  };
}

/**
 * Generate HowTo schema for pronunciation learning
 */
export function generatePronunciationHowTo(
  vietnameseWord: string,
  englishWord: string,
  songTitle: string,
  songUrl: string
) {
  return {
    '@type': 'HowTo',
    '@id': `${songUrl}#pronunciation`,
    name: `How to pronounce "${vietnameseWord}" in Vietnamese`,
    description: `Learn to correctly pronounce the Vietnamese word "${vietnameseWord}" (meaning "${englishWord}") through the song "${songTitle}"`,
    step: [
      {
        '@type': 'HowToStep',
        name: 'Listen to the song',
        text: `Play "${songTitle}" and listen for the word "${vietnameseWord}" in context`,
      },
      {
        '@type': 'HowToStep',
        name: 'Follow the lyrics',
        text: `Read along with the bilingual lyrics to understand when "${vietnameseWord}" appears`,
      },
      {
        '@type': 'HowToStep',
        name: 'Practice repetition',
        text: `Repeat "${vietnameseWord}" along with the song to build muscle memory for Vietnamese tones`,
      },
    ],
    totalTime: 'PT5M',
    tool: {
      '@type': 'HowToTool',
      name: 'EZViet Song Player',
    },
  };
}

/**
 * Generate ItemList schema for vocabulary words
 */
export function generateVocabularyListSchema(
  vocabulary: ExtractedVocabulary[],
  songTitle: string,
  songUrl: string
) {
  return {
    '@type': 'ItemList',
    '@id': `${songUrl}#vocabulary`,
    name: `Vietnamese Vocabulary in "${songTitle}"`,
    description: `Key Vietnamese words featured in the song "${songTitle}"`,
    numberOfItems: vocabulary.length,
    itemListElement: vocabulary.slice(0, 10).map((vocab, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'DefinedTerm',
        name: vocab.word,
        description: `Vietnamese word appearing in: "${vocab.context}"`,
        inDefinedTermSet: {
          '@type': 'DefinedTermSet',
          name: 'Vietnamese Vocabulary',
        },
      },
    })),
  };
}
