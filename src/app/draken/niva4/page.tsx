'use client';

import { useEffect, useMemo, useState } from 'react';
import { GameBackground } from '@/components/GameBackground';
import { GAME_THEMES } from '@/lib/gameThemes';
import { DrakenHeader } from '@/components/draken/DrakenHeader';
import { Glittra } from '@/components/draken/Glittra';
import { LevelComplete } from '@/components/draken/LevelComplete';
import { useSpeech } from '@/hooks/useSpeech';
import { hapticImpact, hapticNotification } from '@/utils/haptics';
import { completeLevel, unlockNumber } from '@/lib/drakenStorage';

type ShapeKind = 'cirkel' | 'kvadrat' | 'triangel' | 'stjärna' | 'hjärta';
type ColorKey = 'blå' | 'röd' | 'gul' | 'grön' | 'lila' | 'rosa';

const COLOR_HEX: Record<ColorKey, string> = {
  blå: '#3b82f6',
  röd: '#ef4444',
  gul: '#facc15',
  grön: '#22c55e',
  lila: '#a855f7',
  rosa: '#ec4899',
};

const NUMBER_WORDS = ['noll', 'en', 'två', 'tre', 'fyra', 'fem'];
const ROUNDS = 5;

interface Round {
  shape: ShapeKind;
  color: ColorKey;
  count: number;
  pool: { id: number; shape: ShapeKind; color: ColorKey }[];
}

