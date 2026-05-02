'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, X } from 'lucide-react';
import { useSpeech } from '@/hooks/useSpeech';
import { useProgress } from '@/hooks/useProgress';
import { useSound } from '@/contexts/SoundContext';

// ─── Types ───────────────────────────────────────────────────────────────────

type Difficulty = 'liten' | 'mellan' | 'master';
type Theme = 'pirat' | 'djungel' | 'rymd' | 'tempel';
type Screen = 'menu' | 'map' | 'mission' | 'boss' | 'victory';

type PuzzleKind =
  | 'count'      // count objects
  | 'recognize'  // recognize a digit
  | 'plus'       // a + b
  | 'minus'      // a - b
  | 'sequence'   // missing in pattern
  | 'compare'    // largest of three
  | 'multiply';  // simple multiplication / skip counting

interface Station {
  id: number;
  name: string;
  emoji: string;
  kind: PuzzleKind;
  hint: string;
  pos: { x: number; y: number };
}

interface Puzzle {
  prompt: string;
  display: string;
  options: number[];
  answer: number;
  voice: string;
}

interface SaveState {
  difficulty: Difficulty;
  theme: Theme;
  stationsDone: number[];
  bossDone: boolean;
  coins: number;
  keys: number;
  runs: number;
}

// ─── Stations layout (fixed positions on the map) ───────────────────────────

const STATIONS: Station[] = [
  { id: 0, name: 'Stranden',         emoji: '🏝️', kind: 'count',     hint: 'Räkna föremålen!',          pos: { x: 14, y: 82 } },
  { id: 1, name: 'Hemliga dörren',   emoji: '🚪', kind: 'recognize', hint: 'Hitta rätt siffra!',        pos: { x: 30, y: 64 } },
  { id: 2, name: 'Krokodilfloden',   emoji: '🐊', kind: 'plus',      hint: 'Bygg bron med plus!',       pos: { x: 50, y: 78 } },
  { id: 3, name: 'Berget',           emoji: '⛰️', kind: 'minus',     hint: 'Spräng stenen med minus!',  pos: { x: 68, y: 58 } },
  { id: 4, name: 'Magiska cirkeln',  emoji: '🌀', kind: 'sequence',  hint: 'Vilken siffra fattas?',     pos: { x: 50, y: 42 } },
  { id: 5, name: 'Skattvågen',       emoji: '⚖️', kind: 'compare',   hint: 'Välj den största kistan!',  pos: { x: 28, y: 28 } },
  { id: 6, name: 'Ormgården',        emoji: '🐍', kind: 'multiply',  hint: 'Räkna i grupper!',          pos: { x: 56, y: 18 } },
];

const BOSS = { emoji: '💎', name: 'Skattkistan', pos: { x: 82, y: 14 } };

// ─── Themes ─────────────────────────────────────────────────────────────────

const THEMES: Record<Theme, {
  label: string;
  hero: string;
  emoji: string;
  bgGradient: string;
  pathColor: string;
  mapBg: string;
  treasure: string;
  intro: string;
}> = {
  pirat: {
    label: 'Pirat',
    hero: '🏴‍☠️',
    emoji: '⚓',
    bgGradient: 'linear-gradient(160deg, #001a2e 0%, #003355 25%, #5a3a18 55%, #7a2a18 80%, #1a0010 100%)',
    pathColor: '#fbbf24',
    mapBg: 'radial-gradient(ellipse at center, #c69b6d 0%, #8b6740 55%, #4a3320 100%)',
    treasure: '💰',
    intro: 'En gammal piratkarta visar vägen till skatten...',
  },
  djungel: {
    label: 'Djungel',
    hero: '🦜',
    emoji: '🌴',
    bgGradient: 'linear-gradient(160deg, #001f0f 0%, #003820 25%, #2a5a18 55%, #5a4a10 80%, #001a08 100%)',
    pathColor: '#fde047',
    mapBg: 'radial-gradient(ellipse at center, #6b9b3d 0%, #4a7028 55%, #1f3a10 100%)',
    treasure: '🏆',
    intro: 'Djupt in i den vilda djungeln väntar äventyret...',
  },
  rymd: {
    label: 'Rymd',
    hero: '🚀',
    emoji: '🌌',
    bgGradient: 'linear-gradient(160deg, #050018 0%, #100040 25%, #2a0a55 55%, #4a1080 80%, #08000f 100%)',
    pathColor: '#67e8f9',
    mapBg: 'radial-gradient(ellipse at center, #2a1a5a 0%, #0f0a30 55%, #020010 100%)',
    treasure: '🛸',
    intro: 'Ute i kosmos finns ett mystiskt skattskepp att hitta...',
  },
  tempel: {
    label: 'Tempel',
    hero: '🗿',
    emoji: '🏛️',
    bgGradient: 'linear-gradient(160deg, #1a0f00 0%, #3a2410 25%, #6b4a1a 55%, #4a2010 80%, #100800 100%)',
    pathColor: '#fde047',
    mapBg: 'radial-gradient(ellipse at center, #b8965a 0%, #80603a 55%, #3a2a18 100%)',
    treasure: '🏺',
    intro: 'I det glömda templet ligger en uråldrig skatt och väntar...',
  },
};

