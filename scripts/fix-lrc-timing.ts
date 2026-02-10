#!/usr/bin/env npx tsx
/**
 * LRC Timing Fix Script
 *
 * Compresses LRC timestamps to fit within the actual song duration.
 *
 * Usage:
 *   npx tsx scripts/fix-lrc-timing.ts <input.lrc> <duration_seconds> [output.lrc]
 *
 * Example:
 *   npx tsx scripts/fix-lrc-timing.ts ~/Downloads/rambutanIII.lrc 157
 *   npx tsx scripts/fix-lrc-timing.ts ~/Downloads/starfruit.lrc 180 ~/Downloads/starfruit-fixed.lrc
 */

import fs from 'fs';
import path from 'path';

// Parse command line args
const [, , inputFile, durationArg, outputFile] = process.argv;

if (!inputFile || !durationArg) {
  console.error('Usage: npx tsx scripts/fix-lrc-timing.ts <input.lrc> <duration_seconds> [output.lrc]');
  console.error('Example: npx tsx scripts/fix-lrc-timing.ts ~/Downloads/song.lrc 157');
  process.exit(1);
}

const duration = parseFloat(durationArg);
if (isNaN(duration) || duration <= 0) {
  console.error('Error: duration must be a positive number (in seconds)');
  process.exit(1);
}

// Resolve input path (handle ~)
const resolvedInput = inputFile.replace(/^~/, process.env.HOME || '');
if (!fs.existsSync(resolvedInput)) {
  console.error(`Error: File not found: ${resolvedInput}`);
  process.exit(1);
}

// Read and parse LRC
const content = fs.readFileSync(resolvedInput, 'utf-8');
const lines = content.split('\n');

interface LrcEntry {
  originalTime: number;
  text: string;
  originalLine: string;
}

const entries: LrcEntry[] = [];
const metadataLines: string[] = [];

// Extended regex to handle 1-3 digit minutes
const timeRegex = /^\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\](.*)$/;

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed) continue;

  // Check for metadata lines like [ar:Artist]
  if (/^\[[a-z]{2}:/.test(trimmed)) {
    metadataLines.push(trimmed);
    continue;
  }

  const match = trimmed.match(timeRegex);
  if (match) {
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const centiseconds = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;
    const time = minutes * 60 + seconds + centiseconds / 1000;
    const text = match[4].trim();

    if (text) {
      entries.push({
        originalTime: time,
        text,
        originalLine: trimmed,
      });
    }
  }
}

if (entries.length === 0) {
  console.error('Error: No valid LRC entries found in file');
  process.exit(1);
}

// Sort by original time
entries.sort((a, b) => a.originalTime - b.originalTime);

// Calculate compression
const originalMin = entries[0].originalTime;
const originalMax = entries[entries.length - 1].originalTime;
const originalRange = originalMax - originalMin;

// Target range: start at 3 seconds, end at duration - 3 seconds
const targetStart = 3;
const targetEnd = duration - 3;
const targetRange = targetEnd - targetStart;

console.log('\n📊 Analysis:');
console.log(`   Original range: ${originalMin.toFixed(2)}s - ${originalMax.toFixed(2)}s (${(originalRange / 60).toFixed(1)} minutes)`);
console.log(`   Target range: ${targetStart.toFixed(2)}s - ${targetEnd.toFixed(2)}s (${duration}s song)`);
console.log(`   Compression ratio: ${(originalRange / targetRange).toFixed(1)}x`);
console.log(`   Total lines: ${entries.length}`);

// Generate new LRC content
const outputLines: string[] = [...metadataLines];

for (const entry of entries) {
  // Linear interpolation to compress timestamps
  const normalizedPosition = (entry.originalTime - originalMin) / originalRange;
  const newTime = targetStart + normalizedPosition * targetRange;

  // Format as [mm:ss.xx]
  const minutes = Math.floor(newTime / 60);
  const seconds = newTime % 60;
  const timestamp = `[${minutes.toString().padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}]`;

  outputLines.push(`${timestamp}${entry.text}`);
}

const outputContent = outputLines.join('\n') + '\n';

// Determine output path
const resolvedOutput = outputFile
  ? outputFile.replace(/^~/, process.env.HOME || '')
  : resolvedInput.replace('.lrc', '-fixed.lrc');

fs.writeFileSync(resolvedOutput, outputContent, 'utf-8');

console.log(`\n✅ Fixed LRC saved to: ${resolvedOutput}`);
console.log('\n📝 Preview (first 5 lines):');
outputLines.slice(metadataLines.length, metadataLines.length + 5).forEach(line => {
  console.log(`   ${line}`);
});
console.log('\n📝 Preview (last 3 lines):');
outputLines.slice(-3).forEach(line => {
  console.log(`   ${line}`);
});
