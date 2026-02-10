/**
 * Auto-categorize songs by parsing genre from title
 *
 * This script extracts genre information from song titles that follow the pattern:
 * "Song Name (Genre)" - e.g., "Xin Chào (Hip-Hop)" → Hip-Hop
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/categorize-songs.ts [--dry-run] [--all]
 *
 * Options:
 *   --dry-run  Preview changes without updating database
 *   --all      Process all songs (not just those with null genre)
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables (from .env.local)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables:');
  if (!SUPABASE_URL) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error(
    '\nMake sure .env.local is loaded. Run with: npx tsx --env-file=.env.local scripts/categorize-songs.ts'
  );
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Canonical genre list (matches DEFAULT_GENRES in SongUploader.tsx)
const VALID_GENRES = [
  'Lo-Fi',
  'Hip-Hop',
  'Vina House',
  'Pop',
  'Ballad',
  'EDM',
  'R&B',
  'Acoustic',
];

// Common variations and aliases
const GENRE_ALIASES: Record<string, string> = {
  lofi: 'Lo-Fi',
  'lo fi': 'Lo-Fi',
  'lo-fi': 'Lo-Fi',
  hiphop: 'Hip-Hop',
  'hip hop': 'Hip-Hop',
  'hip-hop': 'Hip-Hop',
  'vina house': 'Vina House',
  vinahouse: 'Vina House',
  'viet house': 'Vina House',
  vh: 'Vina House',
  rnb: 'R&B',
  'r&b': 'R&B',
  'r & b': 'R&B',
};

interface CardSong {
  id: string;
  title: string;
  genre: string | null;
}

/**
 * Parse genre from title - handles multiple patterns:
 * 1. "Song Name (Genre)" - genre at end
 * 2. "Song Name (Genre) III" - genre before version number
 * 3. "VinaHouse Coffee" - genre keyword in title
 */
function parseGenreFromTitle(title: string): string | null {
  // Pattern 1: Match (Genre) at end of title
  let match = title.match(/\(([^)]+)\)\s*$/);

  // Pattern 2: Match (Genre) followed by optional version numbers like "III", "IV", "1", "0.1"
  if (!match) {
    match = title.match(/\(([^)]+)\)\s*(?:[IVX]+|\d+(?:\.\d+)?)\s*$/i);
  }

  // Pattern 3: Match (Genre) anywhere if followed by space/end
  if (!match) {
    match = title.match(/\(([^)]+)\)(?:\s|$)/);
  }

  if (match) {
    const extracted = match[1].trim().toLowerCase();

    // Check aliases first
    if (GENRE_ALIASES[extracted]) {
      return GENRE_ALIASES[extracted];
    }

    // Case-insensitive match to canonical genre
    const canonical = VALID_GENRES.find((g) => g.toLowerCase() === extracted);
    if (canonical) return canonical;
  }

  // Pattern 4: Check for genre keywords in the title itself (e.g., "VinaHouse Coffee")
  const titleLower = title.toLowerCase();
  if (titleLower.includes('vinahouse') || titleLower.includes('vina house')) {
    return 'Vina House';
  }

  return null;
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const processAll = args.includes('--all');

  console.log('='.repeat(60));
  console.log('Song Genre Categorization Script');
  console.log('='.repeat(60));
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`);
  console.log(`Scope: ${processAll ? 'All songs' : 'Songs with null genre only'}`);
  console.log(`Valid genres: ${VALID_GENRES.join(', ')}`);
  console.log('='.repeat(60));
  console.log('');

  // Fetch songs
  let query = supabase.from('card_songs').select('id, title, genre').order('created_at', { ascending: false });

  if (!processAll) {
    query = query.is('genre', null);
  }

  const { data: songs, error } = await query;

  if (error) {
    console.error('Failed to fetch songs:', error);
    process.exit(1);
  }

  if (!songs || songs.length === 0) {
    console.log('No songs found to process.');
    process.exit(0);
  }

  console.log(`Found ${songs.length} songs to process.\n`);

  // Track results
  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let noGenreFound = 0;
  const genreCounts: Record<string, number> = {};

  for (const song of songs as CardSong[]) {
    processed++;
    const progress = `[${processed}/${songs.length}]`;

    // Parse genre from title
    const parsedGenre = parseGenreFromTitle(song.title);

    if (!parsedGenre) {
      console.log(`${progress} NO MATCH: "${song.title}"`);
      noGenreFound++;
      continue;
    }

    // Skip if genre already matches (only relevant with --all flag)
    if (song.genre === parsedGenre) {
      console.log(`${progress} SKIP: "${song.title}" (already ${parsedGenre})`);
      skipped++;
      continue;
    }

    console.log(`${progress} "${song.title}"`);
    console.log(`         Current: ${song.genre || '(null)'}`);
    console.log(`         Parsed:  ${parsedGenre}`);

    if (!dryRun) {
      const { error: updateError } = await supabase
        .from('card_songs')
        .update({ genre: parsedGenre })
        .eq('id', song.id);

      if (updateError) {
        console.error(`         ERROR: ${updateError.message}`);
        continue;
      }
    }

    updated++;
    genreCounts[parsedGenre] = (genreCounts[parsedGenre] || 0) + 1;
    console.log(`         ${dryRun ? 'Would update' : 'Updated'} ✓`);
    console.log('');
  }

  // Summary
  console.log('='.repeat(60));
  console.log('Categorization Complete');
  console.log('='.repeat(60));
  console.log(`Total processed: ${processed}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (already correct): ${skipped}`);
  console.log(`No genre found in title: ${noGenreFound}`);
  console.log('');

  if (updated > 0) {
    console.log('Genre breakdown:');
    Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([genre, count]) => {
        console.log(`  ${genre}: ${count}`);
      });
  }

  if (dryRun) {
    console.log('\nThis was a DRY RUN. No changes were made to the database.');
    console.log('Run without --dry-run to apply changes.');
  }

  if (noGenreFound > 0) {
    console.log(`\nNote: ${noGenreFound} songs have no genre in their title.`);
    console.log('These may need manual categorization via the admin UI.');
  }
}

main().catch(console.error);