function shuffle<T>(a: T[]): T[] {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

function buildRound(): Round {
  const shapes: ShapeKind[] = ['cirkel', 'kvadrat', 'triangel', 'stjärna', 'hjärta'];
  const colors: ColorKey[] = ['blå', 'röd', 'gul', 'grön', 'lila', 'rosa'];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const count = 1 + Math.floor(Math.random() * 4);

  const matching = Array.from({ length: count + 1 + Math.floor(Math.random() * 2) }, (_, i) => ({
    id: i,
    shape,
    color,
  }));
  const distractors = Array.from({ length: 5 }, (_, i) => {
    let s = shapes[Math.floor(Math.random() * shapes.length)];
    let c = colors[Math.floor(Math.random() * colors.length)];
    if (s === shape && c === color) {
      const others = colors.filter(o => o !== color);
      c = others[Math.floor(Math.random() * others.length)];
    }
    return { id: matching.length + i, shape: s, color: c };
  });
  return { shape, color, count, pool: shuffle([...matching, ...distractors]) };
}

function ShapeGfx({ shape, color, size = 56 }: { shape: ShapeKind; color: ColorKey; size?: number }) {
  const fill = COLOR_HEX[color];
  const stroke = 'rgba(255,255,255,0.7)';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.18))' }}>
      {shape === 'cirkel' && <circle cx="50" cy="50" r="42" fill={fill} stroke={stroke} strokeWidth="4" />}
      {shape === 'kvadrat' && <rect x="10" y="10" width="80" height="80" rx="14" fill={fill} stroke={stroke} strokeWidth="4" />}
      {shape === 'triangel' && (
        <polygon points="50,8 92,88 8,88" fill={fill} stroke={stroke} strokeWidth="4" strokeLinejoin="round" />
      )}
      {shape === 'stjärna' && (
        <polygon
          points="50,8 61,38 93,38 67,57 77,88 50,70 23,88 33,57 7,38 39,38"
          fill={fill}
          stroke={stroke}
          strokeWidth="4"
          strokeLinejoin="round"
        />
      )}
      {shape === 'hjärta' && (
        <path
          d="M50 88 C 18 66, 6 44, 22 28 C 35 16, 50 26, 50 38 C 50 26, 65 16, 78 28 C 94 44, 82 66, 50 88 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="4"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export default function Niva4() {
  const { speak } = useSpeech();
  const [round, setRound] = useState(0);
  const [data, setData] = useState<Round>(buildRound);
  const [placed, setPlaced] = useState<number[]>([]);
  const [wrongId, setWrongId] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);
  const [hasIntro, setHasIntro] = useState(false);

  const goal = data.count;

  useEffect(() => {
    if (hasIntro) return;
    const t = setTimeout(() => {
      speak(`Lägg ${NUMBER_WORDS[goal]} ${data.color} ${data.shape}${goal > 1 ? 'ar' : ''} i grottan!`);
      setHasIntro(true);
    }, 350);
    return () => clearTimeout(t);
  }, [data, goal, speak, hasIntro]);

  useEffect(() => {
    if (placed.length < goal || done) return;
    hapticNotification('success');
    speak('Perfekt!');
    setTimeout(() => next(), 1100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placed.length, goal, done]);

  const next = () => {
    if (round + 1 >= ROUNDS) {
      const finalStars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      setStars(finalStars);
      completeLevel(4, finalStars);
      setDone(true);
      return;
    }
    setData(buildRound());
    setPlaced([]);
    setRound(r => r + 1);
    setHasIntro(false);
  };

  const handleTap = (id: number, item: { shape: ShapeKind; color: ColorKey }) => {
    if (placed.includes(id) || done) return;
    if (placed.length >= goal) {
      setWrongId(id);
      setMistakes(m => m + 1);
      hapticImpact('light');
      speak('Det räcker, du har redan tillräckligt!');
      setTimeout(() => setWrongId(null), 500);
      return;
    }
    if (item.shape === data.shape && item.color === data.color) {
      setPlaced(p => [...p, id]);
      hapticImpact('light');
      if (placed.length + 1 <= 5) unlockNumber(placed.length + 1);
      speak(String(placed.length + 1));
    } else {
      setWrongId(id);
      setMistakes(m => m + 1);
      hapticImpact('light');
      speak('Försök igen, leta efter rätt färg och form.');
      setTimeout(() => setWrongId(null), 500);
    }
  };

  const replay = () => {
    setData(buildRound());
    setRound(0);
    setMistakes(0);
    setStars(0);
    setDone(false);
    setPlaced([]);
    setHasIntro(false);
  };

  const slots = useMemo(() => Array.from({ length: goal }, (_, i) => i), [goal]);

  return (
    <GameBackground theme={GAME_THEMES.draken} className="pb-12">
      <DrakenHeader title="Formgrottan" emoji="🔷" />

      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-3 bg-white/70 rounded-3xl p-3 shadow-sm ring-2 ring-violet-200">
          <Glittra size={64} />
          <div className="flex-1">
            <div className="text-sm font-bold text-purple-700/70">Nivå 4 · Runda {round + 1}/{ROUNDS}</div>
            <button
              onClick={() =>
                speak(`Lägg ${NUMBER_WORDS[goal]} ${data.color} ${data.shape}${goal > 1 ? 'ar' : ''} i grottan!`)
              }
              className="text-left text-xl font-black text-violet-700 active:scale-95 transition-transform"
            >
              Lägg {goal} {data.color}{' '}
              <span style={{ color: COLOR_HEX[data.color] }}>{data.shape}{goal > 1 ? 'ar' : ''}</span>! 🔊
            </button>
          </div>
        </div>

        {/* Cave with slots */}
        <div
          className="relative w-full rounded-[36px] bg-gradient-to-b from-violet-700 via-purple-800 to-indigo-900 ring-4 ring-violet-300 shadow-xl overflow-hidden mb-4"
          style={{ height: 140 }}
        >
          {/* Sparkly crystals */}
          <span className="absolute text-3xl opacity-80 select-none animate-balloon-float" style={{ top: 12, left: 14 }}>💎</span>
          <span className="absolute text-2xl opacity-70 select-none animate-balloon-float" style={{ bottom: 12, right: 18, animationDelay: '0.4s' }}>💎</span>
          <span className="absolute text-xl opacity-60 select-none animate-sparkle-spin" style={{ top: 10, right: 30 }}>✨</span>

          <div className="absolute inset-0 flex items-center justify-center gap-3 px-4 flex-wrap">
            {slots.map(i => (
              <div
                key={i}
                className="flex items-center justify-center w-16 h-16 rounded-full ring-2 ring-dashed ring-white/40 bg-black/30"
              >
                {placed[i] !== undefined && (
                  <div className="animate-draken-pop">
                    <ShapeGfx shape={data.shape} color={data.color} size={48} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pool of shapes to drag */}
        <div className="rounded-3xl bg-white/80 ring-2 ring-violet-200 p-4 shadow-md">
          <div className="grid grid-cols-4 gap-3">
            {data.pool.map(item => {
              const used = placed.includes(item.id);
              const wrong = wrongId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTap(item.id, item)}
                  disabled={used || done}
                  className={`flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 ring-2 ring-violet-100 active:scale-90 transition-all ${
                    used ? 'opacity-30 grayscale' : ''
                  } ${wrong ? 'animate-shake ring-red-400' : ''}`}
                >
                  <ShapeGfx shape={item.shape} color={item.color} size={48} />
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs font-bold text-purple-900/70 mt-3">
          Tryck på rätt färg och form 💎
        </p>
      </div>

      {done && (
        <LevelComplete
          level={4}
          stars={stars}
          islandName="Formgrottan"
          nextHref="/draken/niva5"
          onReplay={replay}
        />
      )}
    </GameBackground>
  );
}
