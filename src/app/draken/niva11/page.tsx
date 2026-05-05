'use client';

import { useEffect, useState } from 'react';
import { GameBackground } from '@/components/GameBackground';
import { GAME_THEMES } from '@/lib/gameThemes';
import { DrakenHeader } from '@/components/draken/DrakenHeader';
import { Glittra } from '@/components/draken/Glittra';
import { LevelComplete } from '@/components/draken/LevelComplete';
import { useSpeech } from '@/hooks/useSpeech';
import { hapticImpact, hapticNotification } from '@/utils/haptics';
import { completeLevel, unlockNumber } from '@/lib/drakenStorage';

const NUMBER_WORDS_EN = ['noll', 'en', 'två', 'tre', 'fyra', 'fem'];

const SUBJECTS = [
  { e: '🍎', single: 'äpple', plural: 'äpplen', gender: 'ett' as const },
  { e: '🐸', single: 'groda', plural: 'grodor', gender: 'en' as const },
  { e: '⭐', single: 'stjärna', plural: 'stjärnor', gender: 'en' as const },
  { e: '🐝', single: 'bi', plural: 'bin', gender: 'ett' as const },
  { e: '🦋', single: 'fjäril', plural: 'fjärilar', gender: 'en' as const },
  { e: '🍓', single: 'jordgubbe', plural: 'jordgubbar', gender: 'en' as const },
];

const ROUNDS = 5;

function shuffle<T>(a: T[]): T[] {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

function buildRound() {
  const subj = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
  // Pick a + b such that 1 <= a, b and a + b <= 5
  const sum = 2 + Math.floor(Math.random() * 4); // 2..5
  const a = 1 + Math.floor(Math.random() * (sum - 1)); // 1..sum-1
  const b = sum - a;
  const set = new Set<number>([sum]);
  for (let off = 1; set.size < 3 && off < 6; off++) {
    if (sum - off >= 1) set.add(sum - off);
    if (sum + off <= 6) set.add(sum + off);
  }
  const choices = shuffle(Array.from(set).slice(0, 3));
  return { subj, a, b, sum, choices };
}

function part(n: number, subj: typeof SUBJECTS[number]): string {
  if (n === 1) {
    return `${subj.gender === 'en' ? 'en' : 'ett'} ${subj.single}`;
  }
  return `${NUMBER_WORDS_EN[n]} ${subj.plural}`;
}

export default function Niva11() {
  const { speak } = useSpeech();
  const [round, setRound] = useState(0);
  const [data, setData] = useState(buildRound);
  const [picked, setPicked] = useState<number | null>(null);
  const [wrong, setWrong] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);
  const [hasIntro, setHasIntro] = useState(false);

  useEffect(() => {
    if (hasIntro) return;
    const t = setTimeout(() => {
      speak(`${part(data.a, data.subj)} plus ${part(data.b, data.subj)}, hur många blir det?`);
      setHasIntro(true);
    }, 350);
    return () => clearTimeout(t);
  }, [data, speak, hasIntro]);

  const next = () => {
    if (round + 1 >= ROUNDS) {
      const finalStars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      setStars(finalStars);
      completeLevel(11, finalStars);
      setDone(true);
      return;
    }
    setData(buildRound());
    setPicked(null);
    setRound(r => r + 1);
    setHasIntro(false);
  };

  const handleAnswer = (n: number) => {
    if (picked !== null || done) return;
    if (n === data.sum) {
      setPicked(n);
      hapticNotification('success');
      if (n <= 5) unlockNumber(n);
      speak(`Ja! Det blir ${NUMBER_WORDS_EN[n]}!`);
      setTimeout(() => next(), 1500);
    } else {
      setWrong(n);
      setMistakes(m => m + 1);
      hapticImpact('light');
      speak('Försök igen! Räkna alla.');
      setTimeout(() => setWrong(null), 600);
    }
  };

  const replay = () => {
    setData(buildRound());
    setRound(0);
    setMistakes(0);
    setStars(0);
    setDone(false);
    setPicked(null);
    setHasIntro(false);
  };

  return (
    <GameBackground theme={GAME_THEMES.draken} className="pb-12">
      <DrakenHeader title="Plus-Plutten" emoji="➕" />

      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-3 bg-white/70 rounded-3xl p-3 shadow-sm ring-2 ring-rose-200">
          <Glittra size={64} />
          <div className="flex-1">
            <div className="text-sm font-bold text-purple-700/70">Nivå 11 · Runda {round + 1}/{ROUNDS}</div>
            <button
              onClick={() =>
                speak(`${part(data.a, data.subj)} plus ${part(data.b, data.subj)}, hur många blir det?`)
              }
              className="text-left text-xl font-black text-rose-700 active:scale-95 transition-transform"
            >
              Hur många blir det? 🔊
            </button>
          </div>
        </div>

        {/* Equation display */}
        <div
          className="relative w-full rounded-[36px] bg-gradient-to-b from-rose-100 via-pink-100 to-fuchsia-100 ring-4 ring-white/70 shadow-xl overflow-hidden mb-4 p-5"
        >
          <div className="flex items-center justify-around gap-2 flex-wrap">
            {/* Group A */}
            <div className="flex items-center justify-center gap-1 bg-white/70 rounded-2xl p-3 ring-2 ring-rose-200">
              {Array.from({ length: data.a }).map((_, i) => (
                <span
                  key={i}
                  className="text-3xl select-none animate-balloon-float"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {data.subj.e}
                </span>
              ))}
            </div>

            <span className="text-4xl font-black text-rose-600">+</span>

            {/* Group B */}
            <div className="flex items-center justify-center gap-1 bg-white/70 rounded-2xl p-3 ring-2 ring-pink-200">
              {Array.from({ length: data.b }).map((_, i) => (
                <span
                  key={i}
                  className="text-3xl select-none animate-balloon-float"
                  style={{ animationDelay: `${(i + data.a) * 0.1}s` }}
                >
                  {data.subj.e}
                </span>
              ))}
            </div>

            <span className="text-4xl font-black text-rose-600">=</span>
            <span className="text-5xl font-black text-purple-500 animate-wiggle">?</span>
          </div>
        </div>

        {/* Choices */}
        <div className="grid grid-cols-3 gap-3">
          {data.choices.map(n => {
            const isCorrect = picked === n;
            const isWrong = wrong === n;
            return (
              <button
                key={n}
                onClick={() => handleAnswer(n)}
                disabled={picked !== null}
                className={`py-6 rounded-3xl font-black shadow-lg active:scale-95 transition-all ring-4 ${
                  isCorrect
                    ? 'bg-gradient-to-br from-amber-300 to-pink-400 text-white ring-amber-100 scale-110'
                    : isWrong
                    ? 'bg-red-300 text-red-900 ring-red-100 animate-shake'
                    : 'bg-white text-rose-700 ring-rose-200 hover:ring-rose-300'
                }`}
              >
                <div className="text-5xl">{n}</div>
                <div className="text-xs font-bold opacity-70 mt-1">{NUMBER_WORDS_EN[n] ?? n}</div>
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs font-bold text-purple-900/70 mt-3">
          Räkna ihop alla {data.subj.plural}! ➕
        </p>
      </div>

      {done && (
        <LevelComplete
          level={11}
          stars={stars}
          islandName="Plus-Plutten"
          nextHref="/draken/niva12"
          onReplay={replay}
        />
      )}
    </GameBackground>
  );
}
