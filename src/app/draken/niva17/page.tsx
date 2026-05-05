'use client';

import { useEffect, useMemo, useState } from 'react';
import { GameBackground } from '@/components/GameBackground';
import { GAME_THEMES } from '@/lib/gameThemes';
import { DrakenHeader } from '@/components/draken/DrakenHeader';
import { Glittra } from '@/components/draken/Glittra';
import { LevelComplete } from '@/components/draken/LevelComplete';
import { useSpeech } from '@/hooks/useSpeech';
import { hapticImpact, hapticNotification } from '@/utils/haptics';
import { completeLevel } from '@/lib/drakenStorage';

interface Token {
  emoji: string;
  label: string;
  bg: string;
}

const COLORS: Token[] = [
  { emoji: '🔴', label: 'röd',   bg: 'from-rose-300 to-rose-500' },
  { emoji: '🟡', label: 'gul',   bg: 'from-amber-200 to-yellow-400' },
  { emoji: '🔵', label: 'blå',   bg: 'from-sky-300 to-blue-500' },
  { emoji: '🟢', label: 'grön',  bg: 'from-emerald-300 to-green-500' },
  { emoji: '🟣', label: 'lila',  bg: 'from-violet-300 to-purple-500' },
];

const SHAPES: Token[] = [
  { emoji: '⭐', label: 'stjärna',  bg: 'from-amber-200 to-amber-400' },
  { emoji: '🔺', label: 'triangel', bg: 'from-red-200 to-red-400' },
  { emoji: '🔷', label: 'diamant',  bg: 'from-blue-200 to-blue-400' },
  { emoji: '⚪', label: 'cirkel',   bg: 'from-slate-100 to-slate-300' },
  { emoji: '⬛', label: 'kvadrat',  bg: 'from-zinc-300 to-zinc-500' },
];

const ROUNDS = 6;

function shuffle<T>(a: T[]): T[] {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

interface Round {
  pattern: Token[];
  visibleCount: number; // how many tokens shown before the missing slot
  missingIndex: number;
  correct: Token;
  choices: Token[];
}

function pickPool(): Token[] {
  return Math.random() < 0.5 ? COLORS : SHAPES;
}

function buildRound(level: number): Round {
  const pool = pickPool();
  // Pattern types based on round difficulty
  let pattern: Token[];
  const variant = Math.random();
  if (level < 2) {
    // ABAB pattern, length 5-6
    const a = pool[Math.floor(Math.random() * pool.length)];
    let b = pool[Math.floor(Math.random() * pool.length)];
    while (b.label === a.label) b = pool[Math.floor(Math.random() * pool.length)];
    const length = 5 + Math.floor(Math.random() * 2);
    pattern = Array.from({ length }, (_, i) => (i % 2 === 0 ? a : b));
  } else if (variant < 0.5) {
    // ABC pattern, length 6
    const picks = shuffle(pool).slice(0, 3);
    pattern = Array.from({ length: 6 }, (_, i) => picks[i % 3]);
  } else {
    // AABB pattern, length 6
    const picks = shuffle(pool).slice(0, 2);
    pattern = Array.from({ length: 6 }, (_, i) => picks[Math.floor(i / 2) % 2]);
  }
  const missingIndex = pattern.length - 1;
  const correct = pattern[missingIndex];
  // Visible count: show all but the last
  const visibleCount = missingIndex;
  // Choices: correct + 2 distractors from same pool
  const distractors = shuffle(pool.filter(t => t.label !== correct.label)).slice(0, 2);
  const choices = shuffle([correct, ...distractors]);
  return { pattern, visibleCount, missingIndex, correct, choices };
}

export default function Niva17() {
  const { speak } = useSpeech();
  const [round, setRound] = useState(0);
  const [data, setData] = useState<Round>(() => buildRound(0));
  const [picked, setPicked] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);
  const [hasIntro, setHasIntro] = useState(false);

  useEffect(() => {
    if (hasIntro) return;
    const t = setTimeout(() => {
      speak('Vad kommer härnäst i mönstret?');
      setHasIntro(true);
    }, 350);
    return () => clearTimeout(t);
  }, [data, speak, hasIntro]);

  const next = () => {
    if (round + 1 >= ROUNDS) {
      const finalStars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      setStars(finalStars);
      completeLevel(17, finalStars);
      setDone(true);
      return;
    }
    setRound(r => r + 1);
    setData(buildRound(round + 1));
    setPicked(null);
    setHasIntro(false);
  };

  const handleAnswer = (label: string) => {
    if (picked || done) return;
    if (label === data.correct.label) {
      setPicked(label);
      hapticNotification('success');
      speak(`Rätt! ${data.correct.label} kommer härnäst.`);
      setTimeout(() => next(), 1400);
    } else {
      setWrong(label);
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
    setMistakes(0);
    setStars(0);
    setDone(false);
    setHasIntro(false);
  };

  const visiblePattern = useMemo(
    () => data.pattern.slice(0, data.visibleCount),
    [data]
  );

  return (
    <GameBackground theme={GAME_THEMES.draken} className="pb-12">
      <DrakenHeader title="Mönsterpalatset" emoji="💠" />

      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-3 bg-white/70 rounded-3xl p-3 shadow-sm ring-2 ring-pink-200">
          <Glittra size={64} />
          <div className="flex-1">
            <div className="text-sm font-bold text-purple-700/70">
              Nivå 17 · Runda {round + 1}/{ROUNDS}
            </div>
            <button
              onClick={() => speak('Vad kommer härnäst i mönstret?')}
              className="text-left text-xl font-black text-pink-700 active:scale-95 transition-transform"
            >
              Vad kommer härnäst? 🔊
            </button>
          </div>
        </div>

        {/* Pattern strip */}
        <div className="relative w-full rounded-[36px] bg-gradient-to-b from-pink-100 via-purple-100 to-violet-200 ring-4 ring-white/70 shadow-xl p-5 mb-4">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {visiblePattern.map((t, i) => (
              <div
                key={i}
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${t.bg} ring-2 ring-white shadow-md flex items-center justify-center text-3xl`}
              >
                {t.emoji}
              </div>
            ))}
            <div className="w-14 h-14 rounded-2xl ring-4 ring-dashed ring-purple-400 bg-white/50 flex items-center justify-center text-3xl font-black text-purple-500 animate-soft-pulse">
              ?
            </div>
          </div>
        </div>

        {/* Choices */}
        <div className="grid grid-cols-3 gap-3">
          {data.choices.map(c => {
            const isCorrect = picked === c.label;
            const isWrong = wrong === c.label;
            return (
              <button
                key={c.label}
                onClick={() => handleAnswer(c.label)}
                disabled={picked !== null}
                className={`p-3 rounded-3xl bg-white shadow-lg ring-4 active:scale-95 transition-all ${
                  isCorrect
                    ? 'ring-amber-300 scale-110'
                    : isWrong
                    ? 'ring-red-300 animate-shake'
                    : 'ring-pink-200'
                }`}
              >
                <div
                  className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${c.bg} ring-2 ring-white flex items-center justify-center text-3xl shadow`}
                >
                  {c.emoji}
                </div>
                <div className="text-xs font-black text-purple-800 mt-1 capitalize">{c.label}</div>
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs font-bold text-purple-900/70 mt-3">
          Hitta nästa form eller färg i mönstret 💠
        </p>
      </div>

      {done && (
        <LevelComplete
          level={17}
          stars={stars}
          islandName="Mönsterpalatset"
          nextHref="/draken/niva18"
          onReplay={replay}
        />
      )}
    </GameBackground>
  );
}
