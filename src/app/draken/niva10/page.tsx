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

const EMOJI_POOL = ['🐱', '🐶', '🦊', '🐻', '🐼', '🐯', '🦁', '🐮', '🐷', '🐸'];

const ROUNDS_CONFIG: number[] = [3, 3, 4]; // 3 rounds: 3 pairs, 3 pairs, 4 pairs

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
  const cards = shuffle([...chosen, ...chosen]).map((emoji, id) => ({
    id,
    emoji,
    flipped: false,
    matched: false,
  }));
  return cards;
}

export default function Niva10() {
  const { speak } = useSpeech();
  const [round, setRound] = useState(0);
  const [cards, setCards] = useState<Card[]>(() => buildBoard(ROUNDS_CONFIG[0]));
  const [firstPick, setFirstPick] = useState<number | null>(null);
  const [secondPick, setSecondPick] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);
  const [hasIntro, setHasIntro] = useState(false);

  const totalPairs = ROUNDS_CONFIG[round];
  const matchedPairs = useMemo(() => cards.filter(c => c.matched).length / 2, [cards]);
  const allMatched = matchedPairs >= totalPairs;

  useEffect(() => {
    if (hasIntro) return;
    const t = setTimeout(() => {
      speak('Hitta paren! Vänd två kort som matchar.');
      setHasIntro(true);
    }, 350);
    return () => clearTimeout(t);
  }, [round, speak, hasIntro]);

  useEffect(() => {
    if (!allMatched || done) return;
    hapticNotification('success');
    speak('Alla par hittade!');
    setTimeout(() => nextRound(), 1300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMatched, done]);

  const nextRound = () => {
    if (round + 1 >= ROUNDS_CONFIG.length) {
      const finalStars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      setStars(finalStars);
      completeLevel(10, finalStars);
      setDone(true);
      return;
    }
    setRound(r => r + 1);
    setCards(buildBoard(ROUNDS_CONFIG[round + 1]));
    setFirstPick(null);
    setSecondPick(null);
    setHasIntro(false);
  };

  const handleTap = (id: number) => {
    if (busy || done) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const newCards = cards.map(c => (c.id === id ? { ...c, flipped: true } : c));
    setCards(newCards);
    hapticImpact('light');

    if (firstPick === null) {
      setFirstPick(id);
      return;
    }

    setSecondPick(id);
    setBusy(true);
    const first = newCards.find(c => c.id === firstPick)!;
    const second = newCards.find(c => c.id === id)!;

    if (first.emoji === second.emoji) {
      setTimeout(() => {
        setCards(prev =>
          prev.map(c => (c.id === first.id || c.id === second.id ? { ...c, matched: true } : c))
        );
        speak('Par!');
        setFirstPick(null);
        setSecondPick(null);
        setBusy(false);
      }, 600);
    } else {
      setMistakes(m => m + 1);
      setTimeout(() => {
        setCards(prev =>
          prev.map(c => (c.id === first.id || c.id === second.id ? { ...c, flipped: false } : c))
        );
        setFirstPick(null);
        setSecondPick(null);
        setBusy(false);
      }, 1100);
    }
  };

  const replay = () => {
    setRound(0);
    setCards(buildBoard(ROUNDS_CONFIG[0]));
    setFirstPick(null);
    setSecondPick(null);
    setBusy(false);
    setMistakes(0);
    setStars(0);
    setDone(false);
    setHasIntro(false);
  };

  // Build grid based on number of cards
  const cols = cards.length === 6 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <GameBackground theme={GAME_THEMES.draken} className="pb-12">
      <DrakenHeader title="Memoryskogen" emoji="🃏" />

      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-3 bg-white/70 rounded-3xl p-3 shadow-sm ring-2 ring-purple-200">
          <Glittra size={64} />
          <div className="flex-1">
            <div className="text-sm font-bold text-purple-700/70">
              Nivå 10 · Runda {round + 1}/{ROUNDS_CONFIG.length} · {matchedPairs}/{totalPairs} par
            </div>
            <button
              onClick={() => speak('Hitta paren! Vänd två kort som matchar.')}
              className="text-left text-xl font-black text-purple-700 active:scale-95 transition-transform"
            >
              Hitta paren! 🔊
            </button>
          </div>
        </div>

        {/* Board */}
        <div
          className="relative w-full rounded-[36px] bg-gradient-to-b from-violet-200 via-purple-200 to-indigo-200 ring-4 ring-white/70 shadow-xl overflow-hidden p-4"
        >
          <div className={`grid ${cols} gap-3`}>
            {cards.map(c => {
              const showFace = c.flipped || c.matched;
              return (
                <button
                  key={c.id}
                  onClick={() => handleTap(c.id)}
                  disabled={c.matched}
                  className={`aspect-square rounded-2xl shadow-lg flex items-center justify-center text-4xl active:scale-95 transition-all ${
                    c.matched
                      ? 'bg-gradient-to-br from-amber-200 to-pink-300 ring-4 ring-amber-200'
                      : showFace
                      ? 'bg-white ring-4 ring-purple-300'
                      : 'bg-gradient-to-br from-violet-500 to-purple-700 ring-4 ring-violet-300'
                  }`}
                >
                  <span className={showFace ? 'animate-draken-pop' : 'opacity-0'}>
                    {showFace ? c.emoji : '?'}
                  </span>
                  {!showFace && <span className="text-3xl text-white/90">⭐</span>}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs font-bold text-purple-900/70 mt-3">
          Vänd två kort åt gången · hitta alla par! 🃏
        </p>
      </div>

      {done && (
        <LevelComplete
          level={10}
          stars={stars}
          islandName="Memoryskogen"
          nextHref="/draken/niva11"
          onReplay={replay}
        />
      )}
    </GameBackground>
  );
}
