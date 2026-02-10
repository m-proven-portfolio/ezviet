/**
 * LRC Parser for Karaoke Lyrics
 *
 * Parses LRC format lyrics with timestamps like:
 * [00:12.34]Xin chào bạn
 * [00:15.00]Tôi là sinh viên
 */

export interface LrcLine {
  time: number; // timestamp in seconds (e.g., 12.34)
  text: string; // lyric text
}

/**
 * Parse LRC format string into array of timed lyrics
 *
 * Handles formats:
 * - [mm:ss.xx] - minutes:seconds.centiseconds
 * - [mm:ss:xx] - alternate format with colon
 * - [mm:ss] - seconds only
 */
export function parseLrc(lrcContent: string): LrcLine[] {
  const lines: LrcLine[] = [];
  const lrcLines = lrcContent.split('\n');

  // Regex matches [mm:ss.xx] or [mm:ss:xx] or [mm:ss]
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

  for (const line of lrcLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip metadata lines like [ar:Artist] [ti:Title]
    if (/^\[[a-z]{2}:/.test(trimmed)) continue;

    // Extract all timestamps and text
    const matches = [...trimmed.matchAll(timeRegex)];
    if (matches.length === 0) continue;

    // Get the text after the last timestamp
    const lastMatch = matches[matches.length - 1];
    const textStart = lastMatch.index! + lastMatch[0].length;
    const text = trimmed.slice(textStart).trim();

    // Skip empty text lines
    if (!text) continue;

    // Skip section markers (Intro, Verse, Chorus, Pre-Chorus, Bridge, Outro, etc.)
    // Matches: "Intro", "Verse 1", "[Chorus]", "(Pre-Chorus)", etc.
    const sectionPattern = /^[\[(]?(intro|verse|chorus|pre-chorus|bridge|outro|hook|interlude|instrumental|break|ad[- ]?lib)(\s*\d*)?[\])]?$/i;
    if (sectionPattern.test(text)) continue;

    // Skip separator lines (just dashes, dots, asterisks, or other non-lyric markers)
    if (/^[-–—_.·•*=~]+$/.test(text)) continue;

    // Skip bracketed annotations like "(pause)", "[instrumental]", "{ad-lib}", etc.
    if (/^[(\[{][^)\]}]*[)\]}]$/.test(text)) continue;

    // Each timestamp gets its own entry (for lines with multiple timestamps)
    for (const match of matches) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const centiseconds = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;

      const time = minutes * 60 + seconds + centiseconds / 1000;

      lines.push({ time, text });
    }
  }

  // Sort by timestamp
  return lines.sort((a, b) => a.time - b.time);
}

/**
 * Default timing offset in seconds to compensate for audio latency.
 * Positive = lyrics appear earlier, Negative = lyrics appear later.
 */
export const DEFAULT_LYRICS_OFFSET = 0.8;

/**
 * Find the index of the current lyric line based on playback time
 *
 * @param lines - Parsed LRC lines with timestamps
 * @param currentTime - Current playback time in seconds
 * @param offset - Timing offset in seconds (positive = lyrics appear earlier)
 * @returns Index of current line, or -1 if before first lyric
 */
export function getCurrentLineIndex(
  lines: LrcLine[],
  currentTime: number,
  offset: number = DEFAULT_LYRICS_OFFSET
): number {
  if (lines.length === 0) return -1;

  // Apply timing offset to show lyrics slightly ahead of audio
  const adjustedTime = currentTime + offset;

  // Find the last line whose timestamp is <= adjustedTime
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].time <= adjustedTime) {
      return i;
    }
  }

  return -1; // Before first lyric
}

/**
 * Check if content appears to be LRC format
 */
