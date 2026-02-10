/**
 * Migration Script: Re-romanize all Vietnamese card terms
 *
 * This script updates all card_terms with the new v4.0.0 romanization system
 * based on the teacher's standardized rules.
 *
 * Usage:
 *   npx tsx scripts/re-romanize-cards.ts [--dry-run] [--start-from=ID]
 *
 * Options:
 *   --dry-run      Preview changes without updating database
 *   --start-from   Resume from a specific card_term ID
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Configuration
const PROMPT_VERSION = 'v4.0.0';
const DELAY_MS = 500; // Delay between API calls to avoid rate limiting

// Load environment variables (from .env.local)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Validate environment
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
  console.error('Missing required environment variables:');
  if (!SUPABASE_URL) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  if (!OPENAI_API_KEY) console.error('  - OPENAI_API_KEY');
  console.error('\nMake sure .env.local is loaded. Run with: npx tsx --env-file=.env.local scripts/re-romanize-cards.ts');
  process.exit(1);
}

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// The same prompt from route.ts
const SYSTEM_PROMPT = `You are a Vietnamese language expert. Generate phonetic romanization for Vietnamese text.

## ROMANIZATION SYSTEM

### TONES (always add in parentheses after pronunciation)
- No mark (thanh ngang) = flat
- ́ sắc = up
- ̀ huyền = down
- ̉ hỏi = broken down
- ̃ ngã = broken up
- ̣ nặng = low drop

### BASE VOWELS
- a → ah, ă → ā, â → ūh
- e → eh, ê → eih, i → ee, y → ee
- o → aw, ô → oh, ơ → er
- u → oo, ư → eu

### VOWEL COMBINATIONS
ai → ai, ay → ay, ao → ao, au → au
ia → ia, oa → oa, oi → oi, ua → ua
uo / uô → uo, ưa / ươ → eua

### CONSONANTS
đ → d, ph → f, th → th, kh → kh
nh → ny, ng/ngh → ng, x → s
d/gi (South) → y, qu → w, tr → tr
Final: -c → k, -ch → ch

## EXAMPLES
- mận → muhn (low drop)
- chuối → chooi (up)
- xoài → soai (down)
- nho → nyo (flat)
- dưa hấu → yeua how (flat, up)

Return ONLY the romanization with tone in parentheses. Example: "nyo (flat)"`;

interface CardTerm {
  id: string;
  card_id: string;
  text: string;
  romanization: string | null;
  prompt_version: string | null;
}

async function generateRomanization(vietnameseText: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Romanize: "${vietnameseText}"` }
    ],
    temperature: 0.3,
    max_tokens: 100,
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('No response from AI');
  }

  return content;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const startFromArg = args.find(a => a.startsWith('--start-from='));
  const startFromId = startFromArg?.split('=')[1];

  console.log('='.repeat(60));
  console.log('Vietnamese Romanization Migration Script');
  console.log('='.repeat(60));
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`);
  console.log(`Prompt Version: ${PROMPT_VERSION}`);
  if (startFromId) console.log(`Starting from ID: ${startFromId}`);
  console.log('='.repeat(60));
  console.log('');

  // Fetch all Vietnamese terms
  let query = supabase
    .from('card_terms')
    .select('id, card_id, text, romanization, prompt_version')
    .eq('lang', 'vi')
    .order('created_at', { ascending: true });

  if (startFromId) {
    query = query.gt('id', startFromId);
  }

  const { data: terms, error } = await query;

  if (error) {
    console.error('Failed to fetch card terms:', error);
    process.exit(1);
  }

  if (!terms || terms.length === 0) {
    console.log('No Vietnamese terms found to update.');
    process.exit(0);
  }

  console.log(`Found ${terms.length} Vietnamese terms to process.\n`);

  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const term of terms as CardTerm[]) {
    processed++;
    const progress = `[${processed}/${terms.length}]`;

    // Skip if already on v4.0.0
    if (term.prompt_version === PROMPT_VERSION) {
      console.log(`${progress} SKIP: ${term.text} (already v4.0.0)`);
      skipped++;
      continue;
    }

    try {
      console.log(`${progress} Processing: "${term.text}"`);

      // Generate new romanization
      const newRomanization = await generateRomanization(term.text);

      console.log(`         Old: ${term.romanization || '(none)'}`);
      console.log(`         New: ${newRomanization}`);

      if (!dryRun) {
        // Update the database
        const { error: updateError } = await supabase
          .from('card_terms')
          .update({
            romanization: newRomanization,
            phonetic_helper: newRomanization, // Keep in sync
            prompt_version: PROMPT_VERSION,
            generated_by_ai: true,
          })
          .eq('id', term.id);

        if (updateError) {
          console.error(`         ERROR: ${updateError.message}`);
          failed++;
          continue;
        }
      }

      updated++;
      console.log(`         ${dryRun ? 'Would update' : 'Updated'} successfully`);
      console.log('');

      // Rate limiting delay
      await sleep(DELAY_MS);

    } catch (err) {
      console.error(`         ERROR: ${err instanceof Error ? err.message : 'Unknown error'}`);
      failed++;
      console.log('');

      // Continue to next term
      await sleep(DELAY_MS);
    }
  }

  // Summary
  console.log('='.repeat(60));
  console.log('Migration Complete');
  console.log('='.repeat(60));
  console.log(`Total processed: ${processed}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (already v4.0.0): ${skipped}`);
  console.log(`Failed: ${failed}`);

  if (dryRun) {
    console.log('\nThis was a DRY RUN. No changes were made to the database.');
    console.log('Run without --dry-run to apply changes.');
  }
}

main().catch(console.error);
