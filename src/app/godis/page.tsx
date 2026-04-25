'use client';

import { useState, useEffect, useRef } from 'react';
import { numbers } from '@/data/numbers';
import { useSpeech } from '@/hooks/useSpeech';
import { useProgress } from '@/hooks/useProgress';
import { Celebration } from '@/components/Celebration';
import { PageHeader } from '@/components/PageHeader';

const CANDY_EMOJIS = ['🍬', '🍭', '🍫', '🍩', '🍪', '🧁'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Level = 'easy' | 'hard' | 'expert';

type Pile = {
  id: number;
  count: number;
  emoji: string;
  matched: boolean;
  placedValue: number | null;
  shaking: boolean;
};

type DragNum = {
  id: number;
  value: number;
  placed: boolean;
};

type RoundState = { piles: Pile[]; dragNums: DragNum[] };

function generateRound(level: Level): RoundState {
  const pool =
    level === 'easy' ? [1, 2, 3, 4, 5] :
    level === 'hard' ? [1, 2, 3, 4, 5, 6, 7, 8, 9] :
    Array.from({ length: 20 }, (_, i) => i + 1);
  const counts = shuffle(pool).slice(0, 3);
  const emojis = shuffle([...CANDY_EMOJIS]).slice(0, 3);
  const piles: Pile[] = counts.map((count, i) => ({
    id: i,
    count,
    emoji: emojis[i],
    matched: false,
    placedValue: null,
    shaking: false,
  }));
  const dragNums: DragNum[] = shuffle(counts).map((value, id) => ({ id, value, placed: false }));
  return { piles, dragNums };
}

export default function GodisPage() {
  const { speak } = useSpeech();
  const { progress, learnNumber } = useProgress();

  const [level, setLevel] = useState<Level>('easy');
  const [{ piles, dragNums }, setRound] = useState<RoundState>(() => generateRound('easy'));
  const [celebrating, setCelebrating] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const [dragNum, setDragNum] = useState<DragNum | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredPile, setHoveredPile] = useState<number | null>(null);

  const isDraggingRef = useRef(false);
  const dragNumRef = useRef<DragNum | null>(null);
  const justPlacedRef = useRef(false);
  const pileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const placeRef = useRef<(num: DragNum, pileIdx: number) => void>(() => {});

  function startRound(lvl: Level) {
    setRound(generateRound(lvl));
    setCelebrating(false);
  }

  useEffect(() => { startRound(level); }, [level]);

  const pileAt = (x: number, y: number): number =>
    pileRefs.current.findIndex(ref => {
      if (!ref) return false;
      const r = ref.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    });

  const placeNumber = (num: DragNum, pileIdx: number) => {
    const pile = piles[pileIdx];
    if (!pile || pile.matched || celebrating) return;

    if (num.value === pile.count) {
      const newPiles = piles.map((p, i) =>
        i === pileIdx ? { ...p, matched: true, placedValue: num.value, shaking: false } : p,
      );
      const newDragNums = dragNums.map(n => n.id === num.id ? { ...n, placed: true } : n);
      setRound({ piles: newPiles, dragNums: newDragNums });
      learnNumber(num.value);
      setScore(s => s + 1);
      setStreak(s => s + 1);

      if (newPiles.every(p => p.matched)) {
        setTimeout(() => {
          setCelebrating(true);
          speak('Bra jobbat!');
        }, 300);
      } else {
        speak('Rätt!');
      }
    } else {
      setRound(prev => ({
        ...prev,
        piles: prev.piles.map((p, i) => i === pileIdx ? { ...p, shaking: true } : p),
      }));
      setStreak(0);
      speak('Försök igen!');
      setTimeout(() => {
        setRound(prev => ({
          ...prev,
          piles: prev.piles.map((p, i) => i === pileIdx ? { ...p, shaking: false } : p),
        }));
      }, 700);
    }
  };

  placeRef.current = placeNumber;

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      setDragPos({ x: e.clientX, y: e.clientY });
      const idx = pileAt(e.clientX, e.clientY);
      setHoveredPile(idx >= 0 ? idx : null);
    };
    const onUp = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      const idx = pileAt(e.clientX, e.clientY);
      if (idx >= 0 && dragNumRef.current) {
        justPlacedRef.current = true;
        setTimeout(() => { justPlacedRef.current = false; }, 80);
        placeRef.current(dragNumRef.current, idx);
      }
      dragNumRef.current = null;
      setDragNum(null);
      setDragPos(null);
      setHoveredPile(null);
    };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  const handleNumPointerDown = (e: React.PointerEvent, num: DragNum) => {
    if (num.placed || celebrating) return;
    e.preventDefault();
    isDraggingRef.current = true;
    dragNumRef.current = num;
    setDragNum(num);
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const numWord = (v: number) => numbers.find(n => n.value === v)?.word ?? String(v);
  const emojiSize = (count: number) =>
    count <= 3 ? 'text-4xl' : count <= 6 ? 'text-2xl' : count <= 12 ? 'text-xl' : 'text-base';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 pb-12 select-none">
      <PageHeader
        title="Godisspelet"
        emoji="🍬"
        rightContent={
          <span className="text-sm font-black text-gray-500 bg-white/80 rounded-full px-3 py-1 ring-1 ring-gray-200">
            ⭐ {progress.learnedNumbers.length}/21
          </span>
        }
      />

      {/* Level tabs */}
      <div className="flex gap-2 justify-center px-4 pt-5">
        {([
          { key: 'easy', label: '⭐ 1–5' },
          { key: 'hard', label: '⭐⭐ 1–9' },
          { key: 'expert', label: '⭐⭐⭐ 1–20' },
        ] as { key: Level; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setLevel(key)}
            className={`px-4 py-2.5 rounded-full font-black text-sm transition-all ${
              level === key
                ? 'bg-pink-500 text-white shadow-md scale-105'
                : 'bg-white/80 text-gray-600 hover:bg-white ring-1 ring-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center px-4 pt-6 max-w-sm mx-auto gap-6">
        {/* Score row */}
        <div className="flex gap-3">
          <div className="bg-white/80 rounded-2xl px-5 py-2 text-center shadow-sm ring-1 ring-pink-200">
            <div className="text-2xl font-black text-pink-500">{score}</div>
            <div className="text-xs font-bold text-gray-400">poäng</div>
          </div>
          {streak >= 3 && (
            <div className="bg-amber-50 rounded-2xl px-5 py-2 text-center shadow-sm ring-1 ring-amber-200 animate-pulse">
              <div className="text-2xl font-black text-amber-500">{streak} 🔥</div>
              <div className="text-xs font-bold text-gray-400">i rad</div>
            </div>
          )}
        </div>

        {/* Candy piles */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {piles.map((pile, idx) => {
            const isHovered = hoveredPile === idx && !pile.matched && dragNum !== null;
            return (
              <div
                key={pile.id}
                ref={el => { pileRefs.current[idx] = el; }}
                className={`flex flex-col items-center p-3 rounded-3xl min-h-[160px] transition-all duration-200 ${
                  pile.matched
                    ? 'bg-green-100 ring-2 ring-green-400 shadow-md'
                    : pile.shaking
                    ? 'bg-red-50 ring-2 ring-red-300 animate-shake shadow-md'
                    : isHovered
                    ? 'bg-amber-50 ring-2 ring-amber-400 scale-105 shadow-lg'
                    : 'bg-white/80 ring-2 ring-pink-200 shadow-md'
                }`}
              >
                {/* Candy emojis */}
                <div className="flex flex-wrap justify-center gap-0.5 flex-1 items-center py-1">
                  {Array.from({ length: pile.count }, (_, i) => (
                    <span key={i} className={`${emojiSize(pile.count)} leading-tight`}>
                      {pile.emoji}
                    </span>
                  ))}
                </div>
                {/* Drop slot */}
                <div
                  className={`w-full mt-2 py-2 rounded-2xl flex items-center justify-center text-2xl font-black transition-all ${
                    pile.matched
                      ? 'bg-green-400 text-white'
                      : isHovered
                      ? 'bg-amber-100 border-2 border-dashed border-amber-400 text-amber-400'
                      : 'bg-gray-100 border-2 border-dashed border-gray-300 text-gray-300'
                  }`}
                >
                  {pile.matched ? pile.placedValue : '?'}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm font-bold text-gray-400">
          Dra rätt siffra till rätt hög av godis 🍬
        </p>

        {/* Draggable number cards */}
        <div className="flex gap-4 justify-center">
          {dragNums.map(num => {
            const isBeingDragged = dragNum?.id === num.id;
            return (
              <button
                key={num.id}
                onPointerDown={e => handleNumPointerDown(e, num)}
                disabled={num.placed}
                style={{ touchAction: 'none' }}
                className={`w-16 h-16 rounded-3xl flex flex-col items-center justify-center shadow-md transition-all ${
                  num.placed
                    ? 'opacity-0 scale-75 pointer-events-none'
                    : isBeingDragged
                    ? 'bg-gradient-to-br from-pink-200 to-purple-300 text-white opacity-40 scale-90'
                    : 'bg-gradient-to-br from-pink-400 to-purple-500 text-white hover:shadow-lg cursor-grab active:cursor-grabbing'
                }`}
              >
                <div className="text-3xl font-black leading-none">{num.value}</div>
                <div className="text-xs font-bold opacity-70 mt-0.5">{numWord(num.value)}</div>
              </button>
            );
          })}
        </div>

        {celebrating && (
          <button
            onClick={() => startRound(level)}
            className="w-full py-4 rounded-3xl bg-gradient-to-r from-pink-400 to-purple-500 text-white font-black text-xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
          >
            Nästa omgång ➡️
          </button>
        )}
      </div>

      <Celebration active={celebrating} onComplete={() => {}} />

      {/* Floating ghost while dragging */}
      {dragPos && dragNum && (
        <div
          className="fixed pointer-events-none z-50 w-16 h-16 rounded-3xl flex flex-col items-center justify-center bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-2xl"
          style={{
            left: dragPos.x - 32,
            top: dragPos.y - 64,
            transform: 'scale(1.2)',
          }}
        >
          <div className="text-3xl font-black leading-none">{dragNum.value}</div>
          <div className="text-xs font-bold opacity-70 mt-0.5">{numWord(dragNum.value)}</div>
        </div>
      )}
    </div>
  );
}
