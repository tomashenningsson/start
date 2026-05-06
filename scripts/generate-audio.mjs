#!/usr/bin/env node
// =====================================================================
// Stjärnjakten — Azure Neural Speech audio generator
// =====================================================================
// Reads scripts/audio-catalog.mjs, calls Azure Cognitive Services Speech
// for every distinct utterance, and writes deterministically-named MP3s
// into public/audio/<category>/. A manifest at public/audio/manifest.json
// maps each Swedish text → relative file URL the runtime will fetch.
//
// Idempotent: skips files that already exist on disk. Safe to re-run.
//
// Usage:
//   node scripts/generate-audio.mjs              # generate everything
//   node scripts/generate-audio.mjs --force      # re-render all entries
//   node scripts/generate-audio.mjs --only=praise,letters
//
// Requires AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in .env.local.
// =====================================================================

import { createHash } from 'node:crypto';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import sdk from 'microsoft-cognitiveservices-speech-sdk';

// Load .env.local first (preferred, gitignored), then fall back to .env.
dotenv.config({ path: new URL('../.env.local', import.meta.url) });
dotenv.config({ path: new URL('../.env',       import.meta.url) });

import { ALL_ENTRIES } from './audio-catalog.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');
const AUDIO_DIR = join(ROOT, 'public', 'audio');
const MANIFEST  = join(AUDIO_DIR, 'manifest.json');

// ---------- argv ----------
const argv  = process.argv.slice(2);
const FORCE = argv.includes('--force');
const ONLY  = (() => {
  const flag = argv.find(a => a.startsWith('--only='));
  return flag ? new Set(flag.replace('--only=', '').split(',').map(s => s.trim())) : null;
})();

// ---------- env ----------
const KEY    = process.env.AZURE_SPEECH_KEY;
const REGION = process.env.AZURE_SPEECH_REGION;
const VOICE  = process.env.AZURE_SPEECH_VOICE        || 'sv-SE-SofieNeural';
const RATE   = process.env.AZURE_SPEECH_RATE         || '-4%';
const PITCH  = process.env.AZURE_SPEECH_PITCH        || '+8%';
const STYLE  = process.env.AZURE_SPEECH_STYLE        || 'cheerful';
const STYLE_DEGREE = process.env.AZURE_SPEECH_STYLE_DEGREE || '1.4';

if (!KEY || !REGION) {
  console.error('❌  AZURE_SPEECH_KEY and AZURE_SPEECH_REGION must be set in .env.local');
  process.exit(1);
}

// ---------- helpers ----------
export function slug(text) {
  return createHash('sha1').update(text, 'utf8').digest('hex').slice(0, 16);
}

function escapeSsml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSsml(text) {
  // Warm, cheerful, child-friendly Swedish neural voice. mstts:express-as
  // adds emotional warmth; prosody slows + raises pitch a touch so kids
  // ages 3-6 can follow easily.
  const safe = escapeSsml(text);
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="sv-SE">
  <voice name="${VOICE}">
    <mstts:express-as style="${STYLE}" styledegree="${STYLE_DEGREE}">
      <prosody rate="${RATE}" pitch="${PITCH}">${safe}</prosody>
    </mstts:express-as>
  </voice>
</speak>`;
}

function synthesize(text) {
  return new Promise((res, rej) => {
    const cfg = sdk.SpeechConfig.fromSubscription(KEY, REGION);
    cfg.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Audio24Khz96KBitRateMonoMp3;
    cfg.speechSynthesisVoiceName = VOICE;
    const synth = new sdk.SpeechSynthesizer(cfg, null);
    synth.speakSsmlAsync(
      buildSsml(text),
      result => {
        try {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            res(Buffer.from(result.audioData));
          } else {
            rej(new Error(result.errorDetails || `synthesis failed (reason=${result.reason})`));
          }
        } finally { synth.close(); }
      },
      err => { synth.close(); rej(err); }
    );
  });
}

async function ensureDir(p) {
  await mkdir(p, { recursive: true });
}

async function fileExists(p) {
  try { await access(p); return true; } catch { return false; }
}

// ---------- pipeline ----------
async function run() {
  await ensureDir(AUDIO_DIR);

  const filtered = ONLY ? ALL_ENTRIES.filter(e => ONLY.has(e.category)) : ALL_ENTRIES;
  const total    = filtered.length;
  console.log(`🎙️   Voice: ${VOICE}   Style: ${STYLE} (degree ${STYLE_DEGREE})   Rate: ${RATE}   Pitch: ${PITCH}`);
  console.log(`📚  Catalog: ${total} entries`);

  const manifest = {
    version: 2,
    generatedAt: new Date().toISOString(),
    voice: VOICE,
    style: STYLE,
    rate: RATE,
    pitch: PITCH,
    entries: {},
  };

  let created = 0, skipped = 0, failed = 0;
  for (let i = 0; i < total; i++) {
    const { category, text } = filtered[i];
    if (!text || !text.trim()) continue;

    const id       = slug(text);
    const relPath  = `${category}/${id}.mp3`;
    const absPath  = join(AUDIO_DIR, relPath);
    manifest.entries[text] = relPath;

    if (!FORCE && await fileExists(absPath)) {
      skipped++;
      continue;
    }

    await ensureDir(dirname(absPath));

    const display = text.length > 60 ? text.slice(0, 57) + '…' : text;
    process.stdout.write(`[${String(i + 1).padStart(4)}/${total}] ${category.padEnd(13)} ${display}\n`);

    try {
      const buf = await synthesize(text);
      await writeFile(absPath, buf);
      created++;
    } catch (err) {
      failed++;
      console.error(`   ⚠️   ${err.message || err}`);
      delete manifest.entries[text];   // don't list failed entries
    }
  }

  // Merge with any existing manifest to keep entries from prior partial runs.
  if (existsSync(MANIFEST) && !FORCE) {
    try {
      const prior = JSON.parse(await (await import('node:fs/promises')).readFile(MANIFEST, 'utf8'));
      manifest.entries = { ...prior.entries, ...manifest.entries };
    } catch { /* ignore corrupt prior manifest */ }
  }

  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`\n✅  Done. ${created} created, ${skipped} skipped, ${failed} failed.`);
  console.log(`📄  Manifest: ${MANIFEST}`);
  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