// ─── Difficulty ─────────────────────────────────────────────────────────────

const DIFFICULTIES: Record<Difficulty, { label: string; age: string; numMax: number; subtitle: string }> = {
  liten:  { label: 'Liten skattjägare', age: '4–6 år',  numMax: 10, subtitle: 'Tal upp till 10' },
  mellan: { label: 'Skattjägare',       age: '6–8 år',  numMax: 20, subtitle: 'Tal upp till 20' },
  master: { label: 'Mästerpirat',       age: '8+ år',   numMax: 50, subtitle: 'Plus, minus & gångertal' },
};

// ─── Storage ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'skattjakt_save_v1';

function loadSave(): SaveState | null {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return null;
}

function saveSave(s: SaveState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

function clearSave() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

// ─── Puzzle generators ──────────────────────────────────────────────────────

const COUNT_EMOJIS: Record<Theme, string[]> = {
  pirat:   ['🪙', '💎', '⚓', '🦜', '🗝️', '🏴‍☠️'],
  djungel: ['🍌', '🥥', '🦋', '🐒', '🌺', '🐢'],
  rymd:    ['⭐', '🌟', '🪐', '☄️', '👽', '🛸'],
  tempel:  ['💠', '🪨', '📿', '🏺', '🗿', '🕯️'],
};

function rand(a: number, b: number) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function pickN<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

function shuffle<T>(arr: T[]): T[] {
  return pickN(arr, arr.length);
}

function buildOptions(answer: number, max: number, count = 4): number[] {
  const set = new Set<number>([answer]);
  let safety = 0;
  while (set.size < count && safety++ < 80) {
    const delta = rand(1, Math.max(2, Math.floor(max / 3)));
    const sign = Math.random() < 0.5 ? -1 : 1;
    const v = answer + sign * delta;
    if (v >= 0 && v <= max + 5 && v !== answer) set.add(v);
  }
  while (set.size < count) set.add(set.size + answer + 100);
  return shuffle(Array.from(set));
}

function generatePuzzle(kind: PuzzleKind, diff: Difficulty, theme: Theme): Puzzle {
  const max = DIFFICULTIES[diff].numMax;

  if (kind === 'count') {
    const emoji = pickN(COUNT_EMOJIS[theme], 1)[0];
    const n = rand(2, Math.min(max, diff === 'liten' ? 8 : 12));
    return {
      prompt: `Räkna ${emoji} och välj rätt siffra!`,
      display: emoji.repeat(n),
      options: buildOptions(n, max),
      answer: n,
      voice: `Hur många finns det?`,
    };
  }

  if (kind === 'recognize') {
    const target = rand(diff === 'liten' ? 1 : 2, max);
    return {
      prompt: 'Hitta rätt siffra för att låsa upp dörren!',
      display: `🔢 ${swedishWord(target)}`,
      options: buildOptions(target, max),
      answer: target,
      voice: `Tryck på siffran ${swedishWord(target)}`,
    };
  }

  if (kind === 'plus') {
    const cap = diff === 'liten' ? 6 : diff === 'mellan' ? 12 : 25;
    const a = rand(1, cap);
    const b = rand(1, cap);
    const ans = a + b;
    return {
      prompt: 'Bygg bron — lös tallet!',
      display: `${a} + ${b} = ?`,
      options: buildOptions(ans, max),
      answer: ans,
      voice: `Vad är ${a} plus ${b}?`,
    };
  }

  if (kind === 'minus') {
    const cap = diff === 'liten' ? 9 : diff === 'mellan' ? 18 : max;
    const a = rand(3, cap);
    const b = rand(1, a - 1);
    const ans = a - b;
    return {
      prompt: 'Spräng stenen — räkna ut!',
      display: `${a} − ${b} = ?`,
      options: buildOptions(ans, max),
      answer: ans,
      voice: `Vad är ${a} minus ${b}?`,
    };
  }

  if (kind === 'sequence') {
    const start = rand(1, Math.max(2, max - 6));
    const step = diff === 'master' ? rand(2, 3) : 1;
    const series = [start, start + step, start + 2 * step, start + 3 * step];
    const missingIdx = rand(1, 2);
    const ans = series[missingIdx];
    const display = series.map((v, i) => (i === missingIdx ? '❓' : String(v))).join('  ·  ');
    return {
      prompt: `Vilken siffra fattas i mönstret?`,
      display,
      options: buildOptions(ans, max),
      answer: ans,
      voice: `Vilket tal fattas i mönstret?`,
    };
  }

  if (kind === 'compare') {
    const cap = diff === 'liten' ? 10 : diff === 'mellan' ? 20 : 50;
    const set = new Set<number>();
    while (set.size < 3) set.add(rand(1, cap));
    const arr = Array.from(set);
    const ans = Math.max(...arr);
    return {
      prompt: 'Vilken kista har störst tal?',
      display: arr.map(n => `🟫${n}`).join('   '),
      options: arr,
      answer: ans,
      voice: `Vilket tal är störst?`,
    };
  }

  // multiply / skip-count
  if (diff === 'liten') {
    // skip counting: 2,4,?,8 or similar
    const step = rand(2, 3);
    const start = step;
    const series = [start, start * 2, start * 3, start * 4];
    const missingIdx = rand(1, 2);
    const ans = series[missingIdx];
    const display = series.map((v, i) => (i === missingIdx ? '❓' : String(v))).join('  ·  ');
    return {
      prompt: `Räkna ${step} i taget — vilken fattas?`,
      display,
      options: buildOptions(ans, max),
      answer: ans,
      voice: `Räkna ${step} i taget. Vilken siffra fattas?`,
    };
  }
  const cap = diff === 'mellan' ? 5 : 9;
  const a = rand(2, cap);
  const b = rand(2, cap);
  const ans = a * b;
  return {
    prompt: 'Räkna grupperna — gångertal!',
    display: `${a} × ${b} = ?`,
    options: buildOptions(ans, Math.max(max, 50)),
    answer: ans,
    voice: `Vad är ${a} gånger ${b}?`,
  };
}

function swedishWord(n: number): string {
  const words = ['noll','ett','två','tre','fyra','fem','sex','sju','åtta','nio','tio',
    'elva','tolv','tretton','fjorton','femton','sexton','sjutton','arton','nitton','tjugo'];
  if (n >= 0 && n < words.length) return words[n];
  return String(n);
}

// ─── Decorative star field for map ──────────────────────────────────────────

const SPARKLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: Math.random() * 4,
}));

