'use client';

export type RewardCategory = 'hat' | 'wings' | 'body' | 'accessory';

export interface RewardDef {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  cat: RewardCategory;
  unlockedBy: number; // level number that grants this reward
}

// Each level grants 2 specific rewards on first completion.
export const REWARDS_CATALOG: RewardDef[] = [
  // Niva 1 — Ballongängen
  { id: 'hatt', label: 'Trollhatt', emoji: '🎩', desc: 'En magisk hatt', cat: 'hat', unlockedBy: 1 },
  { id: 'svans', label: 'Stjärnsvans', emoji: '⭐', desc: 'En stjärna på svansen', cat: 'accessory', unlockedBy: 1 },
  // Niva 2 — Bokstavsskogen
  { id: 'blomkrans', label: 'Blomkrans', emoji: '🌸', desc: 'Blommor på huvudet', cat: 'hat', unlockedBy: 2 },
  { id: 'halsband', label: 'Hjärthalsband', emoji: '💖', desc: 'Litet hjärta runt halsen', cat: 'accessory', unlockedBy: 2 },
  // Niva 3 — Räknefloden
  { id: 'vingar', label: 'Glittervingar', emoji: '🪽', desc: 'Glittrande vingar', cat: 'wings', unlockedBy: 3 },
  { id: 'glasogon', label: 'Coola glasögon', emoji: '🕶️', desc: 'Solglasögon för draken', cat: 'accessory', unlockedBy: 3 },
  // Niva 4 — Formgrottan
  { id: 'farg-regnbage', label: 'Regnbåge', emoji: '🌈', desc: 'Regnbågsfärg', cat: 'body', unlockedBy: 4 },
  { id: 'fluga', label: 'Stilig fluga', emoji: '🎀', desc: 'Snygg fluga på halsen', cat: 'accessory', unlockedBy: 4 },
  // Niva 5 — Bokstavsberget
  { id: 'krona', label: 'Glittrande krona', emoji: '👑', desc: 'En kunglig krona', cat: 'hat', unlockedBy: 5 },
  { id: 'halsduk', label: 'Mysig halsduk', emoji: '🧣', desc: 'Varm och mjuk halsduk', cat: 'accessory', unlockedBy: 5 },
  // Niva 6 — Drakslottet
  { id: 'regnvingar', label: 'Regnbågsvingar', emoji: '🌈', desc: 'Vingar i alla färger', cat: 'wings', unlockedBy: 6 },
  { id: 'farg-guld', label: 'Guldfärg', emoji: '✨', desc: 'Glittrar i guld', cat: 'body', unlockedBy: 6 },
  // Niva 7 — Färgön
  { id: 'farg-isbla', label: 'Isblå färg', emoji: '🧊', desc: 'Sval iskall blå', cat: 'body', unlockedBy: 7 },
  { id: 'isvingar', label: 'Isvingar', emoji: '❄️', desc: 'Frusna kristallvingar', cat: 'wings', unlockedBy: 7 },
  // Niva 8 — Mönstergården
  { id: 'partyhatt', label: 'Partyhatt', emoji: '🥳', desc: 'Roligt på fest', cat: 'hat', unlockedBy: 8 },
  { id: 'farg-rosa', label: 'Rosa shimmer', emoji: '💗', desc: 'Mjukt rosa skimmer', cat: 'body', unlockedBy: 8 },
  // Niva 9 — Stora-Lilla Stranden
  { id: 'keps', label: 'Cool keps', emoji: '🧢', desc: 'Bakåtvänd keps', cat: 'hat', unlockedBy: 9 },
  { id: 'fagelvingar', label: 'Fågelvingar', emoji: '🐦', desc: 'Riktiga fågelvingar', cat: 'wings', unlockedBy: 9 },
  // Niva 10 — Memoryskogen
  { id: 'magikerhatt', label: 'Magikerhatt', emoji: '🧙', desc: 'Trollkarlens hatt', cat: 'hat', unlockedBy: 10 },
  { id: 'klocka', label: 'Smart klocka', emoji: '⌚', desc: 'Liten klocka på handen', cat: 'accessory', unlockedBy: 10 },
  // Niva 11 — Plus-Plutten
  { id: 'fjarilsvingar', label: 'Fjärilsvingar', emoji: '🦋', desc: 'Mjuka fjärilsvingar', cat: 'wings', unlockedBy: 11 },
  { id: 'farg-skog', label: 'Skogsgrön', emoji: '🌿', desc: 'Mörk skogsgrön färg', cat: 'body', unlockedBy: 11 },
  // Niva 12 — Motsatsernas Bro
  { id: 'eldvingar', label: 'Eldvingar', emoji: '🔥', desc: 'Vingar av eld', cat: 'wings', unlockedBy: 12 },
  { id: 'farg-neon', label: 'Neonlila', emoji: '💜', desc: 'Lysande neonfärg', cat: 'body', unlockedBy: 12 },
];

