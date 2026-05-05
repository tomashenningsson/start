'use client';

export type RewardCategory = 'hat' | 'wings' | 'body' | 'accessory';

export interface RewardDef {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  cat: RewardCategory;
  unlockedBy: number; // level number that grants this reward, 0 = special / always available
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
  // Niva 13 — Tidsstranden
  { id: 'farg-soluppgang', label: 'Soluppgång', emoji: '🌅', desc: 'Färg som soluppgång', cat: 'body', unlockedBy: 13 },
  { id: 'manhatt', label: 'Mångloria', emoji: '🌙', desc: 'Glödande månkrans', cat: 'hat', unlockedBy: 13 },
  // Niva 14 — Musikdjungeln
  { id: 'horlurar', label: 'DJ-hörlurar', emoji: '🎧', desc: 'Tjusiga hörlurar', cat: 'accessory', unlockedBy: 14 },
  { id: 'djungelvingar', label: 'Djungelvingar', emoji: '🌴', desc: 'Lummiga djungelvingar', cat: 'wings', unlockedBy: 14 },
  // Niva 15 — Mat- & Hälsobyn
  { id: 'kockmossa', label: 'Kockmössa', emoji: '👨‍🍳', desc: 'Vit kockmössa', cat: 'hat', unlockedBy: 15 },
  { id: 'applehalsband', label: 'Äpplehalsband', emoji: '🍎', desc: 'Friskt äpple runt halsen', cat: 'accessory', unlockedBy: 15 },
  // Niva 16 — Fordonsstaden
  { id: 'racerhjalm', label: 'Racerhjälm', emoji: '🏎️', desc: 'Snabb racerhjälm', cat: 'hat', unlockedBy: 16 },
  { id: 'turbovingar', label: 'Turbovingar', emoji: '🚀', desc: 'Vingar med raketkraft', cat: 'wings', unlockedBy: 16 },
  // Niva 17 — Mönsterpalatset
  { id: 'monsterkrona', label: 'Mönsterkrona', emoji: '💠', desc: 'Krona av mönster', cat: 'hat', unlockedBy: 17 },
  { id: 'farg-kamelont', label: 'Kameleontfärg', emoji: '🦎', desc: 'Färgskiftande hud', cat: 'body', unlockedBy: 17 },
  // Niva 18 — Stjärnräkningens Himmel
  { id: 'stjarnvingar', label: 'Stjärnvingar', emoji: '🌟', desc: 'Vingar av stjärnstoft', cat: 'wings', unlockedBy: 18 },
  { id: 'kometsvans', label: 'Kometsvans', emoji: '☄️', desc: 'Glödande kometsvans', cat: 'accessory', unlockedBy: 18 },
];

export const REWARD_BY_ID: Record<string, RewardDef> = REWARDS_CATALOG.reduce(
  (acc, r) => {
    acc[r.id] = r;
    return acc;
  },
  {} as Record<string, RewardDef>
);

// The legendary final reward for completing all 18 islands.
export const RAINBOW_DRAGON_REWARD: RewardDef = {
  id: 'farg-magimastare',
  label: 'Regnbågsdraken',
  emoji: '🌈',
  desc: 'Förvandling till regnbågsdraken — bara för Magimästare!',
  cat: 'body',
  unlockedBy: 0,
};

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
  // Player customization
  playerName: string;
  dragonName: string;
  // Final reward / Magimästare title
  isMagimastare: boolean;
  // Daily rewards
  lastDailyClaim: string | null; // YYYY-MM-DD
  dailyStreak: number;
  // Mini-game best scores
  miniGameScores: Record<string, number>;
}

const KEY = 'sifferdraken_v1';
export const TOTAL_LEVELS = 18;

