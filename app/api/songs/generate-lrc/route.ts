import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createAdminClient } from '@/lib/supabase/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface WhisperWord {
  word: string;
  start: number;
  end: number;
}

interface WhisperSegment {
  id: number;
  text: string;
  start: number;
  end: number;
  words?: WhisperWord[];
}

/**
 * Generate LRC file from audio using OpenAI Whisper with word-level timestamps
 *
 * POST /api/songs/generate-lrc
 * Body: { storagePath: string, lyrics?: string }
 *
 * If lyrics provided: aligns user's lyrics with Whisper timestamps
 * If no lyrics: uses Whisper's transcription directly
 */
export async function POST(request: NextRequest) {
  try {
    const { storagePath, lyrics } = await request.json();

    if (!storagePath) {
      return NextResponse.json({ error: 'storagePath is required' }, { status: 400 });
    }

    // Get the audio file from Supabase storage
    const supabase = createAdminClient();
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('cards-songs')
      .download(storagePath);

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError);
      return NextResponse.json({ error: 'Failed to download audio file' }, { status: 500 });
    }

    // Convert Blob to File for OpenAI
    const audioFile = new File([fileData], 'audio.mp3', { type: 'audio/mpeg' });

    // Call Whisper API with word-level timestamps
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word', 'segment'],
      language: 'vi', // Optimize for Vietnamese
    });

    // Type assertion for verbose_json response
    const response = transcription as unknown as {
      text: string;
      segments: WhisperSegment[];
      words?: WhisperWord[];
    };

    let lrcContent: string;
    let plainLyrics: string;

    if (lyrics && lyrics.trim()) {
      // User provided lyrics - align with Whisper timestamps
      const result = alignLyricsWithTimestamps(
        lyrics,
        response.segments,
        response.words || []
      );
      lrcContent = result.lrc;
      plainLyrics = result.plain;
    } else {
      // No lyrics provided - use Whisper's transcription
      const result = generateLrcFromSegments(response.segments);
      lrcContent = result.lrc;
      plainLyrics = result.plain;
    }

    return NextResponse.json({
      lrc: lrcContent,
      plain: plainLyrics,
      transcription: response.text,
      segmentCount: response.segments.length,
      wordCount: response.words?.length || 0,
    });
  } catch (error) {
    console.error('LRC generation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate LRC';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Generate LRC from Whisper segments (when no user lyrics provided)
 */
function generateLrcFromSegments(segments: WhisperSegment[]): { lrc: string; plain: string } {
  const lrcLines: string[] = [];
  const plainLines: string[] = [];

  for (const segment of segments) {
    const timestamp = formatLrcTimestamp(segment.start);
    const text = segment.text.trim();
    if (text) {
      lrcLines.push(`${timestamp}${text}`);
      plainLines.push(text);
    }
  }

  return {
    lrc: lrcLines.join('\n'),
    plain: plainLines.join('\n'),
  };
}

/**
 * Calculate text similarity between two strings (0-1 score)
 * Uses word overlap for better Vietnamese matching
 */
function textSimilarity(a: string, b: string): number {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').trim();

  const wordsA = new Set(normalize(a).split(/\s+/).filter(w => w.length > 0));
  const wordsB = new Set(normalize(b).split(/\s+/).filter(w => w.length > 0));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  // Count overlapping words
  let overlap = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) overlap++;
  }

  // Jaccard-like similarity
  const union = new Set([...wordsA, ...wordsB]).size;
  return overlap / union;
}

/**
 * Smart Hybrid Alignment: Match user lyrics to Whisper segments by text similarity
 *
 * Strategy:
 * 1. For each user line, find best matching Whisper segment by text similarity
 * 2. Use Whisper's precise timing for matched lines (similarity > threshold)
 * 3. Interpolate timing for unmatched lines from surrounding matched lines
 * 4. Preserve user's exact text (never use Whisper's transcription)
 */
