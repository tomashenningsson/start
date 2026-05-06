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

interface Item {
  obj: string;
  def: string; // definite form, e.g. "bananen"
  color: string;
  hex: string;
}

const ITEMS: Item[] = [
  { obj: '🍌', def: 'bananen', color: 'gul', hex: '#facc15' },
  { obj: '🍓', def: 'jordgubben', color: 'röd', hex: '#ef4444' },
  { obj: '🌊', def: 'havet', color: 'blå', hex: '#3b82f6' },
  { obj: '🥕', def: 'moroten', color: 'orange', hex: '#f97316' },
  { obj: '🍆', def: 'auberginen', color: 'lila', hex: '#a855f7' },
  { obj: '🦩', def: 'flamingon', color: 'rosa', hex: '#ec4899' },
  { obj: '🐸', def: 'grodan', color: 'grön', hex: '#22c55e' },
  { obj: '☁️', def: 'molnet', color: 'vit', hex: '#f3f4f6' },
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

function buildRound(prevDef?: string) {
  const candidates = prevDef ? ITEMS.filter(it => it.def !== prevDef) : ITEMS;
  const pool = candidates.length > 0 ? candidates : ITEMS;
  const target = pool[Math.floor(Math.random() * pool.length)];
  const distractors = shuffle(ITEMS.filter(it => it.def !== target.def)).slice(0, 2);
  const choices = shuffle([target, ...distractors]);
  return { target, choices };
}

export default function Niva7() {
  const { speak } = useSpeech();
  const [round, setRound] = useState(0);
  const [data, setData] = useState(buildRound);
  const [picked, setPicked] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);
  const [hasIntro, setHasIntro] = useState(false);

  useEffect(() => {
    if (hasIntro) return;
    const t = setTimeout(() => {
      speak(`Vilken färg har ${data.target.def}?`);
      setHasIntro(true);
    }, 350);
    return () => clearTimeout(t);
  }, [data.target, speak, hasIntro]);

  const next = () => {
    if (round + 1 >= ROUNDS) {
      const finalStars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      setStars(finalStars);
      completeLevel(7, finalStars);
      setDone(true);
      return;
    }
    setData(buildRound(data.target.def));
    setPicked(null);
    setRound(r => r + 1);
    setHasIntro(false);
  };

  const handleAnswer = (color: string) => {
    if (picked || done) return;
    if (color === data.target.color) {
      setPicked(color);
      hapticNotification('success');
      speak(`Ja! ${data.target.def} är ${data.target.color}.`);
      setTimeout(() => next(), 1700);
    } else {
      setWrong(color);
      setMistakes(m => m + 1);
      hapticImpact('light');
      speak('Försök igen!');
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
      <DrakenHeader title="Färgön" emoji="🎨" />

      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-3 bg-white/70 rounded-3xl p-3 shadow-sm ring-2 ring-yellow-200">
          <Glittra size={64} />
          <div className="flex-1">
            <div className="text-sm font-bold text-purple-700/70">Nivå 7 · Runda {round + 1}/{ROUNDS}</div>
            <button
              onClick={() => speak(`Vilken färg har ${data.target.def}?`)}
              className="text-left text-xl font-black text-orange-600 active:scale-95 transition-transform"
            >
              Vilken färg har {data.target.def}? 🔊
            </button>
          </div>
        </div>

        {/* Big object display */}
        <div
          className="relative w-full rounded-[36px] bg-gradient-to-b from-yellow-100 via-orange-100 to-rose-100 ring-4 ring-white/70 shadow-xl overflow-hidden mb-4 flex items-center justify-center"
          style={{ height: 240 }}
        >
          <button
            onClick={() => speak(data.target.def)}
            className="text-9xl select-none animate-balloon-float active:scale-95 transition-transform"
            style={{ filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.18))' }}
          >
            {data.target.obj}
          </button>
        </div>

        {/* Color choices */}
        <div className="grid grid-cols-3 gap-3">
          {data.choices.map(item => {
            const isCorrect = picked === item.color;
            const isWrong = wrong === item.color;
            return (
              <button
                key={item.color}
                onClick={() => handleAnswer(item.color)}
                disabled={picked !== null}
                className={`flex flex-col items-center gap-2 p-3 rounded-3xl bg-white shadow-lg ring-4 active:scale-95 transition-all ${
                  isCorrect
                    ? 'ring-amber-200 scale-110'
                    : isWrong
                    ? 'ring-red-200 animate-shake'
                    : 'ring-purple-100 hover:ring-purple-200'
                }`}
              >
                <div
                  className="w-16 h-16 rounded-full ring-4 ring-white shadow-inner"
                  style={{
                    background: item.color === 'vit'
                      ? 'linear-gradient(135deg, #ffffff, #e5e7eb)'
                      : `radial-gradient(circle at 30% 30%, ${item.hex}dd, ${item.hex})`,
                    boxShadow: `0 6px 16px -4px ${item.hex}80`,
                  }}
                />
                <div className="text-sm font-black text-purple-800 capitalize">{item.color}</div>
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs font-bold text-purple-900/70 mt-3">
          Tryck på rätt färg 🎨
        </p>
      </div>

      {done && (
        <LevelComplete
          level={7}
          stars={stars}
          islandName="Färgön"
          nextHref="/draken/niva8"
          onReplay={replay}
        />
      )}
    </GameBackground>
  );
}