export const DEFAULT_DRAKEN: DrakenProgress = {
  completedLevels: [],
  stars: {},
  unlockedNumbers: [],
  unlockedLetters: [],
  unlockedRewards: [],
  equipped: {},
  totalStars: 0,
  playerName: '',
  dragonName: 'Glittra',
  isMagimastare: false,
  lastDailyClaim: null,
  dailyStreak: 0,
  miniGameScores: {},
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
      playerName: parsed.playerName ?? '',
      dragonName: parsed.dragonName ?? 'Glittra',
      isMagimastare: parsed.isMagimastare ?? false,
      lastDailyClaim: parsed.lastDailyClaim ?? null,
      dailyStreak: parsed.dailyStreak ?? 0,
      miniGameScores: parsed.miniGameScores ?? {},
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
  let merged = Array.from(new Set([...p.unlockedRewards, ...eligible]));

  // If all levels complete, also unlock the legendary rainbow dragon
  let isMagimastare = p.isMagimastare;
  if (isAllLevelsComplete(p)) {
    if (!merged.includes(RAINBOW_DRAGON_REWARD.id)) {
      merged = [...merged, RAINBOW_DRAGON_REWARD.id];
    }
    isMagimastare = true;
  }

  if (merged.length === p.unlockedRewards.length && isMagimastare === p.isMagimastare) return p;
  const next = { ...p, unlockedRewards: merged, isMagimastare };
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
  const def = id === RAINBOW_DRAGON_REWARD.id ? RAINBOW_DRAGON_REWARD : REWARD_BY_ID[id];
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

export function setPlayerName(name: string): DrakenProgress {
  const cur = loadDraken();
  const next = { ...cur, playerName: name.slice(0, 20) };
  saveDraken(next);
  return next;
}

export function setDragonName(name: string): DrakenProgress {
  const cur = loadDraken();
  const trimmed = name.trim().slice(0, 20);
  const next = { ...cur, dragonName: trimmed.length > 0 ? trimmed : 'Glittra' };
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

// ---------- Daily reward system ----------

export interface DailyReward {
  day: number; // 1-7 within the streak cycle
  stars: number;
  emoji: string;
  label: string;
}

export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, stars: 1, emoji: '⭐', label: 'En stjärna' },
  { day: 2, stars: 1, emoji: '🌟', label: 'En stjärna till' },
  { day: 3, stars: 2, emoji: '✨', label: 'Två stjärnor' },
  { day: 4, stars: 2, emoji: '💫', label: 'Två glittriga stjärnor' },
  { day: 5, stars: 3, emoji: '🌠', label: 'Stjärnregn' },
  { day: 6, stars: 3, emoji: '🪄', label: 'Magisk stjärnpåse' },
  { day: 7, stars: 5, emoji: '🏆', label: 'Veckopokal' },
];

function todayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function canClaimDaily(progress: DrakenProgress): boolean {
  return progress.lastDailyClaim !== todayStr();
}

export function nextDailyReward(progress: DrakenProgress): DailyReward {
  const today = todayStr();
  const yesterday = yesterdayStr();
  let nextDay: number;
  if (progress.lastDailyClaim === today) {
    nextDay = ((progress.dailyStreak - 1 + 7) % 7) + 1;
  } else if (progress.lastDailyClaim === yesterday) {
    nextDay = (progress.dailyStreak % 7) + 1;
  } else {
    nextDay = 1;
  }
  return DAILY_REWARDS[nextDay - 1];
}

export function claimDaily(progress: DrakenProgress): { progress: DrakenProgress; reward: DailyReward | null } {
  const today = todayStr();
  if (progress.lastDailyClaim === today) {
    return { progress, reward: null };
  }
  const reward = nextDailyReward(progress);
  const yesterday = yesterdayStr();
  const newStreak = progress.lastDailyClaim === yesterday ? progress.dailyStreak + 1 : 1;
  const next: DrakenProgress = {
    ...progress,
    lastDailyClaim: today,
    dailyStreak: newStreak,
    totalStars: progress.totalStars + reward.stars,
  };
  saveDraken(next);
  return { progress: next, reward };
}

// ---------- Mini-game best scores ----------

export function recordMiniGameScore(id: string, score: number): DrakenProgress {
  const cur = loadDraken();
  const prev = cur.miniGameScores[id] ?? 0;
  if (score <= prev) return cur;
  const next = { ...cur, miniGameScores: { ...cur.miniGameScores, [id]: score } };
  saveDraken(next);
  return next;
}
