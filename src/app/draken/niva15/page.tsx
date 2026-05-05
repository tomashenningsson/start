'use client';

import { useEffect, useState } from 'react';
import { GameBackground } from '@/components/GameBackground';
import { GAME_THEMES } from '@/lib/gameThemes';
import { DrakenHeader } from '@/components/draken/DrakenHeader';
import { Glittra } from '@/components/draken/Glittra';
import { LevelComplete } from '@/components/draken/LevelComplete';
import { useSpeech } from '@/hooks/useSpeech';
import { hapticImpact, hapticNotification } from '@/utils/haptics';
import { completeLevel } from '@/lib/drakenStorage';

interface Food {
  emoji: string;
  name: string;
  type: 'nyttigt' | 'onyttigt';
}

const FOODS: Food[] = [
  { emoji: '🍎', name: 'äpple',     type: 'nyttigt' },
  { emoji: '🥦', name: 'broccoli',  type: 'nyttigt' },
  { emoji: '🥕', name: 'morot',     type: 'nyttigt' },
  { emoji: '🍌', name: 'banan',     type: 'nyttigt' },
  { emoji: '🥗', name: 'sallad',    type: 'nyttigt' },
  { emoji: '🐟', name: 'fisk',      type: 'nyttigt' },
  { emoji: '🍇', name: 'druvor',    type: 'nyttigt' },
  { emoji: '🥛', name: 'mjölk',     type: 'nyttigt' },
  { emoji: '🍞', name: 'bröd',      type: 'nyttigt' },
  { emoji: '🍰', name: 'tårta',     type: 'onyttigt' },
  { emoji: '🍬', name: 'godis',     type: 'onyttigt' },
  { emoji: '🍔', name: 'burgare',   type: 'onyttigt' },
  { emoji: '🍟', name: 'pommes',    type: 'onyttigt' },
  { emoji: '🍩', name: 'munk',      type: 'onyttigt' },
  { emoji: '🥤', name: 'läsk',      type: 'onyttigt' },
  { emoji: '🍫', name: 'choklad',   type: 'onyttigt' },
];

const ROUNDS = 8;