function alignLyricsWithTimestamps(
  userLyrics: string,
  segments: WhisperSegment[],
  words: WhisperWord[]
): { lrc: string; plain: string } {
  // Parse user lines, preserving their original text exactly
  const userLines = userLyrics
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (userLines.length === 0 || segments.length === 0) {
    return { lrc: '', plain: userLyrics };
  }

  const SIMILARITY_THRESHOLD = 0.3; // Minimum similarity to consider a match

  // Step 1: Match each user line to best Whisper segment
  interface LineMatch {
    userLineIndex: number;
    text: string;
    segmentIndex: number | null;
    timestamp: number | null;
    similarity: number;
  }

  const matches: LineMatch[] = userLines.map((line, userIdx) => {
    let bestMatch = { segmentIndex: null as number | null, similarity: 0, timestamp: null as number | null };

    for (let segIdx = 0; segIdx < segments.length; segIdx++) {
      const segment = segments[segIdx];
      const similarity = textSimilarity(line, segment.text);

      if (similarity > bestMatch.similarity) {
        bestMatch = {
          segmentIndex: segIdx,
          similarity,
          timestamp: segment.start,
        };
      }
    }

    // Only accept match if above threshold
    if (bestMatch.similarity >= SIMILARITY_THRESHOLD) {
      return {
        userLineIndex: userIdx,
        text: line,
        segmentIndex: bestMatch.segmentIndex,
        timestamp: bestMatch.timestamp,
        similarity: bestMatch.similarity,
      };
    }

    return {
      userLineIndex: userIdx,
      text: line,
      segmentIndex: null,
      timestamp: null,
      similarity: 0,
    };
  });

  // Step 2: Resolve conflicts (multiple user lines matching same segment)
  // Keep the best match, clear others
  const usedSegments = new Map<number, number>(); // segmentIndex -> userLineIndex with best similarity

  for (const match of matches) {
    if (match.segmentIndex !== null) {
      const existing = usedSegments.get(match.segmentIndex);
      if (existing === undefined) {
        usedSegments.set(match.segmentIndex, match.userLineIndex);
      } else {
        // Compare similarities
        const existingMatch = matches[existing];
        if (match.similarity > existingMatch.similarity) {
          // Current match is better, clear the old one
          existingMatch.segmentIndex = null;
          existingMatch.timestamp = null;
          usedSegments.set(match.segmentIndex, match.userLineIndex);
        } else {
          // Existing is better, clear current
          match.segmentIndex = null;
          match.timestamp = null;
        }
      }
    }
  }

  // Step 3: Interpolate timing for unmatched lines
  const speechStart = segments[0].start;
  const speechEnd = segments[segments.length - 1].end;

  // Find anchor points (matched lines)
  const anchors: { index: number; time: number }[] = [];
  for (const match of matches) {
    if (match.timestamp !== null) {
      anchors.push({ index: match.userLineIndex, time: match.timestamp });
    }
  }

  // If no matches at all, fall back to even distribution
  if (anchors.length === 0) {
    const duration = speechEnd - speechStart;
    const timePerLine = duration / Math.max(1, userLines.length);

    for (let i = 0; i < matches.length; i++) {
      matches[i].timestamp = speechStart + i * timePerLine;
    }
  } else {
    // Add implicit anchors at start and end if needed
    if (anchors[0].index !== 0) {
      anchors.unshift({ index: 0, time: Math.max(0, anchors[0].time - 0.5) });
    }
    if (anchors[anchors.length - 1].index !== userLines.length - 1) {
      anchors.push({ index: userLines.length - 1, time: speechEnd });
    }

    // Interpolate between anchors
    for (let a = 0; a < anchors.length - 1; a++) {
      const startAnchor = anchors[a];
      const endAnchor = anchors[a + 1];
      const indexRange = endAnchor.index - startAnchor.index;
      const timeRange = endAnchor.time - startAnchor.time;

      for (let i = startAnchor.index; i <= endAnchor.index; i++) {
        if (matches[i].timestamp === null) {
          const progress = (i - startAnchor.index) / indexRange;
          matches[i].timestamp = startAnchor.time + progress * timeRange;
        }
      }
    }
  }

  // Step 4: Generate LRC output with user's exact text
  const lrcLines = matches.map(
    match => `${formatLrcTimestamp(match.timestamp ?? 0)}${match.text}`
  );

  return {
    lrc: lrcLines.join('\n'),
    plain: userLyrics, // Preserve original formatting exactly
  };
}

/**
 * Format timestamp as [mm:ss.xx]
 */
function formatLrcTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `[${mins.toString().padStart(2, '0')}:${secs.toFixed(2).padStart(5, '0')}]`;
}
