'use client';

import { useEffect, useMemo, useState } from 'react';
import { GameBackground } from '@/components/GameBackground';
import { GAME_THEMES } from '@/lib/gameThemes';
import { DrakenHeader } from '@/components/draken/DrakenHeader';
import { useSpeech } from '@/hooks/useSpeech';
import { hapticImpact, hapticNotification } from '@/utils/haptics';
import { recordMiniGameScore, loadDraken } from '@/lib/drakenStorage';
import { letters as ALL_LETTERS } from '@/data/letters';

const GAME_SECONDS = 45;
const GRID_SIZE = 18;

function shuffle<T>(a: T[]): T[] {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

interface Tile {
  id: number;
  letter: string;
  emoji?: string;
}

function buildGrid(target: string): Tile[] {
  const others = shuffle(ALL_LETTERS.filter(l => l.letter !== target)).slice(0, GRID_SIZE - 3);
  const targetData = ALL_LETTERS.find(l => l.letter === target)!;
  const targetTiles: Tile[] = [
    { id: 1, letter: targetData.letter, emoji: targetData.emoji },
    { id: 2, letter: targetData.letter, emoji: targetData.emoji },
    { id: 3, letter: targetData.letter, emoji: targetData.emoji },
  ];
  const otherTiles: Tile[] = others.map((l, i) => ({
    id: 100 + i,
    letter: l.letter,
    emoji: l.emoji,
  }));
  return shuffle([...targetTiles, ...otherTiles]);
}

export default function LetterHunt() {
  const { speak } = useSpeech();
  const [target, setTarget] = useState<string>('A');
  const [grid, setGrid] = useState<Tile[]>([]);
  const [foundIds, setFoundIds] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(GAME_SECONDS);
  const [running, setRunning] = useState(false);
  const [best, setBest] = useState(0);

  const remainingTargets = useMemo(
    () => grid.filter(t => t.letter === target && !foundIds.has(t.id)).length,
    [grid, target, foundIds]
  );

  useEffect(() => {
    setBest(loadDraken().miniGameScores['bokstavsjakt'] ?? 0);
  }, []);

  useEffect(() => {
    if (!running) return;
    if (time <= 0) {
      setRunning(false);
      const updated = recordMiniGameScore('bokstavsjakt', score);
      setBest(updated.miniGameScores['bokstavsjakt'] ?? score);
      speak(`Tiden är slut! Du fick ${score} poäng!`);
      return;
    }
    const t = setTimeout(() => setTime(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, time, score, speak]);

  useEffect(() => {
    if (running && remainingTargets === 0 && grid.length > 0) {
      const newTarget = ALL_LETTERS[Math.floor(Math.random() * ALL_LETTERS.length)].letter;
      setTarget(newTarget);
      setGrid(buildGrid(newTarget));
      setFoundIds(new Set());
      speak(`Nu — hitta ${newTarget}!`);
    }
  }, [remainingTargets, running, grid.length, speak]);

  const start = () => {
    const newTarget = ALL_LETTERS[Math.floor(Math.random() * ALL_LETTERS.length)].letter;
    setTarget(newTarget);
    setGrid(buildGrid(newTarget));
    setFoundIds(new Set());
    setScore(0);
    setTime(GAME_SECONDS);
    setRunning(true);
    speak(`Hitta alla ${newTarget}!`);
  };

  const handleTap = (tile: Tile) => {
    if (!running || foundIds.has(tile.id)) return;
    if (tile.letter === target) {
      setFoundIds(prev => {
        const next = new Set(prev);
        next.add(tile.id);
        return next;
      });
      setScore(s => s + 1);
      hapticImpact('light');
      hapticNotification('success');
      speak(target);
    } else {
      hapticImpact('medium');
      setScore(s => Math.max(0, s - 1));
      speak('Nej!');
    }
  };

  return (
    <GameBackground theme={GAME_THEMES.draken} className="pb-12">
      <DrakenHeader title="Bokstavsjakt" emoji="🔍" backHref="/draken/minispel" />

      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className="flex items-center justify-between gap-2 mb-3 bg-white/80 rounded-2xl px-4 py-2 shadow-sm ring-2 ring-amber-200">
          <div className="text-base font-black text-purple-800">⏱️ {time}s</div>
          <div className="text-base font-black text-amber-600">⭐ {score}</div>
          <div className="text-xs font-bold text-purple-600/70">Bäst: {best}</div>
        </div>

        {running && (
          <div className="mb-3 bg-white/85 rounded-3xl p-3 text-center shadow-md ring-2 ring-orange-200">
            <p className="text-xs font-bold text-purple-700/80">Hitta alla</p>
            <p className="text-5xl font-black text-orange-600 drop-shadow">{target}</p>
          </div>
        )}

        <div
          className="relative w-full rounded-[36px] bg-gradient-to-b from-amber-100 to-orange-200 ring-4 ring-white/70 shadow-xl p-3"
        >
          {!running ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-6xl mb-3">🔍</div>
              <p className="text-lg font-black text-purple-800 mb-1">Bokstavsjakt!</p>
              <p className="text-xs font-bold text-purple-700/80 mb-4 text-center max-w-xs">
                Hitta så många av rätt bokstav som möjligt på {GAME_SECONDS} sekunder.
              </p>
              <button
                onClick={start}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black shadow-md active:scale-95 transition-transform"
              >
                {time === 0 ? 'Spela igen' : 'Starta!'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {grid.map(tile => {
                const found = foundIds.has(tile.id);
                return (
                  <button
                    key={tile.id}
                    onClick={() => handleTap(tile)}
                    disabled={found}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center font-black shadow ring-2 active:scale-95 transition-all ${
                      found
                        ? 'bg-gradient-to-br from-emerald-300 to-green-400 text-white ring-amber-200 scale-95'
                        : 'bg-white text-purple-800 ring-amber-200'
                    }`}
                  >
                    <div className="text-3xl">{found ? '✓' : tile.letter}</div>
                    {!found && tile.emoji && <div className="text-base mt-0.5">{tile.emoji}</div>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-center text-xs font-bold text-purple-900/70 mt-3">
          Tryck på bokstaven du letar efter — undvik fel! 🔤
        </p>
      </div>
    </GameBackground>
  );
}
