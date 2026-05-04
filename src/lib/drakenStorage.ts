'use client';

export type RewardCategory = 'hat' | 'wings' | 'body' | 'accessory';

export interface RewardDef {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  cat: RewardCategory;
  cost: number;
}

// Catalog ordered roughly by cost. With max 18 stars from one perfect playthrough
// the player can in time unlock everything by replaying levels and improving stars.
export const REWARDS_CATALOG: RewardDef[] = [
  // First-victory tier (free)
  { id: 'hatt', label: 'Trollhatt', emoji: '🎩', desc: 'En magisk hatt', cat: 'hat', cost: 0 },
  { id: 'vingar', label: 'Glittervingar', emoji: '🪽', desc: 'Glittrande vingar', cat: 'wings', cost: 0 },
  { id: 'farg-regnbage', label: 'Regnbåge', emoji: '🌈', desc: 'Regnbågsfärg', cat: 'body', cost: 0 },
  { id: 'svans', label: 'Stjärnsvans', emoji: '⭐', desc: 'En stjärna på svansen', cat: 'accessory', cost: 0 },
  // Tier 1
  { id: 'krona', label: 'Glittrande krona', emoji: '👑', desc: 'En kunglig krona', cat: 'hat', cost: 6 },
  { id: 'glasogon', label: 'Coola glasögon', emoji: '🕶️', desc: 'Solglasögon för draken', cat: 'accessory', cost: 7 },
  { id: 'fjarilsvingar', label: 'Fjärilsvingar', emoji: '🦋', desc: 'Mjuka fjärilsvingar', cat: 'wings', cost: 8 },
  // Tier 2
  { id: 'blomkrans', label: 'Blomkrans', emoji: '🌸', desc: 'Blommor på huvudet', cat: 'hat', cost: 10 },
  { id: 'farg-guld', label: 'Guldfärg', emoji: '✨', desc: 'Glittrar i guld', cat: 'body', cost: 12 },
  { id: 'halsband', label: 'Hjärthalsband', emoji: '💖', desc: 'Litet hjärta runt halsen', cat: 'accessory', cost: 13 },
  // Tier 3
  { id: 'eldvingar', label: 'Eldvingar', emoji: '🔥', desc: 'Vingar av eld', cat: 'wings', cost: 15 },
  { id: 'keps', label: 'Cool keps', emoji: '🧢', desc: 'Bakåtvänd keps', cat: 'hat', cost: 16 },
  { id: 'farg-rosa', label: 'Rosa shimmer', emoji: '💗', desc: 'Mjukt rosa skimmer', cat: 'body', cost: 18 },
];

export const REWARD_BY_ID: Record<string, RewardDef> = REWARDS_CATALOG.reduce(
  (acc, r) => {
    acc[r.id] = r;
    return acc;
  },
  {} as Record<string, RewardDef>
);

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
export const TOTAL_LEVELS = 6;

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

    // Migrate from old single-reward shape
    let unlockedRewards = parsed.unlockedRewards ?? [];
    let equipped: Equipped = parsed.equipped ?? {};
    if (parsed.reward && unlockedRewards.length === 0) {
      const oldId = parsed.reward;
      const def = REWARD_BY_ID[oldId];
      if (def) {
        unlockedRewards = [oldId];
        if (!equipped[def.cat]) equipped = { ...equipped, [def.cat]: oldId };
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

// Auto-grant any rewards the player qualifies for based on their stars.
// Existing unlocked rewards are kept (cumulative — they never disappear).
export function syncRewards(p: DrakenProgress): DrakenProgress {
  // Only grant once at least the first level is done — otherwise opening the
  // map shouldn't pre-fill the wardrobe.
  if (p.completedLevels.length === 0) return p;
  const eligible = REWARDS_CATALOG.filter(r => p.totalStars >= r.cost).map(r => r.id);
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

// Toggle equipping a reward. One item can be equipped per category at a time.
// Tapping the equipped item again removes it.
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