// ─── Page ───────────────────────────────────────────────────────────────────

export default function SkattjaktPage() {
  const { speak } = useSpeech();
  const { progress, updateMathScore } = useProgress();
  const { muted } = useSound();

  const [screen, setScreen] = useState<Screen>('menu');
  const [theme, setTheme] = useState<Theme>('pirat');
  const [difficulty, setDifficulty] = useState<Difficulty>('liten');
  const [stationsDone, setStationsDone] = useState<number[]>([]);
  const [bossDone, setBossDone] = useState(false);
  const [coins, setCoins] = useState(0);
  const [keys, setKeys] = useState(0);
  const [runs, setRuns] = useState(0);
  const [activeStation, setActiveStation] = useState<Station | null>(null);
  const [hasSave, setHasSave] = useState(false);

  // Hydrate save state on mount
  useEffect(() => {
    const s = loadSave();
    if (s && (s.stationsDone.length > 0 || s.bossDone || s.coins > 0)) {
      setHasSave(true);
    }
  }, []);

  const persist = useCallback(
    (next: Partial<SaveState>) => {
      const merged: SaveState = {
        difficulty, theme, stationsDone, bossDone, coins, keys, runs,
        ...next,
      };
      saveSave(merged);
    },
    [difficulty, theme, stationsDone, bossDone, coins, keys, runs]
  );

  const startNew = (t: Theme, d: Difficulty) => {
    setTheme(t);
    setDifficulty(d);
    setStationsDone([]);
    setBossDone(false);
    setCoins(0);
    setKeys(0);
    setRuns(0);
    setHasSave(false);
    clearSave();
    setScreen('map');
  };

  const continueGame = () => {
    const s = loadSave();
    if (!s) return;
    setTheme(s.theme);
    setDifficulty(s.difficulty);
    setStationsDone(s.stationsDone);
    setBossDone(s.bossDone);
    setCoins(s.coins);
    setKeys(s.keys);
    setRuns(s.runs);
    setScreen('map');
  };

  const openStation = (st: Station) => {
    if (stationsDone.includes(st.id)) return;
    const nextAvailable = stationsDone.length;
    if (st.id !== nextAvailable) return; // only allow next in line
    setActiveStation(st);
    setScreen('mission');
  };

  const completeStation = (won: boolean, earnedCoins: number) => {
    if (!activeStation) return;
    if (won) {
      const newDone = [...stationsDone, activeStation.id];
      const newCoins = coins + earnedCoins;
      const newKeys = keys + 1;
      setStationsDone(newDone);
      setCoins(newCoins);
      setKeys(newKeys);
      saveSave({
        difficulty, theme,
        stationsDone: newDone, bossDone, coins: newCoins, keys: newKeys, runs: runs + 1,
      });
      setRuns(r => r + 1);
    } else {
      setRuns(r => r + 1);
      persist({ runs: runs + 1 });
    }
    setActiveStation(null);
    setScreen('map');
  };

  const startBoss = () => setScreen('boss');

  const completeBoss = () => {
    const reward = 30;
    const newCoins = coins + reward;
    setBossDone(true);
    setCoins(newCoins);
    saveSave({
      difficulty, theme,
      stationsDone, bossDone: true, coins: newCoins, keys, runs,
    });
    // Reward gives stars to global progress (5 stars per completion)
    const baseScore = 25 +
      (difficulty === 'mellan' ? 10 : difficulty === 'master' ? 25 : 0);
    if (baseScore + progress.mathHighScore > progress.mathHighScore) {
      updateMathScore(progress.mathHighScore + baseScore);
    }
    setScreen('victory');
  };

  const playAgain = () => {
    setStationsDone([]);
    setBossDone(false);
    setKeys(0);
    setRuns(0);
    clearSave();
    setScreen('map');
  };

  if (screen === 'menu') {
    return (
      <MenuScreen
        onStart={startNew}
        onContinue={hasSave ? continueGame : null}
        totalStars={progress.totalStars}
      />
    );
  }

  if (screen === 'mission' && activeStation) {
    return (
      <MissionScreen
        station={activeStation}
        difficulty={difficulty}
        theme={theme}
        muted={muted}
        speak={speak}
        onDone={completeStation}
        onBack={() => { setActiveStation(null); setScreen('map'); }}
      />
    );
  }

  if (screen === 'boss') {
    return (
      <BossScreen
        difficulty={difficulty}
        theme={theme}
        speak={speak}
        onDone={completeBoss}
        onBack={() => setScreen('map')}
      />
    );
  }

  if (screen === 'victory') {
    return (
      <VictoryScreen
        theme={theme}
        coins={coins}
        runs={runs}
        onPlayAgain={playAgain}
        onMenu={() => setScreen('menu')}
      />
    );
  }

  return (
    <MapScreen
      theme={theme}
      difficulty={difficulty}
      stationsDone={stationsDone}
      coins={coins}
      keys={keys}
      bossUnlocked={stationsDone.length === STATIONS.length && !bossDone}
      bossDone={bossDone}
      onOpenStation={openStation}
      onOpenBoss={startBoss}
      onMenu={() => setScreen('menu')}
    />
  );
}

