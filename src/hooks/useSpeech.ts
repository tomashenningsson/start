'use client';

import { useCallback } from 'react';

export function useSpeech() {
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const doSpeak = () => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'sv-SE';
      utterance.rate = 0.88;
      utterance.pitch = 1.1;
      const voices = window.speechSynthesis.getVoices();
      const svVoice = voices.find(v => v.lang.startsWith('sv'));
      if (svVoice) utterance.voice = svVoice;
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      doSpeak();
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true });
    }
  }, []);

  return { speak };
}
