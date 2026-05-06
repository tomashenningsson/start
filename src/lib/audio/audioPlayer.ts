// =====================================================================
// Stjärnjakten — runtime audio player
// =====================================================================
// Plays pre-rendered Azure Neural Speech MP3s by looking up the exact
// Swedish utterance in /public/audio/manifest.json. Falls back to the
// browser's speechSynthesis only when an entry is missing — that path
// is intentionally rare so kids hear the warm Sofie voice consistently.
//
// Designed for fast local playback:
//   • Manifest is fetched once and cached for the session.
//   • HTMLAudioElement instances are pooled and pre-loaded the first
//     time a phrase is requested.
//   • A small ring buffer of ready-to-play elements keeps latency low
//     so taps feel instant.
// =====================================================================

export interface AudioManifest {
  version: number;
  voice: string;
  generatedAt: string;
  entries: Record<string, string>;   // text → "category/<hash>.mp3"
}

const MANIFEST_URL = '/audio/manifest.json';
const AUDIO_BASE   = '/audio/';
const POOL_LIMIT   = 8;

let manifestPromise: Promise<AudioManifest | null> | null = null;
const elementPool = new Map<string, HTMLAudioElement>();
let currentlyPlaying: HTMLAudioElement | null = null;

function normalize(text: string): string {
  // Trim and collapse internal whitespace to match generator behavior.
  return text.replace(/\s+/g, ' ').trim();
}

async function loadManifest(): Promise<AudioManifest | null> {
  if (manifestPromise) return manifestPromise;
  manifestPromise = (async () => {
    try {
      const res = await fetch(MANIFEST_URL, { cache: 'force-cache' });
      if (!res.ok) return null;
      return (await res.json()) as AudioManifest;
    } catch {
      return null;
    }
  })();
  return manifestPromise;
}

function resolveUrl(manifest: AudioManifest, text: string): string | null {
  const key = normalize(text);
  const rel = manifest.entries[key] || manifest.entries[text];
  return rel ? AUDIO_BASE + rel : null;
}

function getElement(url: string): HTMLAudioElement {
  const cached = elementPool.get(url);
  if (cached) return cached;
  const el = new Audio(url);
  el.preload = 'auto';
  elementPool.set(url, el);
  if (elementPool.size > POOL_LIMIT) {
    // Evict the oldest entry to keep memory bounded.
    const first = elementPool.keys().next().value;
    if (first && first !== url) elementPool.delete(first);
  }
  return el;
}

function speakViaTtsFallback(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const doSpeak = () => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'sv-SE';
    utt.rate = 0.92;
    utt.pitch = 1.1;
    const voices = window.speechSynthesis.getVoices();
    const sv = voices.find(v => v.lang.startsWith('sv'));
    if (sv) utt.voice = sv;
    window.speechSynthesis.speak(utt);
  };
  if (window.speechSynthesis.getVoices().length > 0) doSpeak();
  else window.speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true });
}

export function cancelAudio(): void {
  if (currentlyPlaying) {
    currentlyPlaying.pause();
    currentlyPlaying.currentTime = 0;
    currentlyPlaying = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export async function playAudio(text: string): Promise<void> {
  if (!text || typeof window === 'undefined') return;

  cancelAudio();

  const manifest = await loadManifest();
  const url = manifest ? resolveUrl(manifest, text) : null;

  if (!url) {
    speakViaTtsFallback(text);
    return;
  }

  const el = getElement(url);
  // Always restart from the beginning — kids tap repeatedly.
  try { el.currentTime = 0; } catch { /* iOS pre-load may throw; ignore */ }
  currentlyPlaying = el;
  try {
    await el.play();
  } catch {
    // Autoplay might be blocked before a user gesture; fall back gracefully.
    speakViaTtsFallback(text);
  }
}

// Pre-warm the manifest so the first speak() call is fast.
export function prewarmAudio(): void {
  if (typeof window === 'undefined') return;
  void loadManifest();
}

export async function getManifestSize(): Promise<number> {
  const m = await loadManifest();
  return m ? Object.keys(m.entries).length : 0;
}
