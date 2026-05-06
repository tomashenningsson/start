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

const ITEMS = ['🐚', '⭐', '🐙', '🐠', '🦀', '🐳', '🍦', '🎈', '🎁', '🍎'];
const SIZES = [40, 64, 100]; // small, medium, large in px

const ROUNDS = 5;

function shuffle<T>(a: T[]): T[] {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

interface Round {
  emoji: string;
  goal: 'störst' | 'minst';
  items: { id: number; size: number }[];
  correctId: number;
}

function buildRound(prevKey?: string): Round {
  let emoji = ITEMS[0];
  let goal: 'störst' | 'minst' = 'störst';
  for (let i = 0; i < 12; i++) {
    emoji = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    goal = Math.random() < 0.5 ? 'störst' : 'minst';
    if (!prevKey || `${emoji}_${goal}` !== prevKey) break;
  }
  const sizes = shuffle(SIZES);
  const items = sizes.map((size, id) => ({ id, size }));
  const correctSize = goal === 'störst' ? Math.max(...sizes) : Math.min(...sizes);
  const correctId = items.find(i => i.size === correctSize)!.id;
  return { emoji, goal, items, correctId };
}

export default function Niva9() {
  const { speak } = useSpeech();
  const [round, setRound] = useState(0);
  const [data, setData] = useState<Round>(buildRound);
  const [picked, setPicked] = useState<number | null>(null);
  const [wrong, setWrong] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);
  const [hasIntro, setHasIntro] = useState(false);

  useEffect(() => {
    if (hasIntro) return;
    const t = setTimeout(() => {
      speak(`Vilken är ${data.goal}?`);
      setHasIntro(true);
    }, 350);
    return () => clearTimeout(t);
  }, [data, speak, hasIntro]);

  const next = () => {
    if (round + 1 >= ROUNDS) {
      const finalStars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      setStars(finalStars);
      completeLevel(9, finalStars);
      setDone(true);
      return;
    }
    setData(buildRound(`${data.emoji}_${data.goal}`));
    setPicked(null);
    setRound(r => r + 1);
    setHasIntro(false);
  };

  const handleAnswer = (id: number) => {
    if (picked !== null || done) return;
    if (id === data.correctId) {
      setPicked(id);
      hapticNotification('success');
      speak(`Ja! Den där är ${data.goal}.`);
      setTimeout(() => next(), 1500);
    } else {
      setWrong(id);
      setMistakes(m => m + 1);
      hapticImpact('light');
      speak('Försök igen! Titta noga.');
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
      <DrakenHeader title="Stora-Lilla Stranden" emoji="🐚" />

      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-3 bg-white/70 rounded-3xl p-3 shadow-sm ring-2 ring-cyan-200">
          <Glittra size={64} />
          <div className="flex-1">
            <div className="text-sm font-bold text-purple-700/70">Nivå 9 · Runda {round + 1}/{ROUNDS}</div>
            <button
              onClick={() => speak(`Vilken är ${data.goal}?`)}
              className="text-left text-xl font-black text-cyan-700 active:scale-95 transition-transform"
            >
              Vilken är{' '}
              <span className={data.goal === 'störst' ? 'text-blue-700' : 'text-pink-600'}>
                {data.goal}
              </span>
              ? 🔊
            </button>
          </div>
        </div>

        {/* Beach scene */}
        <div
          className="relative w-full rounded-[36px] bg-gradient-to-b from-cyan-200 via-blue-300 to-amber-200 ring-4 ring-white/70 shadow-xl overflow-hidden mb-4"
          style={{ height: 280 }}
        >
          <span className="absolute text-3xl opacity-70 select-none animate-float-2" style={{ top: 14, right: 22 }}>☀️</span>
          <span className="absolute text-2xl opacity-60 select-none animate-float-3" style={{ top: 20, left: 14 }}>🐦</span>
          {/* Sand */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-amber-300 to-amber-200" />

          <div className="absolute inset-0 flex items-end justify-around px-4 pb-6">
            {data.items.map(it => {
              const isCorrect = picked === it.id;
              const isWrong = wrong === it.id;
              return (
                <button
                  key={it.id}
                  onClick={() => handleAnswer(it.id)}
                  disabled={picked !== null}
                  className={`select-none active:scale-90 transition-transform rounded-3xl ${
                    isCorrect ? 'animate-draken-pop' : isWrong ? 'animate-shake' : ''
                  }`}
                  style={{
                    fontSize: it.size,
                    filter: isCorrect
                      ? 'drop-shadow(0 8px 16px rgba(250,204,21,0.7))'
                      : 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))',
                  }}
                  aria-label={data.emoji}
                >
                  {data.emoji}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs font-bold text-purple-900/70 mt-3">
          Tryck på den {data.goal}a! 🐚
        </p>
      </div>

      {done && (
        <LevelComplete
          level={9}
          stars={stars}
          islandName="Stora-Lilla Stranden"
          nextHref="/draken/niva10"
          onReplay={replay}
        />
      )}
    </GameBackground>
  );
}
