'use client';

import { useState, useEffect, useCallback } from 'react';

interface Progress {
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

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(DEFAULT);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setProgress(JSON.parse(saved));
    } catch {}
  }, []);

  const persist = useCallback((next: Progress) => {
    setProgress(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const learnLetter = useCallback((letter: string) => {
    setProgress(prev => {
      if (prev.learnedLetters.includes(letter)) return prev;
      const next = {
        ...prev,
        learnedLetters: [...prev.learnedLetters, letter],
        totalStars: prev.totalStars + 1,
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const learnNumber = useCallback((num: number) => {
    setProgress(prev => {
      if (prev.learnedNumbers.includes(num)) return prev;
      const next = {
        ...prev,
        learnedNumbers: [...prev.learnedNumbers, num],
        totalStars: prev.totalStars + 1,
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const completeWord = useCallback((word: string) => {
    setProgress(prev => {
      if (prev.completedWords.includes(word)) return prev;
      const next = {
        ...prev,
        completedWords: [...prev.completedWords, word],
        totalStars: prev.totalStars + 3,
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const updateMathScore = useCallback((score: number) => {
    setProgress(prev => {
      if (score <= prev.mathHighScore) return prev;
      const bonusStars = Math.floor(score / 5) - Math.floor(prev.mathHighScore / 5);
      const next = {
        ...prev,
        mathHighScore: score,
        totalStars: prev.totalStars + Math.max(0, bonusStars),
      };
      persist(next);
      return next;
    });
  }, [persist]);

  return { progress, learnLetter, learnNumber, completeWord, updateMathScore };
}
