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

const NUMBER_WORDS = [
  'noll', 'en', 'två', 'tre', 'fyra', 'fem',
  'sex', 'sju', 'åtta', 'nio', 'tio',
];

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  twinkleDelay: number;
  group: 'a' | 'b';
}

type Mode = 'count' | 'add';

interface Round {
  mode: Mode;
  a: number;
  b: number; // only for add
  answer: number;
  choices: number[];
}

function shuffle<T>(a: T[]): T[] {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

function buildChoices(answer: number, max: number): number[] {
  const set = new Set<number>([answer]);
  while (set.size < 3) {
    const candidate = Math.max(0, Math.min(max, answer + (Math.floor(Math.random() * 5) - 2)));
    if (candidate !== answer) set.add(candidate);
    if (set.size === 2 && Math.random() < 0.5) set.add(Math.max(0, Math.min(max, answer - 1)));
  }
  return shuffle(Array.from(set));
}

function buildRound(round: number): Round {
  // First half: counting only (1-10). Second half: simple addition (sum <= 10).
  if (round < 4) {
    const a = 1 + Math.floor(Math.random() * 10);
    return { mode: 'count', a, b: 0, answer: a, choices: buildChoices(a, 10) };
  }
  const a = 1 + Math.floor(Math.random() * 5);
  const b = 1 + Math.floor(Math.random() * (10 - a));
  const sum = a + b;
  return { mode: 'add', a, b, answer: sum, choices: buildChoices(sum, 10) };
}

const ROUNDS = 7;

function makeStars(count: number, group: 'a' | 'b', xOffset: number, xRange: number): Star[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + (group === 'b' ? 100 : 0),
    x: xOffset + Math.random() * xRange,
    y: 15 + Math.random() * 65,
    size: 28 + Math.random() * 16,
    twinkleDelay: Math.random() * 2,
    group,
  }));
}