export function isLrcFormat(content: string): boolean {
  return /\[\d{1,2}:\d{2}/.test(content);
}

/**
 * Extract plain text from LRC content (strips timestamps)
 * Returns clean lyrics text suitable for display without sync
 *
 * Preserves readability by:
 * - Adding blank lines when there's a significant time gap (> 3 sec)
 * - Grouping EN/VI pairs together naturally
 */
export function extractPlainFromLrc(lrcContent: string): string {
  const lines = parseLrc(lrcContent);
  if (lines.length === 0) return '';

  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    result.push(lines[i].text);

    // Add blank line if there's a significant time gap to next line
    if (i < lines.length - 1) {
      const gap = lines[i + 1].time - lines[i].time;
      // Gap > 3 seconds suggests a new section/verse
      if (gap > 3) {
        result.push('');
      }
    }
  }

  return result.join('\n');
}

/**
 * Represents a single occurrence of a word in the lyrics
 */
export interface WordOccurrence {
  time: number; // Timestamp in seconds
  lineText: string; // Full line text for context
  lineIndex: number; // Index in parsed lines array
}

// Vietnamese word pattern including all diacritics
const VIETNAMESE_WORD_PATTERN =
  /[\wàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]+/gi;

/**
 * Find all occurrences of given words in LRC lyrics with timestamps
 *
 * @param lrcContent - Raw LRC string with timestamps
 * @param words - Array of words to search for (case-insensitive)
 * @returns Map of lowercase word -> array of occurrences with timestamps
 */
export function findWordOccurrences(
  lrcContent: string,
  words: string[]
): Map<string, WordOccurrence[]> {
  const result = new Map<string, WordOccurrence[]>();
  const lines = parseLrc(lrcContent);

  // Normalize words to lowercase for matching
  const wordSet = new Set(words.map((w) => w.toLowerCase()));

  // Initialize result map with empty arrays
  for (const word of wordSet) {
    result.set(word, []);
  }

  // Scan each line for matching words
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineWords = line.text.match(VIETNAMESE_WORD_PATTERN) || [];

    for (const lineWord of lineWords) {
      const normalized = lineWord.toLowerCase();
      if (wordSet.has(normalized)) {
        const occurrences = result.get(normalized);
        if (occurrences) {
          occurrences.push({
            time: line.time,
            lineText: line.text,
            lineIndex: i,
          });
        }
      }
    }
  }

  return result;
}

// ============================================================================
// Enhanced LRC Format Support (Syllable-level timing)
// ============================================================================

/**
 * Syllable timing for precision karaoke
 */
export interface SyllableTiming {
  text: string;
  startTime: number;
  endTime?: number; // Optional, can be calculated from next syllable
}

/**
 * Enhanced LRC line with optional syllable-level timing
 */
export interface EnhancedLrcLine extends LrcLine {
  syllables?: SyllableTiming[];
}

/**
 * Enhanced LRC data structure for storage in lyrics_enhanced JSONB
 */
export interface EnhancedLrcData {
  version: number;
  lines: EnhancedLrcLine[];
}

/**
 * Parse enhanced LRC format with syllable timestamps
 *
 * Format: [00:15.50]<00:15.50>Xin <00:15.80>chào <00:16.10>bạn
 * - Line timestamp: [mm:ss.cc]
 * - Word timestamps: <mm:ss.cc>word
 */
