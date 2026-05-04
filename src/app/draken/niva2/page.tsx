'use client';

import { useEffect, useState } from 'react';
import { GameBackground } from '@/components/GameBackground';
import { GAME_THEMES } from '@/lib/gameThemes';
import { DrakenHeader } from '@/components/draken/DrakenHeader';
import { Glittra } from '@/components/draken/Glittra';
import { LevelComplete } from '@/components/draken/LevelComplete';
import { useSpeech } from '@/hooks/useSpeech';
import { hapticImpact, hapticNotification } from '@/utils/haptics';
import { completeLevel, unlockLetter } from '@/lib/drakenStorage';

interface ForestLetter {
  id: number;
  letter: string;
  emoji: 'tree' | 'mushroom' | 'butterfly' | 'leaf';
  x: number;
  y: number;
}

const POOL = [
  { letter: 'A', word: 'apa' },
  { letter: 'B', word: 'björn' },
  { letter: 'D', word: 'delfin' },
  { letter: 'F', word: 'fisk' },
  { letter: 'K', word: 'katt' },
  { letter: 'L', word: 'lejon' },
  { letter: 'M', word: 'mus' },
  { letter: 'O', word: 'orm' },
  { letter: 'P', word: 'pingvin' },
  { letter: 'R', word: 'räv' },
  { letter: 'S', word: 'sol' },
  { letter: 'T', word: 'tiger' },
];

const ROUNDS = 5;
const FOREST_HOSTS = ['tree', 'mushroom', 'butterfly', 'leaf'] as const;

function shuffle<T>(a: T[]): T[] {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

function buildRound(): { target: typeof POOL[number]; items: ForestLetter[] } {
  const shuffled = shuffle(POOL);
  const target = shuffled[0];
  const others = shuffled.slice(1, 6);
  const all = shuffle([target, ...others]);
  const items: ForestLetter[] = all.map((l, i) => ({
    id: i,
    letter: l.letter,
    emoji: FOREST_HOSTS[i % FOREST_HOSTS.length],
    x: 8 + (i % 3) * 30 + (Math.random() * 6 - 3),
    y: 8 + Math.floor(i / 3) * 32 + (Math.random() * 6 - 3),
  }));
  return { target, items };
}

export default function Niva2() {
  const { speak } = useSpeech();
  const [round, setRound] = useState(0);
  const [{ target, items }, setData] = useState(buildRound);
  const [wrongId, setWrongId] = useState<number | null>(null);
  const [correctId, setCorrectId] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);
  const [hasIntro, setHasIntro] = useState(false);

  useEffect(() => {
    if (hasIntro) return;
    const t = setTimeout(() => {
      speak(`Hitta bokstaven ${target.letter}!`);
      setHasIntro(true);
    }, 350);
    return () => clearTimeout(t);
  }, [target.letter, speak, hasIntro]);

  const next = () => {
    if (round + 1 >= ROUNDS) {
      const finalStars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      setStars(finalStars);
      completeLevel(2, finalStars);
      setDone(true);
      return;
    }
    setData(buildRound());
    setCorrectId(null);
    setRound(r => r + 1);
    setHasIntro(false);
  };

  const handleTap = (item: ForestLetter) => {
    if (correctId !== null || done) return;
    if (item.letter === target.letter) {
      setCorrectId(item.id);
      hapticNotification('success');
      unlockLetter(target.letter);
      setTimeout(() => speak(`${target.letter} som i ${target.word}!`), 100);
      setTimeout(() => next(), 1700);
    } else {
      setWrongId(item.id);
      setMistakes(m => m + 1);
      hapticImpact('light');
      speak('Försök igen!');
      setTimeout(() => setWrongId(null), 600);
    }
  };

  const replay = () => {
    setData(buildRound());
    setRound(0);
    setMistakes(0);
    setStars(0);
    setDone(false);
    setCorrectId(null);
    setHasIntro(false);
  };

  return (
    <GameBackground theme={GAME_THEMES.draken} className="pb-12">
      <DrakenHeader title="Bokstavsskogen" emoji="🌳" />

      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-3 bg-white/70 rounded-3xl p-3 shadow-sm ring-2 ring-emerald-200">
          <Glittra size={64} />
          <div className="flex-1">
            <div className="text-sm font-bold text-purple-700/70">Nivå 2 · Runda {round + 1}/{ROUNDS}</div>
            <button
              onClick={() => speak(`Hitta bokstaven ${target.letter}!`)}
              className="text-left text-xl font-black text-emerald-700 active:scale-95 transition-transform"
            >
              Hitta bokstaven {target.letter}! 🔊
            </button>
          </div>
        </div>

        <div
          className="relative w-full rounded-[36px] bg-gradient-to-b from-emerald-200 via-green-300 to-lime-200 ring-4 ring-white/70 shadow-xl overflow-hidden"
          style={{ height: 440 }}
        >
          {/* Background trees */}
          <span className="absolute text-7xl opacity-40 select-none" style={{ top: '4%', left: '70%' }}>🌲</span>
          <span className="absolute text-6xl opacity-40 select-none" style={{ top: '38%', left: '2%' }}>🌳</span>
          <span className="absolute text-5xl opacity-40 select-none" style={{ top: '68%', right: '4%' }}>🌲</span>
          <span className="absolute text-2xl opacity-50 select-none animate-float-2" style={{ top: '20%', left: '38%' }}>🌼</span>
          <span className="absolute text-2xl opacity-50 select-none animate-float-3" style={{ top: '74%', left: '40%' }}>🌷</span>

          {items.map(item => {
            const isWrong = wrongId === item.id;
            const isCorrect = correctId === item.id;
            const host =
              item.emoji === 'tree' ? '🌳' : item.emoji === 'mushroom' ? '🍄' : item.emoji === 'butterfly' ? '🦋' : '🍃';
            return (
              <button
                key={item.id}
                onClick={() => handleTap(item)}
                disabled={done || correctId !== null}
                className={`absolute flex flex-col items-center active:scale-90 transition-transform ${
                  isWrong ? 'animate-shake' : ''
                } ${isCorrect ? 'animate-draken-pop' : ''}`}
                style={{ left: `${item.x}%`, top: `${item.y}%`, width: 84 }}
              >
                <div className="text-4xl mb-1 drop-shadow select-none">{host}</div>
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg ring-2 transition-colors ${
                    isCorrect
                      ? 'bg-amber-300 text-purple-900 ring-amber-100'
                      : isWrong
                      ? 'bg-red-300 text-red-900 ring-red-100'
                      : 'bg-white text-emerald-700 ring-emerald-200'
                  }`}
                >
                  {item.letter}
                </div>
                {isCorrect && <span className="absolute -top-2 -right-2 text-2xl animate-sparkle-spin">✨</span>}
              </button>
            );
          })}

          {correctId !== null && (
            <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none">
              <div className="bg-white/95 rounded-full px-4 py-2 shadow-lg ring-2 ring-amber-200 text-sm font-black text-purple-800">
                {target.letter} som i {target.word} ✨
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs font-bold text-purple-900/70 mt-3">
          Tryck på rätt bokstav bland träden 🌿
        </p>
      </div>

      {done && (
        <LevelComplete
          level={2}
          stars={stars}
          islandName="Bokstavsskogen"
          nextHref="/draken/niva3"
          onReplay={replay}
        />
      )}
    </GameBackground>
  );
}
