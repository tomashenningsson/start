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

// --- Autoplay unlock --------------------------------------------------
// Browsers block audio.play() before the first user gesture. When that
// happens we stash the most recent playback request and replay it as
// soon as the user taps anywhere — that's how the dragon's greeting
// reaches the kid even when the page was opened cold.
let audioUnlocked = false;
let pendingPlayback: (() => void) | null = null;

// Tiny silent WAV — base64 of a 16-bit PCM frame at ~44.1kHz. Playing
// this inside the user's first gesture is the standard iOS Safari trick
// to unlock the audio API for the rest of the session.
const SILENT_PRIMER =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

function unlockAudio(): void {
  if (audioUnlocked) return;
  audioUnlocked = true;

  // Prime the audio system. iOS Safari (and Capacitor's WKWebView) only
  // unlocks audio after a successful play() inside a gesture handler,
  // and the unlock is per-element. Playing a silent buffer here grants
  // the rest of the session the right to call .play() asynchronously.
  try {
    const primer = new Audio(SILENT_PRIMER);
    primer.volume = 0;
    void primer.play().catch(() => { /* ignore */ });
  } catch { /* ignore */ }

  const fn = pendingPlayback;
  pendingPlayback = null;
  if (fn) fn();
}

function installUnlockListeners(): void {
  if (typeof window === 'undefined') return;
  const events: (keyof WindowEventMap)[] = ['pointerdown', 'touchstart', 'mousedown', 'keydown'];
  events.forEach(evt =>
    window.addEventListener(evt, unlockAudio, { once: true, capture: true, passive: true })
  );
}
if (typeof window !== 'undefined') installUnlockListeners();
// ---------------------------------------------------------------------

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
  // Drop any queued autoplay-blocked playback — the caller's intent
  // (e.g. muting, navigating away, or a fresh speak() request) supersedes
  // whatever was waiting for the user's first tap.
  pendingPlayback = null;
  if (currentlyPlaying) {
    currentlyPlaying.pause();
    currentlyPlaying.currentTime = 0;
    currentlyPlaying = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

type PlayResult = 'played' | 'blocked';

async function playOne(text: string): Promise<PlayResult> {
  const manifest = await loadManifest();
  const url = manifest ? resolveUrl(manifest, text) : null;

  if (!url) {
    speakViaTtsFallback(text);
    // SpeechSynthesisUtterance.onend isn't reachable from here, so wait
    // a duration roughly proportional to the text length.
    await new Promise<void>(res => setTimeout(res, Math.max(450, text.length * 70)));
    return 'played';
  }

  const el = getElement(url);
  try { el.currentTime = 0; } catch { /* iOS pre-load may throw; ignore */ }
  currentlyPlaying = el;

  return new Promise<PlayResult>((resolve) => {
    let settled = false;
    const finish = (result: PlayResult) => {
      if (settled) return;
      settled = true;
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('error', onError);
      resolve(result);
    };
    const onEnded = () => finish('played');
    const onError = () => finish('played');
    el.addEventListener('ended', onEnded);
    el.addEventListener('error', onError);
    el.play()
      .then(() => { audioUnlocked = true; })
      .catch(() => {
        if (!audioUnlocked) {
          finish('blocked');
        } else {
          // Audio API is unlocked but this specific play() failed
          // (e.g. transient network or codec issue). Use TTS fallback.
          speakViaTtsFallback(text);
          finish('played');
        }
      });
  });
}

async function playFromIndex(parts: string[], startIdx: number): Promise<void> {
  for (let i = startIdx; i < parts.length; i++) {
    const result = await playOne(parts[i]);
    if (result === 'blocked') {
      // Capture the rest of the sequence and resume it the moment the
      // user taps — `unlockAudio()` invokes pendingPlayback for us.
      const remaining = parts.slice(i);
      pendingPlayback = () => { void playFromIndex(remaining, 0); };
      return;
    }
  }
}

export async function playAudio(text: string): Promise<void> {
  if (!text || typeof window === 'undefined') return;
  cancelAudio();
  await playFromIndex([text], 0);
}

/**
 * Speak a sequence of text fragments back-to-back. Each fragment is
 * looked up in the manifest independently — pre-rendered Azure audio
 * for static parts ("Hej ", "! Jag heter ", ". Hjälp mig rädda öarna!"),
 * TTS fallback only for the dynamic pieces (custom user/dragon names)
 * that can't be pre-rendered. This keeps the warm Sofie voice for the
 * vast majority of every utterance.
 */
export async function playAudioSequence(parts: string[]): Promise<void> {
  if (typeof window === 'undefined') return;
  const cleaned = parts.map(p => (p ?? '').toString()).filter(p => p.trim().length > 0);
  if (cleaned.length === 0) return;
  cancelAudio();
  await playFromIndex(cleaned, 0);
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