export default function Niva18() {
  const { speak } = useSpeech();
  const [round, setRound] = useState(0);
  const [data, setData] = useState<Round>(() => buildRound(0));
  const [picked, setPicked] = useState<number | null>(null);
  const [wrong, setWrong] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);
  const [tapped, setTapped] = useState<Set<number>>(new Set());
  const [hasIntro, setHasIntro] = useState(false);

  const skyStars = useMemo<Star[]>(() => {
    if (data.mode === 'count') {
      return makeStars(data.a, 'a', 8, 84);
    }
    return [
      ...makeStars(data.a, 'a', 8, 38),
      ...makeStars(data.b, 'b', 54, 38),
    ];
  }, [data]);

  useEffect(() => {
    if (hasIntro) return;
    const t = setTimeout(() => {
      if (data.mode === 'count') {
        speak(`Räkna stjärnorna! Hur många är det?`);
      } else {
        speak(`${data.a} plus ${data.b} är?`);
      }
      setHasIntro(true);
    }, 350);
    return () => clearTimeout(t);
  }, [data, speak, hasIntro]);

  const next = () => {
    if (round + 1 >= ROUNDS) {
      const finalStars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      setStars(finalStars);
      for (let n = 1; n <= 10; n++) unlockNumber(n);
      completeLevel(18, finalStars);
      setDone(true);
      return;
    }
    setRound(r => r + 1);
    setData(buildRound(round + 1));
    setPicked(null);
    setTapped(new Set());
    setHasIntro(false);
  };

  const tapStar = (id: number) => {
    if (picked !== null || done) return;
    setTapped(prev => {
      if (prev.has(id)) return prev;
      const n = prev.size + 1;
      hapticImpact('light');
      speak(NUMBER_WORDS[n] || String(n));
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleAnswer = (n: number) => {
    if (picked !== null || done) return;
    if (n === data.answer) {
      setPicked(n);
      hapticNotification('success');
      speak(data.mode === 'count' ? `Ja! Det är ${NUMBER_WORDS[n] || n} stjärnor.` : `Ja! ${data.a} plus ${data.b} är ${NUMBER_WORDS[n] || n}.`);
      setTimeout(() => next(), 1500);
    } else {
      setWrong(n);
      setMistakes(m => m + 1);
      hapticImpact('light');
      speak('Försök igen!');
      setTimeout(() => setWrong(null), 600);
    }
  };

  const replay = () => {
    setRound(0);
    setData(buildRound(0));
    setPicked(null);
    setTapped(new Set());
    setMistakes(0);
    setStars(0);
    setDone(false);
    setHasIntro(false);
  };

  return (
    <GameBackground theme={GAME_THEMES.draken} className="pb-12">
      <DrakenHeader title="Stjärnhimlen" emoji="🌌" />

      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-3 bg-white/70 rounded-3xl p-3 shadow-sm ring-2 ring-indigo-200">
          <Glittra size={64} />
          <div className="flex-1">
            <div className="text-sm font-bold text-purple-700/70">
              Nivå 18 · Runda {round + 1}/{ROUNDS}
            </div>
            <button
              onClick={() =>
                speak(
                  data.mode === 'count'
                    ? 'Räkna stjärnorna!'
                    : `${data.a} plus ${data.b}?`,
                )
              }
              className="text-left text-xl font-black text-indigo-700 active:scale-95 transition-transform"
            >
              {data.mode === 'count' ? 'Räkna stjärnorna! 🔊' : `${data.a} + ${data.b} = ? 🔊`}
            </button>
          </div>
        </div>

        {/* Sky */}
        <div
          className="relative w-full rounded-[36px] bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 ring-4 ring-white/70 shadow-xl overflow-hidden mb-4"
          style={{ height: 280 }}
        >
          {data.mode === 'add' && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl text-white/40 font-black">
              +
            </div>
          )}
          {skyStars.map(star => {
            const isTapped = tapped.has(star.id);
            return (
              <button
                key={star.id}
                onClick={() => tapStar(star.id)}
                className="absolute select-none active:scale-90 transition-transform"
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  fontSize: star.size,
                  filter: isTapped
                    ? 'drop-shadow(0 0 12px rgba(250,204,21,1)) brightness(1.4)'
                    : 'drop-shadow(0 0 6px rgba(250,204,21,0.7))',
                }}
              >
                <span
                  className={isTapped ? 'animate-draken-pop' : 'animate-soft-pulse'}
                  style={{ animationDelay: `${star.twinkleDelay}s` }}
                >
                  {isTapped ? '🌟' : '⭐'}
                </span>
              </button>
            );
          })}
          <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/70">
            Tryck på stjärnorna för att räkna!
          </p>
        </div>

        {/* Number choices */}
        <div className="grid grid-cols-3 gap-3">
          {data.choices.map(c => {
            const isCorrect = picked === c;
            const isWrong = wrong === c;
            return (
              <button
                key={c}
                onClick={() => handleAnswer(c)}
                disabled={picked !== null}
                className={`p-4 rounded-3xl bg-gradient-to-br from-amber-200 to-yellow-400 shadow-lg ring-4 active:scale-95 transition-all ${
                  isCorrect
                    ? 'ring-emerald-300 scale-110'
                    : isWrong
                    ? 'ring-red-300 animate-shake'
                    : 'ring-amber-200'
                }`}
              >
                <div className="text-4xl font-black text-amber-900">{c}</div>
                <div className="text-xs font-bold text-amber-800/80 mt-0.5">
                  {NUMBER_WORDS[c] || c}
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs font-bold text-purple-900/70 mt-3">
          Räkna upp till 10 — och prova plus! ➕
        </p>
      </div>

      {done && (
        <LevelComplete
          level={18}
          stars={stars}
          islandName="Stjärnhimlen"
          nextHref={null}
          onReplay={replay}
        />
      )}
    </GameBackground>
  );
}
