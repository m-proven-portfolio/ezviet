#!/usr/bin/env npx tsx
/**
 * LRC Generator Script
 *
 * Generates LRC files with evenly distributed timestamps from plain lyrics.
 *
 * Usage:
 *   npx tsx scripts/generate-lrc.ts <lyrics.txt> <duration_seconds> [output.lrc]
 *
 * Or pipe lyrics directly:
 *   echo "Line 1\nLine 2" | npx tsx scripts/generate-lrc.ts - 157 output.lrc
 *
 * Example:
 *   npx tsx scripts/generate-lrc.ts ~/Downloads/rambutan-lyrics.txt 157 ~/Downloads/rambutan.lrc
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const [, , inputArg, durationArg, outputArg] = process.argv;

if (!inputArg || !durationArg) {
  console.error(`
📝 LRC Generator - Create synced lyrics from plain text

Usage:
  npx tsx scripts/generate-lrc.ts <lyrics.txt> <duration_seconds> [output.lrc]

Options:
  lyrics.txt       Plain text file with one line per lyric (or "-" for stdin)
  duration_seconds Song duration in seconds
  output.lrc       Output file (optional, defaults to input-name.lrc)

Example:
  npx tsx scripts/generate-lrc.ts lyrics.txt 157 song.lrc
  `);
  process.exit(1);
}

const duration = parseFloat(durationArg);
if (isNaN(duration) || duration <= 0) {
  console.error('Error: duration must be a positive number (in seconds)');
  process.exit(1);
}

async function main() {
  let lines: string[];

  if (inputArg === '-') {
    // Read from stdin
    const rl = readline.createInterface({ input: process.stdin });
    lines = [];
    for await (const line of rl) {
      if (line.trim()) lines.push(line.trim());
    }
  } else {
    const resolvedInput = inputArg.replace(/^~/, process.env.HOME || '');
    if (!fs.existsSync(resolvedInput)) {
      console.error(`Error: File not found: ${resolvedInput}`);
      process.exit(1);
    }
    const content = fs.readFileSync(resolvedInput, 'utf-8');
    lines = content.split('\n').filter(line => line.trim()).map(line => line.trim());
  }

  if (lines.length === 0) {
    console.error('Error: No lyrics found');
    process.exit(1);
  }

  // Calculate timing
  // Start at 3 seconds, end at duration - 2 seconds
  const startTime = 3;
  const endTime = duration - 2;
  const totalTime = endTime - startTime;
  const interval = totalTime / (lines.length - 1 || 1);

  console.log('\n📊 Generation settings:');
  console.log(`   Song duration: ${duration}s (${Math.floor(duration / 60)}:${(duration % 60).toFixed(0).padStart(2, '0')})`);
  console.log(`   Total lines: ${lines.length}`);
  console.log(`   Time per line: ~${interval.toFixed(2)}s`);

  // Generate LRC content
  const lrcLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const time = startTime + i * interval;
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    const timestamp = `[${minutes.toString().padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}]`;
    lrcLines.push(`${timestamp}${lines[i]}`);
  }

  const lrcContent = lrcLines.join('\n') + '\n';

  // Determine output path
  let outputPath: string;
  if (outputArg) {
    outputPath = outputArg.replace(/^~/, process.env.HOME || '');
  } else if (inputArg !== '-') {
    const resolvedInput = inputArg.replace(/^~/, process.env.HOME || '');
    outputPath = resolvedInput.replace(/\.(txt|lrc)$/i, '') + '.lrc';
  } else {
    outputPath = 'output.lrc';
  }

  fs.writeFileSync(outputPath, lrcContent, 'utf-8');

  console.log(`\n✅ LRC saved to: ${outputPath}`);
  console.log('\n📝 Preview (first 5 lines):');
  lrcLines.slice(0, 5).forEach(line => console.log(`   ${line}`));
  if (lrcLines.length > 8) {
    console.log('   ...');
    console.log('\n📝 Preview (last 3 lines):');
    lrcLines.slice(-3).forEach(line => console.log(`   ${line}`));
  }
}

main().catch(console.error);