// ─── Menu Screen ────────────────────────────────────────────────────────────

function MenuScreen({
  onStart,
  onContinue,
  totalStars,
}: {
  onStart: (t: Theme, d: Difficulty) => void;
  onContinue: (() => void) | null;
  totalStars: number;
}) {
  const [theme, setTheme] = useState<Theme>('pirat');
  const [difficulty, setDifficulty] = useState<Difficulty>('liten');
  const themeData = THEMES[theme];

  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 pb-10 relative overflow-hidden"
      style={{ background: themeData.bgGradient }}
    >
      {/* Decorative sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        {SPARKLES.map(s => (
          <span
            key={s.id}
            className="absolute text-yellow-200 opacity-60"
            style={{
              left: `${s.x}%`, top: `${s.y}%`,
              fontSize: '0.9rem',
              animation: `twinkle 3s ease-in-out infinite ${s.delay}s`,
            }}
          >✦</span>
        ))}
      </div>

      {/* Header */}
      <header
        className="w-full flex items-center gap-3 py-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <Link
          href="/"
          className="flex items-center justify-center w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 active:scale-90 transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </Link>
        <h1 className="flex-1 text-xl font-black text-white">
          <span className="mr-2">🗺️</span> Skattjakten
        </h1>
        <div className="bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-white font-black text-sm flex items-center gap-1">
          <span>⭐</span> {totalStars}
        </div>
      </header>

      {/* Hero */}
      <div className="text-center mt-6 mb-6 relative z-10">
        <div
          className="text-7xl mb-3 select-none"
          style={{ animation: 'bob 3s ease-in-out infinite', filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.6))' }}
        >
          {themeData.hero}
        </div>
        <h2
          className="text-4xl font-black tracking-tight text-white"
          style={{ textShadow: '0 0 24px rgba(255,200,80,0.55), 0 2px 4px rgba(0,0,0,0.6)' }}
        >
          Skattjakten
        </h2>
        <p className="text-white/70 mt-2 max-w-xs mx-auto text-sm font-semibold">
          {themeData.intro}
        </p>
      </div>

      {/* Theme picker */}
      <section className="w-full max-w-md mb-5 relative z-10">
        <div className="text-white/60 text-xs font-black uppercase tracking-wider mb-2 text-center">
          Välj värld
        </div>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(THEMES) as Theme[]).map(k => {
            const t = THEMES[k];
            const active = theme === k;
            return (
              <button
                key={k}
                onClick={() => setTheme(k)}
                className={`flex flex-col items-center justify-center rounded-2xl py-3 transition-all ${
                  active ? 'bg-white/30 ring-2 ring-yellow-300 scale-105 shadow-lg' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <span className="text-3xl mb-1">{t.emoji}</span>
                <span className="text-[11px] font-black text-white">{t.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Difficulty picker */}
      <section className="w-full max-w-md mb-7 relative z-10">
        <div className="text-white/60 text-xs font-black uppercase tracking-wider mb-2 text-center">
          Svårighetsgrad
        </div>
        <div className="space-y-2">
          {(Object.keys(DIFFICULTIES) as Difficulty[]).map(k => {
            const d = DIFFICULTIES[k];
            const active = difficulty === k;
            return (
              <button
                key={k}
                onClick={() => setDifficulty(k)}
                className={`w-full flex items-center justify-between rounded-2xl px-4 py-3 transition-all ${
                  active ? 'bg-white/25 ring-2 ring-yellow-300 shadow-md' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <div className="text-left">
                  <div className="text-base font-black text-white">{d.label}</div>
                  <div className="text-[11px] font-bold text-white/60">{d.subtitle}</div>
                </div>
                <span className="text-xs font-black text-yellow-200 bg-black/30 rounded-full px-2 py-1">
                  {d.age}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Action buttons */}
      <div className="w-full max-w-md flex flex-col gap-3 relative z-10">
        <button
          onClick={() => onStart(theme, difficulty)}
          className="w-full py-4 rounded-2xl font-black text-lg text-white tracking-wide active:scale-95 transition-transform"
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #dc2626 60%, #7c2d12 100%)',
            boxShadow: '0 10px 28px -6px rgba(245,158,11,0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
          }}
        >
          🚩 Börja äventyret
        </button>
        {onContinue && (
          <button
            onClick={onContinue}
            className="w-full py-3 rounded-2xl font-black text-base text-white/90 bg-white/15 hover:bg-white/25 active:scale-95 transition-all ring-1 ring-white/25"
          >
            ▶ Fortsätt sparat spel
          </button>
        )}
      </div>

      <style>{`
        @keyframes bob {
          0%,100% { transform: translateY(0) rotate(-3deg); }
          50%     { transform: translateY(-10px) rotate(3deg); }
        }
        @keyframes twinkle {
          0%,100% { opacity: 0.2; transform: scale(0.85); }
          50%     { opacity: 0.9; transform: scale(1.15); }
        }
      `}</style>
    </main>
  );
}