export function parseEnhancedLrc(lrcContent: string): EnhancedLrcLine[] {
  const basicLines = parseLrc(lrcContent);
  const enhancedLines: EnhancedLrcLine[] = [];

  const lrcLines = lrcContent.split('\n');
  const lineTimeRegex = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/;
  const wordTimeRegex = /<(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?>/g;

  for (const rawLine of lrcLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Skip metadata lines
    if (/^\[[a-z]{2}:/.test(trimmed)) continue;

    // Get line timestamp
    const lineMatch = trimmed.match(lineTimeRegex);
    if (!lineMatch) continue;

    const lineMinutes = parseInt(lineMatch[1], 10);
    const lineSeconds = parseInt(lineMatch[2], 10);
    const lineCentis = lineMatch[3] ? parseInt(lineMatch[3].padEnd(3, '0'), 10) : 0;
    const lineTime = lineMinutes * 60 + lineSeconds + lineCentis / 1000;

    // Check for word-level timestamps
    const wordMatches = [...trimmed.matchAll(wordTimeRegex)];

    if (wordMatches.length > 0) {
      // Has word-level timing - parse syllables
      const syllables: SyllableTiming[] = [];

      for (let i = 0; i < wordMatches.length; i++) {
        const match = wordMatches[i];
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const centis = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;
        const startTime = minutes * 60 + seconds + centis / 1000;

        // Find text between this timestamp and next (or end of line)
        const matchEnd = match.index! + match[0].length;
        const nextMatch = wordMatches[i + 1];
        const textEnd = nextMatch ? nextMatch.index! : trimmed.length;
        const text = trimmed.slice(matchEnd, textEnd).replace(/<[^>]+>/g, '').trim();

        if (text) {
          syllables.push({ text, startTime });
        }
      }

      // Calculate end times from next syllable start
      for (let i = 0; i < syllables.length - 1; i++) {
        syllables[i].endTime = syllables[i + 1].startTime;
      }

      const fullText = syllables.map(s => s.text).join(' ');
      enhancedLines.push({ time: lineTime, text: fullText, syllables });
    } else {
      // Standard line - find it in basic parsed lines
      const basicLine = basicLines.find(l => Math.abs(l.time - lineTime) < 0.01);
      if (basicLine) {
        enhancedLines.push({ time: basicLine.time, text: basicLine.text });
      }
    }
  }

  return enhancedLines.sort((a, b) => a.time - b.time);
}

/**
 * Format timestamp as mm:ss.cc
 */
export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const centis = Math.round((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
}

/**
 * Format enhanced LRC lines back to string
 */
export function formatEnhancedLrc(lines: EnhancedLrcLine[]): string {
  return lines.map(line => {
    const lineTs = `[${formatTimestamp(line.time)}]`;

    if (line.syllables && line.syllables.length > 0) {
      // Enhanced format with word timestamps
      const words = line.syllables
        .map(s => `<${formatTimestamp(s.startTime)}>${s.text}`)
        .join(' ');
      return `${lineTs}${words}`;
    } else {
      // Standard format
      return `${lineTs}${line.text}`;
    }
  }).join('\n');
}

/**
 * Split text into words/syllables for Vietnamese
 * Vietnamese is space-separated, so this is straightforward
 */
export function splitTextIntoSyllables(text: string): string[] {
  return text.split(/\s+/).filter(w => w.length > 0);
}

/**
 * Create syllable timing array from text with even distribution
 * between startTime and endTime
 */
export function createEvenSyllableTiming(
  text: string,
  startTime: number,
  endTime: number
): SyllableTiming[] {
  const words = splitTextIntoSyllables(text);
  if (words.length === 0) return [];

  const duration = endTime - startTime;
  const timePerWord = duration / words.length;

  return words.map((word, index) => ({
    text: word,
    startTime: startTime + index * timePerWord,
    endTime: startTime + (index + 1) * timePerWord,
  }));
}

/**
 * Get the current syllable index based on playback time
 */
export function getCurrentSyllableIndex(
  syllables: SyllableTiming[],
  currentTime: number,
  offset: number = 0
): number {
  if (syllables.length === 0) return -1;

  const adjustedTime = currentTime + offset;

  for (let i = syllables.length - 1; i >= 0; i--) {
    if (syllables[i].startTime <= adjustedTime) {
      return i;
    }
  }

  return -1;
}

/**
 * Convert standard LRC lines to enhanced format with placeholder syllables
 */
export function standardToEnhanced(lines: LrcLine[]): EnhancedLrcLine[] {
  return lines.map((line, index) => {
    const nextLine = lines[index + 1];
    const duration = nextLine ? nextLine.time - line.time : 5; // Default 5s for last line
    const endTime = line.time + Math.min(duration, 10); // Cap at 10s

    return {
      ...line,
      syllables: createEvenSyllableTiming(line.text, line.time, endTime),
    };
  });
}
