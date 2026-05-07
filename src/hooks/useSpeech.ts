'use client';

import { useCallback, useEffect } from 'react';
import { useSound } from '@/contexts/SoundContext';
import {
  cancelAudio,
  playAudio,
  playAudioSequence,
  prewarmAudio,
} from '@/lib/audio/audioPlayer';

/**
 * Speak Swedish text using the pre-rendered Azure Neural Speech MP3s.
 *
 * Looks the text up in /audio/manifest.json. If a matching MP3 exists
 * (the common case — the catalog covers every utterance the games
 * produce), it plays the warm Sofie voice. Otherwise it falls back to
 * window.speechSynthesis so new strings still get spoken until the
 * generation pipeline is re-run.
 */
export function useSpeech() {
  const { muted } = useSound();

  // Warm the manifest on first mount so the first tap is instant.
  useEffect(() => { prewarmAudio(); }, []);

  const speak = useCallback((text: string) => {
    if (muted) return;
    if (!text) return;
    void playAudio(text);
  }, [muted]);

  /**
   * Speak a sequence of fragments back-to-back. Pass static phrases as
   * separate items so each one can hit the Azure-rendered MP3 cache,
   * with dynamic pieces (player or dragon names) interleaved between
   * them — those will fall back to TTS only if not pre-rendered.
   */
  const speakSequence = useCallback((parts: string[]) => {
    if (muted) return;
    if (!parts || parts.length === 0) return;
    void playAudioSequence(parts);
  }, [muted]);

  const cancel = useCallback(() => { cancelAudio(); }, []);

  return { speak, speakSequence, cancel };
}
