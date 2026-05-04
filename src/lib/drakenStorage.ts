'use client';

export type DrakenReward = 'hatt' | 'vingar' | 'farg' | 'svans';

export interface DrakenProgress {
  completedLevels: number[];
  stars: Record<number, number>;
  unlockedNumbers: number[];
  unlockedLetters: string[];
  reward: DrakenReward | null;
  totalStars: number;
}

const KEY = 'sifferdraken_v1';

export const TOTAL_LEVELS = 6;

export const DEFAULT_DRAKEN: DrakenProgress = {
  completedLevels: [],
  stars: {},
  unlockedNumbers: [],
  unlockedLetters: [],
  reward: null,
  totalStars: 0,
};

export function loadDraken(): DrakenProgress {
  if (typeof window === 'undefined') return DEFAULT_DRAKEN;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_DRAKEN;
    const parsed = JSON.parse(raw) as Partial<DrakenProgress>;
    return {
      ...DEFAULT_DRAKEN,
      ...parsed,
      stars: parsed.stars ?? {},
      completedLevels: parsed.completedLevels ?? [],
      unlockedNumbers: parsed.unlockedNumbers ?? [],
      unlockedLetters: parsed.unlockedLetters ?? [],
    };
  } catch {
    return DEFAULT_DRAKEN;
  }
}

export function saveDraken(p: DrakenProgress) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}

export function completeLevel(level: number, stars: number): DrakenProgress {
  const cur = loadDraken();
  const completedLevels = cur.completedLevels.includes(level)
    ? cur.completedLevels
    : [...cur.completedLevels, level];
  const prevStars = cur.stars[level] ?? 0;
  const bestStars = Math.max(prevStars, stars);
  const newStars: Record<number, number> = { ...cur.stars, [level]: bestStars };
  const totalStars = Object.values(newStars).reduce((a, b) => a + b, 0);
  const next: DrakenProgress = {
    ...cur,
    completedLevels,
    stars: newStars,
    totalStars,
  };
  saveDraken(next);
  return next;
}

export function unlockNumber(num: number) {
  const cur = loadDraken();
  if (cur.unlockedNumbers.includes(num)) return cur;
  const next = { ...cur, unlockedNumbers: [...cur.unlockedNumbers, num].sort((a, b) => a - b) };
  saveDraken(next);
  return next;
}

export function unlockLetter(letter: string) {
  const cur = loadDraken();
  if (cur.unlockedLetters.includes(letter)) return cur;
  const next = { ...cur, unlockedLetters: [...cur.unlockedLetters, letter] };
  saveDraken(next);
  return next;
}

export function setReward(reward: DrakenReward): DrakenProgress {
  const cur = loadDraken();
  const next = { ...cur, reward };
  saveDraken(next);
  return next;
}

export function resetDraken() {
  saveDraken(DEFAULT_DRAKEN);
}

export function isLevelUnlocked(level: number, progress: DrakenProgress): boolean {
  if (level === 1) return true;
  return progress.completedLevels.includes(level - 1);
}

export function isAllLevelsComplete(progress: DrakenProgress): boolean {
  return progress.completedLevels.length >= TOTAL_LEVELS;
}
