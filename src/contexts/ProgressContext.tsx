'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import { useKidsAuth } from './KidsAuthContext';

type KidProgressRow = Database['public']['Tables']['kid_progress']['Row'];

export interface Progress {
  learnedLetters: string[];
  learnedNumbers: number[];
  completedWords: string[];
  mathHighScore: number;
  totalStars: number;
}

const DEFAULT: Progress = {
  learnedLetters: [],
  learnedNumbers: [],
  completedWords: [],
  mathHighScore: 0,
  totalStars: 0,
};

const STORAGE_KEY = 'learningAppProgress_v1';

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function mergeProgress(a: Progress, b: Progress): Progress {
  return {
    learnedLetters: unique([...a.learnedLetters, ...b.learnedLetters]),
    learnedNumbers: unique([...a.learnedNumbers, ...b.learnedNumbers]),
    completedWords: unique([...a.completedWords, ...b.completedWords]),
    mathHighScore: Math.max(a.mathHighScore, b.mathHighScore),
    totalStars: Math.max(a.totalStars, b.totalStars),
  };
}

function readLocal(): Progress {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return DEFAULT;
}

function writeLocal(p: Progress) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
}

interface ProgressContextType {
  progress: Progress;
  learnLetter: (letter: string) => void;
  learnNumber: (num: number) => void;
  completeWord: (word: string) => void;
  updateMathScore: (score: number) => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(DEFAULT);
  const { user } = useKidsAuth();
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRef = useRef(user);
  userRef.current = user;

  // Load local progress on mount
  useEffect(() => {
    setProgress(readLocal());
  }, []);

  // When user logs in, fetch from Supabase and merge
  useEffect(() => {
    if (!user || !supabase) return;
    supabase
      .from('kid_progress')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const row = data as KidProgressRow;
        const remote: Progress = {
          learnedLetters: row.learned_letters ?? [],
          learnedNumbers: row.learned_numbers ?? [],
          completedWords: row.completed_words ?? [],
          mathHighScore: row.math_high_score ?? 0,
          totalStars: row.total_stars ?? 0,
        };
        setProgress(prev => {
          const merged = mergeProgress(prev, remote);
          writeLocal(merged);
          return merged;
        });
      });
  }, [user]);

  const pushToSupabase = useCallback((p: Progress) => {
    const uid = userRef.current?.id;
    const sb = supabase;
    if (!uid || !sb) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      await sb.from('kid_progress').upsert(
        {
          user_id: uid,
          learned_letters: p.learnedLetters,
          learned_numbers: p.learnedNumbers,
          completed_words: p.completedWords,
          math_high_score: p.mathHighScore,
          total_stars: p.totalStars,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
    }, 2000);
  }, []);

  const apply = useCallback((next: Progress) => {
    setProgress(next);
    writeLocal(next);
    pushToSupabase(next);
  }, [pushToSupabase]);

  const learnLetter = useCallback((letter: string) => {
    setProgress(prev => {
      if (prev.learnedLetters.includes(letter)) return prev;
      const next = { ...prev, learnedLetters: [...prev.learnedLetters, letter], totalStars: prev.totalStars + 1 };
      writeLocal(next); pushToSupabase(next);
      return next;
    });
  }, [pushToSupabase]);

  const learnNumber = useCallback((num: number) => {
    setProgress(prev => {
      if (prev.learnedNumbers.includes(num)) return prev;
      const next = { ...prev, learnedNumbers: [...prev.learnedNumbers, num], totalStars: prev.totalStars + 1 };
      writeLocal(next); pushToSupabase(next);
      return next;
    });
  }, [pushToSupabase]);

  const completeWord = useCallback((word: string) => {
    setProgress(prev => {
      if (prev.completedWords.includes(word)) return prev;
      const next = { ...prev, completedWords: [...prev.completedWords, word], totalStars: prev.totalStars + 3 };
      writeLocal(next); pushToSupabase(next);
      return next;
    });
  }, [pushToSupabase]);

  const updateMathScore = useCallback((score: number) => {
    setProgress(prev => {
      if (score <= prev.mathHighScore) return prev;
      const bonus = Math.max(0, Math.floor(score / 5) - Math.floor(prev.mathHighScore / 5));
      const next = { ...prev, mathHighScore: score, totalStars: prev.totalStars + bonus };
      writeLocal(next); pushToSupabase(next);
      return next;
    });
  }, [pushToSupabase]);

  // Suppress unused warning — apply is kept for future use
  void apply;

  return (
    <ProgressContext.Provider value={{ progress, learnLetter, learnNumber, completeWord, updateMathScore }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgressContext() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgressContext must be inside ProgressProvider');
  return ctx;
}