function shuffle<T>(a: T[]): T[] {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

function buildQueue(): Food[] {
  // Mix balanced: 4 nyttigt + 4 onyttigt
  const nyttigt = shuffle(FOODS.filter(f => f.type === 'nyttigt')).slice(0, 4);
  const onyttigt = shuffle(FOODS.filter(f => f.type === 'onyttigt')).slice(0, 4);
  return shuffle([...nyttigt, ...onyttigt]);
}

export default function Niva15() {
  const { speak } = useSpeech();
  const [queue, setQueue] = useState<Food[]>(() => buildQueue());
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<'nyttigt' | 'onyttigt' | null>(null);
  const [wrong, setWrong] = useState<'nyttigt' | 'onyttigt' | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);
  const [hasIntro, setHasIntro] = useState(false);
  const [scoreNyttigt, setScoreNyttigt] = useState(0);
  const [scoreOnyttigt, setScoreOnyttigt] = useState(0);

  const current = queue[round];

  useEffect(() => {
    if (hasIntro) return;
    const t = setTimeout(() => {
      speak(`${current.name}. Är det nyttigt eller onyttigt?`);
      setHasIntro(true);
    }, 350);
    return () => clearTimeout(t);
  }, [current, speak, hasIntro]);

  const next = () => {
    if (round + 1 >= queue.length) {
      const finalStars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      setStars(finalStars);
      completeLevel(15, finalStars);
      setDone(true);
      return;
    }
    setRound(r => r + 1);
    setPicked(null);
    setHasIntro(false);
  };

  const handleAnswer = (choice: 'nyttigt' | 'onyttigt') => {
    if (picked || done) return;
    if (choice === current.type) {
      setPicked(choice);
      hapticNotification('success');
      if (choice === 'nyttigt') {
        setScoreNyttigt(s => s + 1);
        speak(`Ja, ${current.name} är nyttigt!`);
      } else {
        setScoreOnyttigt(s => s + 1);
        speak(`Ja, ${current.name} är godis. Det är okej ibland!`);
      }
      setTimeout(() => next(), 1300);
    } else {
      setWrong(choice);
      setMistakes(m => m + 1);
      hapticImpact('light');
      speak('Hmm, försök igen!');
      setTimeout(() => setWrong(null), 600);
    }
  };

  const replay = () => {
    setQueue(buildQueue());
    setRound(0);
    setPicked(null);
    setMistakes(0);
    setStars(0);
    setDone(false);
    setHasIntro(false);
    setScoreNyttigt(0);
    setScoreOnyttigt(0);
  };

  return (
    <GameBackground theme={GAME_THEMES.draken} className="pb-12">
      <DrakenHeader title="Mat- & Hälsobyn" emoji="🥗" />

      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-3 bg-white/70 rounded-3xl p-3 shadow-sm ring-2 ring-lime-200">
          <Glittra size={64} />
          <div className="flex-1">
            <div className="text-sm font-bold text-purple-700/70">
              Nivå 15 · Runda {round + 1}/{queue.length}
            </div>
            <button
              onClick={() => speak(`${current.name}. Är det nyttigt eller onyttigt?`)}
              className="text-left text-xl font-black text-emerald-700 active:scale-95 transition-transform"
            >
              Sortera maten! 🔊
            </button>
          </div>
        </div>

        {/* Food display */}
        <div
          className="relative w-full rounded-[36px] bg-gradient-to-b from-lime-100 via-emerald-100 to-amber-100 ring-4 ring-white/70 shadow-xl overflow-hidden mb-4 flex flex-col items-center justify-center"
          style={{ height: 220 }}
        >
          <button
            onClick={() => speak(current.name)}
            className="text-9xl select-none animate-balloon-float active:scale-95 transition-transform"
            style={{ filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.18))' }}
            aria-label={current.name}
          >
            {current.emoji}
          </button>
          <div className="bg-white/95 rounded-full px-5 py-1.5 shadow-md ring-2 ring-emerald-200 text-xl font-black text-purple-800 mt-2 capitalize">
            {current.name}
          </div>
        </div>

        {/* Sorting baskets */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleAnswer('nyttigt')}
            disabled={picked !== null}
            className={`p-5 rounded-3xl bg-gradient-to-br from-emerald-300 to-green-500 text-white shadow-lg ring-4 active:scale-95 transition-all ${
              picked === 'nyttigt'
                ? 'ring-amber-300 scale-105'
                : wrong === 'nyttigt'
                ? 'ring-red-300 animate-shake'
                : 'ring-emerald-200'
            }`}
          >
            <div className="text-5xl">🥗</div>
            <div className="text-base font-black mt-1">Nyttigt</div>
            <div className="text-xs font-bold opacity-90 mt-0.5">Frukt & grönt</div>
          </button>
          <button
            onClick={() => handleAnswer('onyttigt')}
            disabled={picked !== null}
            className={`p-5 rounded-3xl bg-gradient-to-br from-pink-300 to-rose-500 text-white shadow-lg ring-4 active:scale-95 transition-all ${
              picked === 'onyttigt'
                ? 'ring-amber-300 scale-105'
                : wrong === 'onyttigt'
                ? 'ring-red-300 animate-shake'
                : 'ring-pink-200'
            }`}
          >
            <div className="text-5xl">🍰</div>
            <div className="text-base font-black mt-1">Godis</div>
            <div className="text-xs font-bold opacity-90 mt-0.5">Bara ibland</div>
          </button>
        </div>

        {/* Score row */}
        <div className="flex justify-around mt-3 bg-white/60 rounded-full px-3 py-2 ring-2 ring-lime-100 text-xs font-black text-purple-800">
          <span>🥗 Nyttigt: {scoreNyttigt}</span>
          <span>🍰 Godis: {scoreOnyttigt}</span>
        </div>

        <p className="text-center text-xs font-bold text-purple-900/70 mt-3">
          Sortera maten — frukt, grönt och godis 🍎🍰
        </p>
      </div>

      {done && (
        <LevelComplete
          level={15}
          stars={stars}
          islandName="Mat- & Hälsobyn"
          nextHref="/draken/niva16"
          onReplay={replay}
        />
      )}
    </GameBackground>
  );
}
