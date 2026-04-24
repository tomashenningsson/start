'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

interface SoundState {
  muted: boolean;
  toggleMute: () => void;
}

const SoundContext = createContext<SoundState>({ muted: false, toggleMute: () => {} });

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(localStorage.getItem('soundMuted') === 'true');
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev;
      localStorage.setItem('soundMuted', String(next));
      if (next && typeof window !== 'undefined') {
        window.speechSynthesis?.cancel();
      }
      return next;
    });
  }, []);

  return (
    <SoundContext.Provider value={{ muted, toggleMute }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  return useContext(SoundContext);
}