export const REWARD_BY_ID: Record<string, RewardDef> = REWARDS_CATALOG.reduce(
  (acc, r) => {
    acc[r.id] = r;
    return acc;
  },
  {} as Record<string, RewardDef>
);

export function rewardsForLevel(level: number): RewardDef[] {
  return REWARDS_CATALOG.filter(r => r.unlockedBy === level);
}

export interface Equipped {
  hat?: string;
  wings?: string;
  body?: string;
  accessory?: string;
}

export interface DrakenProgress {
  completedLevels: number[];
  stars: Record<number, number>;
  unlockedNumbers: number[];
  unlockedLetters: string[];
  unlockedRewards: string[];
  equipped: Equipped;
  totalStars: number;
}

const KEY = 'sifferdraken_v1';
export const TOTAL_LEVELS = 12;

export const DEFAULT_DRAKEN: DrakenProgress = {
  completedLevels: [],
  stars: {},
  unlockedNumbers: [],
  unlockedLetters: [],
  unlockedRewards: [],
  equipped: {},
  totalStars: 0,
};

interface LegacyShape extends Partial<DrakenProgress> {
  reward?: string | null;
}

export function loadDraken(): DrakenProgress {
  if (typeof window === 'undefined') return DEFAULT_DRAKEN;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_DRAKEN;
    const parsed = JSON.parse(raw) as LegacyShape;

    let unlockedRewards = parsed.unlockedRewards ?? [];
    let equipped: Equipped = parsed.equipped ?? {};
    if (parsed.reward && unlockedRewards.length === 0) {
      const def = REWARD_BY_ID[parsed.reward];
      if (def) {
        unlockedRewards = [parsed.reward];
        if (!equipped[def.cat]) equipped = { ...equipped, [def.cat]: parsed.reward };
      }
    }

    return {
      ...DEFAULT_DRAKEN,
      ...parsed,
      stars: parsed.stars ?? {},
      completedLevels: parsed.completedLevels ?? [],
      unlockedNumbers: parsed.unlockedNumbers ?? [],
      unlockedLetters: parsed.unlockedLetters ?? [],
      unlockedRewards,
      equipped,
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

// Auto-grant rewards for every completed level. Existing unlocked rewards stay.
export function syncRewards(p: DrakenProgress): DrakenProgress {
  const eligible = REWARDS_CATALOG.filter(r => p.completedLevels.includes(r.unlockedBy)).map(r => r.id);
  const merged = Array.from(new Set([...p.unlockedRewards, ...eligible]));
  if (merged.length === p.unlockedRewards.length) return p;
  const next = { ...p, unlockedRewards: merged };
  saveDraken(next);
  return next;
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
  let next: DrakenProgress = {
    ...cur,
    completedLevels,
    stars: newStars,
    totalStars,
  };
  next = syncRewards(next);
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

// One item equipped per category at a time. Tap again to remove.
export function toggleEquip(id: string): DrakenProgress {
  const def = REWARD_BY_ID[id];
  const cur = loadDraken();
  if (!def || !cur.unlockedRewards.includes(id)) return cur;
  const equipped: Equipped = { ...cur.equipped };
  if (equipped[def.cat] === id) {
    delete equipped[def.cat];
  } else {
    equipped[def.cat] = id;
  }
  const next = { ...cur, equipped };
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
