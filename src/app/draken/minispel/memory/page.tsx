'use client';

import { useEffect, useMemo, useState } from 'react';
import { GameBackground } from '@/components/GameBackground';
import { GAME_THEMES } from '@/lib/gameThemes';
import { DrakenHeader } from '@/components/draken/DrakenHeader';
import { useSpeech } from '@/hooks/useSpeech';
import { hapticImpact, hapticNotification } from '@/utils/haptics';
import { recordMiniGameScore, loadDraken } from '@/lib/drakenStorage';

const EMOJI_POOL = ['🐱', '🐶', '🦊', '🐻', '🐼', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦒'];
const PAIRS = 8;

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(a: T[]): T[] {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

function buildBoard(pairs: number): Card[] {
  const chosen = shuffle(EMOJI_POOL).slice(0, pairs);
  return shuffle([...chosen, ...chosen]).map((emoji, id) => ({
    id,
    emoji,
    flipped: false,
    matched: false,
  }));
}

export default function MemoryMiniGame() {
  const { speak } = useSpeech();
  const [cards, setCards] = useState<Card[]>(() => buildBoard(PAIRS));
  const [first, setFirst] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [moves, setMoves] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [best, setBest] = useState(0);

  const matched = useMemo(() => cards.filter(c => c.matched).length / 2, [cards]);

  useEffect(() => {
    setBest(loadDraken().miniGameScores['memory'] ?? 0);
  }, []);

  useEffect(() => {
    if (!running || done) return;
    if (matched >= PAIRS) {
      setDone(true);
      setRunning(false);
      hapticNotification('success');
      // Score: higher is better. Encode as 1000 - moves * 10 (clamped >= 1).
      const score = Math.max(1, 1000 - moves * 10);
      const updated = recordMiniGameScore('memory', score);
      setBest(updated.miniGameScores['memory'] ?? score);
      speak(`Klart! Du klarade det på ${moves} drag!`);
    }
  }, [matched, moves, running, done, speak]);

  const start = () => {
    setCards(buildBoard(PAIRS));
    setFirst(null);
    setBusy(false);
    setMoves(0);
    setDone(false);
    setRunning(true);
    speak('Hitta alla par!');
  };

  const handleTap = (id: number) => {
    if (busy || !running || done) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const newCards = cards.map(c => (c.id === id ? { ...c, flipped: true } : c));
    setCards(newCards);
    hapticImpact('light');

    if (first === null) {
      setFirst(id);
      return;
    }

    setMoves(m => m + 1);
    setBusy(true);
    const a = newCards.find(c => c.id === first)!;
    const b = newCards.find(c => c.id === id)!;

    if (a.emoji === b.emoji) {
      setTimeout(() => {
        setCards(prev =>
          prev.map(c => (c.id === a.id || c.id === b.id ? { ...c, matched: true } : c))
        );
        speak('Par!');
        setFirst(null);
        setBusy(false);
      }, 500);
    } else {
      setTimeout(() => {
        setCards(prev =>
          prev.map(c => (c.id === a.id || c.id === b.id ? { ...c, flipped: false } : c))
        );
        setFirst(null);
        setBusy(false);
      }, 1000);
    }
  };

  return (
    <GameBackground theme={GAME_THEMES.draken} className="pb-12">
      <DrakenHeader title="Memory" emoji="🃏" backHref="/draken/minispel" />

      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className="flex items-center justify-between gap-2 mb-3 bg-white/80 rounded-2xl px-4 py-2 shadow-sm ring-2 ring-purple-200">
          <div className="text-base font-black text-purple-800">🃏 {matched}/{PAIRS}</div>
          <div className="text-base font-black text-amber-600">Drag: {moves}</div>
          <div className="text-xs font-bold text-purple-600/70">Bäst: {best}</div>
        </div>

        {!running && !done && (
          <div className="bg-white/90 rounded-3xl p-6 shadow-xl ring-2 ring-purple-200 text-center">
            <div className="text-6xl mb-3">🃏</div>
            <p className="text-lg font-black text-purple-800 mb-1">Memory!</p>
            <p className="text-xs font-bold text-purple-700/80 mb-4">
              Vänd två kort åt gången och hitta alla par på så få drag som möjligt.
            </p>
            <button
              onClick={start}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white font-black shadow-md active:scale-95 transition-transform"
            >
              Starta!
            </button>
          </div>
        )}

        {(running || done) && (
          <div className="relative w-full rounded-[36px] bg-gradient-to-b from-violet-200 via-purple-200 to-indigo-200 ring-4 ring-white/70 shadow-xl overflow-hidden p-4">
            <div className="grid grid-cols-4 gap-2">
              {cards.map(c => {
                const showFace = c.flipped || c.matched;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleTap(c.id)}
                    disabled={c.matched || done}
                    className={`aspect-square rounded-2xl shadow-lg flex items-center justify-center text-3xl active:scale-95 transition-all ${
                      c.matched
                        ? 'bg-gradient-to-br from-amber-200 to-pink-300 ring-2 ring-amber-200'
                        : showFace
                        ? 'bg-white ring-2 ring-purple-300'
                        : 'bg-gradient-to-br from-violet-500 to-purple-700 ring-2 ring-violet-300'
                    }`}
                  >
                    <span className={showFace ? 'animate-draken-pop' : 'opacity-0'}>
                      {showFace ? c.emoji : '?'}
                    </span>
                    {!showFace && <span className="text-2xl text-white/90">⭐</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {done && (
          <div className="mt-4 bg-white/90 rounded-3xl p-4 shadow-md ring-2 ring-amber-200 text-center">
            <p className="text-base font-black text-purple-800">
              🏆 Klart på {moves} drag!
            </p>
            <button
              onClick={start}
              className="mt-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white font-black shadow active:scale-95 transition-transform"
            >
              Spela igen
            </button>
          </div>
        )}

        <p className="text-center text-xs font-bold text-purple-900/70 mt-3">
          Hitta alla par på så få drag som möjligt 🃏
        </p>
      </div>
    </GameBackground>
  );
}
