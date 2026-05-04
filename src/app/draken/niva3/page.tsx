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

const ANIMALS = [
  { emoji: '🦆', name: 'ankor', single: 'anka' },
  { emoji: '🐸', name: 'grodor', single: 'groda' },
  { emoji: '🐟', name: 'fiskar', single: 'fisk' },
  { emoji: '🐢', name: 'sköldpaddor', single: 'sköldpadda' },
  { emoji: '🦢', name: 'svanar', single: 'svan' },
  { emoji: '🦦', name: 'uttrar', single: 'utter' },
];

// All animals listed below are en-words, so we count "en", "två", "tre"...
const NUMBER_WORDS_EN = ['noll', 'en', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta'];

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
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const count = 1 + Math.floor(Math.random() * 6);
  const set = new Set<number>([count]);
  for (let off = 1; set.size < 3 && off < 8; off++) {
    if (count - off >= 1) set.add(count - off);
    if (count + off <= 8) set.add(count + off);
  }
  const choices = shuffle(Array.from(set).slice(0, 3));
  return { animal, count, choices };
}

export default function Niva3() {
  const { speak } = useSpeech();
  const [round, setRound] = useState(0);
  const [data, setData] = useState(buildRound);
  const [picked, setPicked] = useState<number | null>(null);
  const [wrongPick, setWrongPick] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);
  const [hasIntro, setHasIntro] = useState(false);

  useEffect(() => {
    if (hasIntro) return;
    const t = setTimeout(() => {
      speak(`Räkna alla ${data.animal.name}!`);
      setHasIntro(true);
    }, 350);
    return () => clearTimeout(t);
  }, [data.animal.name, speak, hasIntro]);

  const animals = useMemo(
    () =>
      Array.from({ length: data.count }, (_, i) => ({
        id: i,
        x: 6 + ((i * 23) % 82),
        y: 8 + (Math.floor(i / 3) * 26) + (Math.random() * 5 - 2),
        delay: i * 0.13,
      })),
    [data]
  );

  const next = () => {
    if (round + 1 >= ROUNDS) {
      const finalStars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      setStars(finalStars);
      completeLevel(3, finalStars);
      setDone(true);
      return;
    }
    setData(buildRound());
    setPicked(null);
    setWrongPick(null);
    setRound(r => r + 1);
    setHasIntro(false);
  };

  const handleAnswer = (n: number) => {
    if (picked !== null || done) return;
    if (n === data.count) {
      setPicked(n);
      hapticNotification('success');
      if (n <= 5) unlockNumber(n);
      speak(`Ja! ${NUMBER_WORDS_EN[n]} ${n === 1 ? data.animal.single : data.animal.name}!`);
      setTimeout(() => next(), 1700);
    } else {
      setWrongPick(n);
      setMistakes(m => m + 1);
      hapticImpact('light');
      speak('Försök igen!');
      setTimeout(() => setWrongPick(null), 600);
    }
  };

  const replay = () => {
    setData(buildRound());
    setRound(0);
    setMistakes(0);
    setStars(0);
    setDone(false);
    setPicked(null);
    setWrongPick(null);
    setHasIntro(false);
  };

  return (
    <GameBackground theme={GAME_THEMES.draken} className="pb-12">
      <DrakenHeader title="Räknefloden" emoji="🦆" />

      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-3 bg-white/70 rounded-3xl p-3 shadow-sm ring-2 ring-sky-200">
          <Glittra size={64} />
          <div className="flex-1">
            <div className="text-sm font-bold text-purple-700/70">Nivå 3 · Runda {round + 1}/{ROUNDS}</div>
            <button
              onClick={() => speak(`Hur många ${data.animal.name} ser du?`)}
              className="text-left text-xl font-black text-sky-700 active:scale-95 transition-transform"
            >
              Hur många {data.animal.name}? {data.animal.emoji} 🔊
            </button>
          </div>
        </div>

        {/* River display */}
        <div
          className="relative w-full rounded-[36px] bg-gradient-to-b from-cyan-200 via-sky-300 to-blue-400 ring-4 ring-white/70 shadow-xl overflow-hidden"
          style={{ height: 320 }}
        >
          {/* Wavy water lines */}
          <div className="absolute inset-x-0 top-1/4 h-1 bg-white/30 rounded-full" />
          <div className="absolute inset-x-0 top-2/4 h-1 bg-white/20 rounded-full" />
          <div className="absolute inset-x-0 top-3/4 h-1 bg-white/30 rounded-full" />

          {animals.map(a => (
            <span
              key={a.id}
              className="absolute text-5xl select-none animate-balloon-float"
              style={{
                left: `${a.x}%`,
                top: `${a.y}%`,
                animationDelay: `${a.delay}s`,
                filter: 'drop-shadow(0 4px 8px rgba(2,132,199,0.4))',
              }}
            >
              {data.animal.emoji}
            </span>
          ))}
        </div>

        {/* Choices */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {data.choices.map(n => {
            const isCorrect = picked === n;
            const isWrong = wrongPick === n;
            return (
              <button
                key={n}
                onClick={() => handleAnswer(n)}
                disabled={picked !== null}
                className={`py-6 rounded-3xl font-black shadow-lg active:scale-95 transition-all ring-4 ${
                  isCorrect
                    ? 'bg-gradient-to-br from-amber-300 to-pink-400 text-white ring-amber-100 scale-105'
                    : isWrong
                    ? 'bg-red-300 text-red-900 ring-red-100 animate-shake'
                    : 'bg-white text-sky-700 ring-sky-200 hover:ring-sky-300'
                }`}
              >
                <div className="text-5xl">{n}</div>
                <div className="text-xs font-bold opacity-70 mt-1">{NUMBER_WORDS_EN[n] ?? n}</div>
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs font-bold text-purple-900/70 mt-3">
          Räkna djuren och välj rätt siffra 🐸
        </p>
      </div>

      {done && (
        <LevelComplete
          level={3}
          stars={stars}
          islandName="Räknefloden"
          nextHref="/draken/niva4"
          onReplay={replay}
        />
      )}
    </GameBackground>
  );
}