// ─── Map Screen ─────────────────────────────────────────────────────────────

function MapScreen({
  theme, difficulty, stationsDone, coins, keys, bossUnlocked, bossDone,
  onOpenStation, onOpenBoss, onMenu,
}: {
  theme: Theme;
  difficulty: Difficulty;
  stationsDone: number[];
  coins: number;
  keys: number;
  bossUnlocked: boolean;
  bossDone: boolean;
  onOpenStation: (s: Station) => void;
  onOpenBoss: () => void;
  onMenu: () => void;
}) {
  const themeData = THEMES[theme];
  const playerStationIdx = stationsDone.length;
  const playerStation = STATIONS[playerStationIdx] ?? STATIONS[STATIONS.length - 1];
  const playerPos = bossUnlocked || bossDone ? BOSS.pos : playerStation.pos;

  // Build path SVG points: start → s0 → s1 → ... → boss
  const pathPoints = useMemo(() => {
    const start = { x: 6, y: 92 };
    return [start, ...STATIONS.map(s => s.pos), BOSS.pos];
  }, []);

  return (
    <main
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: themeData.bgGradient }}
    >
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 py-3 relative z-20"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <button
          onClick={onMenu}
          className="flex items-center justify-center w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 active:scale-90 transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="flex-1 text-base font-black text-white truncate">
          🗺️ {DIFFICULTIES[difficulty].label}
        </h1>
        <div className="flex items-center gap-2">
          <div className="bg-amber-500/30 border border-amber-300/40 rounded-full px-3 py-1.5 text-amber-100 font-black text-sm flex items-center gap-1">
            🪙 {coins}
          </div>
          <div className="bg-yellow-500/25 border border-yellow-300/40 rounded-full px-3 py-1.5 text-yellow-100 font-black text-sm flex items-center gap-1">
            🗝️ {keys}/{STATIONS.length}
          </div>
        </div>
      </header>

      {/* Map area */}
      <div className="flex-1 relative px-3 pb-3">
        <div
          className="relative w-full h-full rounded-3xl overflow-hidden border-4 border-amber-900/60"
          style={{
            background: themeData.mapBg,
            boxShadow: 'inset 0 0 80px rgba(0,0,0,0.45), 0 8px 30px rgba(0,0,0,0.4)',
            minHeight: '60vh',
          }}
        >
          {/* Decorative texture */}
          <div className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.12), transparent 40%), radial-gradient(circle at 75% 70%, rgba(0,0,0,0.25), transparent 50%)',
            }}
          />

          {/* Path */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            <path
              d={`M ${pathPoints.map(p => `${p.x} ${p.y}`).join(' L ')}`}
              fill="none"
              stroke={themeData.pathColor}
              strokeWidth="0.8"
              strokeDasharray="2,2"
              strokeLinecap="round"
              opacity="0.85"
            />
          </svg>

          {/* Stations */}
          {STATIONS.map((st) => {
            const done = stationsDone.includes(st.id);
            const current = stationsDone.length === st.id;
            const locked = !done && !current;
            return (
              <button
                key={st.id}
                onClick={() => onOpenStation(st)}
                disabled={locked}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
                style={{ left: `${st.pos.x}%`, top: `${st.pos.y}%` }}
              >
                <div
                  className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-3xl md:text-4xl transition-all ${
                    done
                      ? 'bg-green-500/90 ring-4 ring-green-300/70'
                      : current
                      ? 'bg-amber-400 ring-4 ring-yellow-300 active:scale-90 shadow-lg'
                      : 'bg-stone-700/60 ring-2 ring-stone-500/50 grayscale opacity-70'
                  }`}
                  style={{
                    animation: current ? 'pulseGlow 1.4s ease-in-out infinite' : undefined,
                    boxShadow: current ? '0 0 22px rgba(252,211,77,0.7)' : undefined,
                  }}
                >
                  <span style={{ filter: locked ? 'grayscale(1) brightness(0.7)' : undefined }}>
                    {done ? '✅' : st.emoji}
                  </span>
                  {locked && (
                    <span className="absolute -top-1 -right-1 text-base">🔒</span>
                  )}
                </div>
                <div className={`mt-1 text-[10px] md:text-xs font-black px-2 py-0.5 rounded-full ${
                  current ? 'bg-amber-200 text-amber-900' : done ? 'bg-green-200 text-green-900' : 'bg-stone-800/70 text-stone-300'
                }`}>
                  {st.name}
                </div>
              </button>
            );
          })}

          {/* Boss / treasure */}
          <button
            onClick={onOpenBoss}
            disabled={!bossUnlocked && !bossDone}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ left: `${BOSS.pos.x}%`, top: `${BOSS.pos.y}%` }}
          >
            <div
              className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-4xl md:text-5xl ${
                bossDone
                  ? 'bg-green-600 ring-4 ring-green-300'
                  : bossUnlocked
                  ? 'bg-yellow-400 ring-4 ring-yellow-200 active:scale-90'
                  : 'bg-stone-700/60 ring-2 ring-stone-500/50 grayscale opacity-70'
              }`}
              style={{
                animation: bossUnlocked ? 'pulseGlow 1.1s ease-in-out infinite' : undefined,
                boxShadow: bossUnlocked ? '0 0 30px rgba(253,224,71,0.85)' : undefined,
              }}
            >
              {bossDone ? '🏆' : bossUnlocked ? '💎' : '🔒'}
            </div>
            <div className="mt-1 text-[10px] md:text-xs font-black px-2 py-0.5 rounded-full bg-yellow-300 text-yellow-900">
              {bossDone ? 'Skatten tagen!' : 'Skattkistan'}
            </div>
          </button>

          {/* Player avatar */}
          <div
            className="absolute -translate-x-1/2 transition-all duration-700 ease-out pointer-events-none z-10"
            style={{
              left: `${playerPos.x}%`,
              top: `calc(${playerPos.y}% - 36px)`,
              fontSize: '2rem',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))',
              animation: 'hopBob 1.2s ease-in-out infinite',
            }}
          >
            {themeData.hero}
          </div>
        </div>
      </div>

      {/* Hint bar */}
      <div className="px-4 pb-4 pt-2">
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl px-4 py-3 text-white text-sm font-bold ring-1 ring-white/15 text-center">
          {bossDone ? (
            <>🎉 Du hittade hela skatten! Tryck på 🏆 för att se belöningen igen.</>
          ) : bossUnlocked ? (
            <>✨ Alla nycklar är dina! Tryck på <span className="text-yellow-300">💎 Skattkistan</span> för att öppna den!</>
          ) : (
            <>👉 Tryck på <span className="text-yellow-300">{playerStation.emoji} {playerStation.name}</span> — {playerStation.hint}</>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulseGlow {
          0%,100% { transform: scale(1); }
          50%     { transform: scale(1.08); }
        }
        @keyframes hopBob {
          0%,100% { transform: translateX(-50%) translateY(0) rotate(-4deg); }
          50%     { transform: translateX(-50%) translateY(-8px) rotate(4deg); }
        }
      `}</style>
    </main>
  );
}

// ─── Mission Screen (single puzzle) ─────────────────────────────────────────

function MissionScreen({
  station, difficulty, theme, muted, speak, onDone, onBack,
}: {
  station: Station;
  difficulty: Difficulty;
  theme: Theme;
  muted: boolean;
  speak: (t: string) => void;
  onDone: (won: boolean, coins: number) => void;
  onBack: () => void;
}) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generatePuzzle(station.kind, difficulty, theme));
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [eliminated, setEliminated] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);
  const themeData = THEMES[theme];
  const spokeOnce = useRef(false);

  useEffect(() => {
    if (!muted && !spokeOnce.current) {
      spokeOnce.current = true;
      const t = setTimeout(() => speak(puzzle.voice), 250);
      return () => clearTimeout(t);
    }
  }, [muted, speak, puzzle.voice]);

  const onPick = (n: number) => {
    if (result || eliminated.includes(n)) return;
    setPicked(n);
    if (n === puzzle.answer) {
      setResult('correct');
      if (!muted) speak('Rätt!');
      setTimeout(() => {
        const earned = Math.max(2, 5 - hintsUsed - attempts);
        onDone(true, earned);
      }, 1300);
    } else {
      setResult('wrong');
      setAttempts(a => a + 1);
      if (!muted) speak('Inte rätt, försök igen!');
      setTimeout(() => {
        setResult(null);
        setPicked(null);
      }, 900);
    }
  };

  const useHint = () => {
    const wrongs = puzzle.options.filter(o => o !== puzzle.answer && !eliminated.includes(o));
    if (wrongs.length === 0) return;
    const drop = wrongs[rand(0, wrongs.length - 1)];
    setEliminated(e => [...e, drop]);
    setHintsUsed(h => h + 1);
  };

  const isCount = station.kind === 'count';
  const isCompare = station.kind === 'compare';

  return (
    <main
      className="min-h-screen flex flex-col px-4 pb-6 relative overflow-hidden"
      style={{ background: themeData.bgGradient }}
    >
      <header
        className="flex items-center gap-3 py-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <button
          onClick={onBack}
          className="flex items-center justify-center w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 active:scale-90 transition-all"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <h1 className="flex-1 text-lg font-black text-white truncate">
          {station.emoji} {station.name}
        </h1>
        <button
          onClick={useHint}
          className="px-3 py-2 rounded-full bg-yellow-400/20 border border-yellow-300/40 text-yellow-100 font-black text-xs"
        >
          💡 Tips
        </button>
      </header>

      {/* Prompt */}
      <div className="text-center mt-2 mb-4">
        <div className="text-white text-base font-bold mb-1">{station.hint}</div>
        <div className="text-white/70 text-sm">{puzzle.prompt}</div>
      </div>

      {/* Display panel */}
      <section
        className="flex-1 flex items-center justify-center rounded-3xl p-6 mb-5 ring-1 ring-white/15"
        style={{
          background: 'rgba(0,0,0,0.35)',
          minHeight: '24vh',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.4)',
        }}
      >
        {isCount ? (
          <div className="text-center select-none">
            <div className="text-4xl md:text-5xl leading-tight" style={{ wordBreak: 'break-all' }}>
              {puzzle.display}
            </div>
          </div>
        ) : isCompare ? (
          <div className="flex gap-3 md:gap-5">
            {puzzle.options.map(n => (
              <button
                key={n}
                onClick={() => onPick(n)}
                disabled={!!result}
                className={`flex flex-col items-center justify-center rounded-2xl w-20 h-24 md:w-28 md:h-32 transition-all active:scale-95 ${
                  picked === n && result === 'correct' ? 'bg-green-500 scale-110' :
                  picked === n && result === 'wrong'   ? 'bg-red-500 animate-shake' :
                  'bg-amber-700/80 hover:bg-amber-600/90 ring-2 ring-amber-300/40'
                }`}
                style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.5)' }}
              >
                <span className="text-3xl md:text-4xl mb-1">🟫</span>
                <span className="text-2xl md:text-3xl font-black text-white">{n}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-5xl md:text-7xl font-black text-white tracking-wide text-center"
            style={{ textShadow: '0 0 24px rgba(252,211,77,0.4)' }}
          >
            {puzzle.display}
          </div>
        )}
      </section>

      {/* Options (not for compare which is its own UI) */}
      {!isCompare && (
        <section className="grid grid-cols-2 gap-3 mb-2">
          {puzzle.options.map(n => {
            const isPicked = picked === n;
            const dimmed = eliminated.includes(n);
            return (
              <button
                key={n}
                onClick={() => onPick(n)}
                disabled={!!result || dimmed}
                className={`py-5 rounded-2xl text-3xl font-black text-white transition-all active:scale-95 ${
                  isPicked && result === 'correct' ? 'bg-green-500 scale-105' :
                  isPicked && result === 'wrong'   ? 'bg-red-500 animate-shake' :
                  dimmed                            ? 'bg-stone-700/40 text-stone-500 line-through' :
                  'bg-gradient-to-br from-violet-500 to-fuchsia-600 ring-1 ring-white/20 shadow-md'
                }`}
                style={{
                  boxShadow: dimmed ? 'none' : '0 6px 18px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
              >
                {n}
              </button>
            );
          })}
        </section>
      )}

      {/* Feedback */}
      <div className="h-8 text-center">
        {result === 'correct' && (
          <div className="text-green-300 font-black text-lg" style={{ animation: 'feedUp 1s ease-out forwards' }}>
            🎉 Rätt! Du fick en nyckel!
          </div>
        )}
        {result === 'wrong' && (
          <div className="text-red-300 font-black text-base">
            ❌ Inte riktigt — försök igen!
          </div>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25%     { transform: translateX(-8px); }
          50%     { transform: translateX(8px); }
          75%     { transform: translateX(-5px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        @keyframes feedUp {
          0%   { opacity: 0; transform: translateY(8px) scale(0.9); }
          30%  { opacity: 1; transform: translateY(0)   scale(1.05); }
          100% { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </main>
  );
}

// ─── Boss Screen (chain of 3 puzzles) ───────────────────────────────────────

function BossScreen({
  difficulty, theme, speak, onDone, onBack,
}: {
  difficulty: Difficulty;
  theme: Theme;
  speak: (t: string) => void;
  onDone: () => void;
  onBack: () => void;
}) {
  const themeData = THEMES[theme];
  const allKinds: PuzzleKind[] = ['plus', 'minus', 'sequence', 'compare', 'multiply'];
  const [puzzles] = useState<Puzzle[]>(() => {
    const kinds = pickN(allKinds, 3);
    return kinds.map(k => generatePuzzle(k, difficulty, theme));
  });
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);

  const current = puzzles[step];

  const onPick = (n: number) => {
    if (result) return;
    setPicked(n);
    if (n === current.answer) {
      setResult('correct');
      speak('Rätt!');
      setTimeout(() => {
        if (step + 1 >= puzzles.length) {
          onDone();
        } else {
          setStep(s => s + 1);
          setPicked(null);
          setResult(null);
        }
      }, 1100);
    } else {
      setResult('wrong');
      setTimeout(() => {
        setResult(null);
        setPicked(null);
      }, 700);
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col px-4 pb-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #1a0008 0%, #4a0a18 25%, #80401a 55%, #5a2a05 80%, #100400 100%)',
      }}
    >
      <header
        className="flex items-center gap-3 py-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <button
          onClick={onBack}
          className="flex items-center justify-center w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 active:scale-90 transition-all"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <h1 className="flex-1 text-lg font-black text-white">
          💎 Skattkistans gåtor
        </h1>
        <div className="text-yellow-200 font-black text-sm bg-black/30 rounded-full px-3 py-1.5">
          {step + 1}/{puzzles.length}
        </div>
      </header>

      {/* Treasure chest */}
      <div className="text-center mt-2 mb-3">
        <div
          className="text-7xl mb-2 select-none"
          style={{
            filter: 'drop-shadow(0 0 30px rgba(252,211,77,0.85))',
            animation: 'glow 2s ease-in-out infinite',
          }}
        >
          {themeData.treasure}
        </div>
        <div className="text-white/80 font-bold text-sm">
          Lös {puzzles.length} gåtor i rad för att öppna kistan!
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-4">
        {puzzles.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i < step ? 'bg-green-400' : i === step ? 'bg-yellow-300 ring-2 ring-yellow-200' : 'bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* Puzzle display */}
      <section
        className="flex-1 flex items-center justify-center rounded-3xl p-6 mb-5 ring-1 ring-white/15"
        style={{ background: 'rgba(0,0,0,0.4)', minHeight: '20vh' }}
      >
        <div className="text-center">
          <div className="text-white/70 text-sm font-bold mb-3">{current.prompt}</div>
          <div className="text-5xl md:text-6xl font-black text-yellow-100 tracking-wide"
            style={{ textShadow: '0 0 22px rgba(252,211,77,0.6)' }}
          >
            {current.display}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 mb-2">
        {current.options.map(n => {
          const isPicked = picked === n;
          return (
            <button
              key={n}
              onClick={() => onPick(n)}
              disabled={!!result}
              className={`py-5 rounded-2xl text-3xl font-black text-white transition-all active:scale-95 ${
                isPicked && result === 'correct' ? 'bg-green-500 scale-105' :
                isPicked && result === 'wrong'   ? 'bg-red-500 animate-shake' :
                'bg-gradient-to-br from-amber-500 to-red-600 ring-1 ring-white/20'
              }`}
              style={{ boxShadow: '0 6px 18px rgba(220,38,38,0.4)' }}
            >
              {n}
            </button>
          );
        })}
      </section>

      <style>{`
        @keyframes glow {
          0%,100% { transform: scale(1); }
          50%     { transform: scale(1.06); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25%     { transform: translateX(-8px); }
          50%     { transform: translateX(8px); }
          75%     { transform: translateX(-5px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </main>
  );
}

// ─── Victory Screen ─────────────────────────────────────────────────────────

function VictoryScreen({
  theme, coins, runs, onPlayAgain, onMenu,
}: {
  theme: Theme;
  coins: number;
  runs: number;
  onPlayAgain: () => void;
  onMenu: () => void;
}) {
  const themeData = THEMES[theme];

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: themeData.bgGradient }}
    >
      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <span
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-5%',
              fontSize: `${rand(14, 26)}px`,
              animation: `fall ${3 + Math.random() * 3}s linear infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            {['🎉','✨','⭐','🪙','💎'][i % 5]}
          </span>
        ))}
      </div>

      <div
        className="text-9xl mb-3 select-none relative z-10"
        style={{
          filter: 'drop-shadow(0 0 40px rgba(252,211,77,0.9))',
          animation: 'bigBounce 1.6s ease-in-out infinite',
        }}
      >
        {themeData.treasure}
      </div>
      <h1 className="text-4xl md:text-5xl font-black text-yellow-200 text-center mb-2 relative z-10"
        style={{ textShadow: '0 0 28px rgba(252,211,77,0.8)' }}
      >
        Du hittade skatten!
      </h1>
      <p className="text-white/80 text-center max-w-xs mb-7 relative z-10 font-semibold">
        Otroligt jobbat! Du löste alla gåtor och fann den legendariska skatten.
      </p>

      <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-7 relative z-10">
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center ring-1 ring-white/20">
          <div className="text-3xl font-black text-amber-300">🪙 {coins}</div>
          <div className="text-xs font-bold text-white/60 mt-0.5">Mynt</div>
        </div>
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center ring-1 ring-white/20">
          <div className="text-3xl font-black text-violet-300">📜 {runs}</div>
          <div className="text-xs font-bold text-white/60 mt-0.5">Försök</div>
        </div>
      </div>

      <div className="w-full max-w-xs flex flex-col gap-3 relative z-10">
        <button
          onClick={onPlayAgain}
          className="w-full py-4 rounded-2xl font-black text-lg text-white tracking-wide active:scale-95 transition-transform"
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #dc2626 60%, #7c2d12 100%)',
            boxShadow: '0 10px 28px -6px rgba(245,158,11,0.6)',
          }}
        >
          🚩 Nytt äventyr
        </button>
        <button
          onClick={onMenu}
          className="w-full py-3 rounded-2xl font-black text-base text-white/90 bg-white/15 hover:bg-white/25 active:scale-95 transition-all ring-1 ring-white/25"
        >
          ◀ Tillbaka till menyn
        </button>
      </div>

      <style>{`
        @keyframes bigBounce {
          0%,100% { transform: scale(1) rotate(-5deg); }
          50%     { transform: scale(1.08) rotate(5deg); }
        }
        @keyframes fall {
          0%   { transform: translateY(0) rotate(0); opacity: 0; }
          10%  { opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0.4; }
        }
      `}</style>
    </main>
  );
}
