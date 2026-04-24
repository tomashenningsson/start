'use client';

import { useState, useCallback, useRef } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { PageHeader } from '@/components/PageHeader';

interface Equation {
  id: number;
  a: number;
  b: number;
  op: '+' | '-';
  result: number;
  options: number[];
  left: number;
  duration: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeOptions(correct: number): number[] {
  const set = new Set([correct]);
  let tries = 0;
  while (set.size < 3 && tries < 30) {
    const delta = Math.floor(Math.random() * 4) + 1;
    const n = correct + (Math.random() > 0.5 ? delta : -delta);
    if (n >= 0) set.add(n);
    tries++;
  }
  let n = 1;
  while (set.size < 3) { if (!set.has(n)) set.add(n); n++; }
  return shuffle(Array.from(set));
}

function makeEquation(score: number, id: number): Equation {
  const maxNum = score < 5 ? 5 : score < 10 ? 8 : score < 20 ? 10 : 12;
  const useSub = score >= 10;
  // Start slow (14s), speed up slightly with score, minimum 7s
  const duration = Math.max(7, 14 - Math.floor(score / 5));
  const left = 8 + Math.random() * 50;

  let a = Math.floor(Math.random() * maxNum) + 1;
  let b = Math.floor(Math.random() * maxNum) + 1;

  if (useSub && Math.random() > 0.55) {
    if (a < b) [a, b] = [b, a];
    return { id, a, b, op: '-', result: a - b, options: makeOptions(a - b), left, duration };
  }
  return { id, a, b, op: '+', result: a + b, options: makeOptions(a + b), left, duration };
}

type GameState = 'idle' | 'playing' | 'gameover';
type Flash = 'correct' | 'wrong' | null;

interface DotsAnim {
  a: number;
  b: number;
  op: '+' | '-';
  result: number;
}

const TABLE_ROW_COLORS = [
  'bg-red-100 text-red-700',
  'bg-orange-100 text-orange-700',
  'bg-amber-100 text-amber-700',
  'bg-yellow-100 text-yellow-700',
  'bg-lime-100 text-lime-700',
  'bg-green-100 text-green-700',
  'bg-teal-100 text-teal-700',
  'bg-cyan-100 text-cyan-700',
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
];

function TimesTableModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-5 w-full max-w-sm max-h-[88vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-gray-800">Gångertabell</h2>
          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-gray-600 transition-colors font-black"
          >
            ✕
          </button>
        </div>
        <div className="space-y-1.5">
          {Array.from({ length: 10 }, (_, row) => (
            <div key={row} className={`rounded-2xl px-3 py-2 ${TABLE_ROW_COLORS[row]}`}>
              <div className="font-black text-sm mb-1">{row + 1} ×</div>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 10 }, (_, col) => (
                  <span key={col} className="inline-block bg-white/70 rounded-lg px-2 py-0.5 text-xs font-black">
                    {col + 1} = {(row + 1) * (col + 1)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LavaZone({ chomping }: { chomping: boolean }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[88px] pointer-events-none">
      <div
        className="absolute inset-0 bg-gradient-to-t from-red-700 via-orange-500 to-amber-400"
        style={{ animation: 'lava-wave 2.5s ease-in-out infinite' }}
      />
      <div
        className={`absolute bottom-2 right-3 text-5xl select-none transition-transform ${chomping ? 'animate-chomp' : ''}`}
      >
        🦖
      </div>
      <div className="absolute bottom-2 left-4 flex gap-1">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="text-2xl select-none"
            style={{ animation: `lava-wave ${1.8 + i * 0.3}s ease-in-out infinite`, display: 'inline-block' }}
          >
            🔥
          </div>
        ))}
      </div>
    </div>
  );
}

function FallingEquation({
  equation,
  onMissed,
}: {
  equation: Equation;
  onMissed: (id: number) => void;
}) {
  return (
    <div
      className="absolute"
      style={{
        left: `${equation.left}%`,
        animation: `equation-fall ${equation.duration}s linear forwards`,
      }}
      onAnimationEnd={() => onMissed(equation.id)}
    >
      <div className="bg-white rounded-2xl px-5 py-3.5 shadow-lg border-2 border-violet-200 whitespace-nowrap">
        <span className="text-3xl font-black text-gray-800">
          {equation.a} {equation.op} {equation.b} = ?
        </span>
      </div>
    </div>
  );
}

export default function MattePage() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [equation, setEquation] = useState<Equation | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [flash, setFlash] = useState<Flash>(null);
  const [dots, setDots] = useState<DotsAnim | null>(null);
  const [dotsPhase, setDotsPhase] = useState<'split' | 'merged'>('split');
  const [chomping, setChomping] = useState(false);
  const [showTable, setShowTable] = useState(false);

  const scoreRef = useRef(0);
  const eqIdRef = useRef(0);
  const livesRef = useRef(3);

  scoreRef.current = score;
  livesRef.current = lives;

  const { progress, updateMathScore } = useProgress();

  const spawnNext = useCallback(() => {
    eqIdRef.current += 1;
    setEquation(makeEquation(scoreRef.current, eqIdRef.current));
  }, []);

  const showFlash = useCallback((type: Flash) => {
    setFlash(type);
    setTimeout(() => setFlash(null), 500);
  }, []);

  const handleMissed = useCallback((id: number) => {
    setEquation(prev => {
      if (!prev || prev.id !== id) return prev;
      showFlash('wrong');
      setChomping(true);
      setTimeout(() => setChomping(false), 700);
      const nl = livesRef.current - 1;
      livesRef.current = nl;
      setLives(nl);
      if (nl <= 0) {
        setGameState('gameover');
      } else {
        setTimeout(spawnNext, 800);
      }
      return null;
    });
  }, [spawnNext, showFlash]);

  const handleAnswer = useCallback((answer: number) => {
    setEquation(prev => {
      if (!prev) return prev;
      const correct = answer === prev.result;

      if (correct) {
        showFlash('correct');
        const ns = scoreRef.current + 1;
        scoreRef.current = ns;
        setScore(ns);
        updateMathScore(ns);

        setDots({ a: prev.a, b: prev.b, op: prev.op, result: prev.result });
        setDotsPhase('split');
        // Slow dot animation: 1500ms to merge, clear at 3500ms
        setTimeout(() => setDotsPhase('merged'), 1500);
        setTimeout(() => setDots(null), 3500);
        setTimeout(spawnNext, 500);
      } else {
        showFlash('wrong');
        const nl = livesRef.current - 1;
        livesRef.current = nl;
        setLives(nl);
        if (nl <= 0) {
          setGameState('gameover');
        } else {
          setTimeout(spawnNext, 600);
        }
      }
      return null;
    });
  }, [spawnNext, showFlash, updateMathScore]);

  const startGame = () => {
    scoreRef.current = 0;
    eqIdRef.current = 0;
    livesRef.current = 3;
    setScore(0);
    setLives(3);
    setEquation(null);
    setFlash(null);
    setDots(null);
    setChomping(false);
    setGameState('playing');
    setTimeout(() => {
      eqIdRef.current = 1;
      setEquation(makeEquation(0, 1));
    }, 700);
  };

  if (gameState === 'idle') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50">
        <PageHeader title="Matte" emoji="➕" />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          <div className="text-8xl mb-6 select-none">🧮</div>
          <h2 className="text-4xl font-black text-gray-800 mb-3">Räkna snabbt!</h2>
          <p className="text-lg text-gray-500 mb-8 max-w-sm font-semibold">
            Tal ramlar ner — välj rätt svar innan det når lavan!
          </p>
          {progress.mathHighScore > 0 && (
            <p className="text-xl font-black text-violet-600 mb-6">
              🏆 Rekord: {progress.mathHighScore} poäng
            </p>
          )}
          <div className="flex flex-col gap-3 items-center w-full max-w-xs">
            <button
              onClick={startGame}
              className="w-full px-12 py-5 rounded-3xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-black text-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
            >
              Starta! 🚀
            </button>
            <button
              onClick={() => setShowTable(true)}
              className="w-full px-8 py-3.5 rounded-3xl bg-white text-violet-600 font-black text-lg shadow ring-1 ring-violet-200 hover:bg-violet-50 active:scale-95 transition-all"
            >
              📊 Gångertabell
            </button>
          </div>
        </div>
        {showTable && <TimesTableModal onClose={() => setShowTable(false)} />}
      </div>
    );
  }

  if (gameState === 'gameover') {
    const isRecord = score >= progress.mathHighScore && score > 0;
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50">
        <PageHeader title="Matte" emoji="➕" />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          <div className="text-8xl mb-6 select-none">🎯</div>
          <h2 className="text-4xl font-black text-gray-800 mb-3">Game Over!</h2>
          <div className="text-6xl font-black text-violet-600 mb-2">{score}</div>
          <div className="text-xl font-bold text-gray-500 mb-4">poäng</div>
          {isRecord && (
            <div className="text-2xl font-black text-amber-500 mb-6 animate-bounce">
              🏆 Nytt rekord!
            </div>
          )}
          <div className="flex flex-col gap-3 items-center w-full max-w-xs mt-4">
            <button
              onClick={startGame}
              className="w-full px-8 py-4 rounded-3xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-black text-xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
            >
              Spela igen 🔄
            </button>
            <button
              onClick={() => setShowTable(true)}
              className="w-full px-8 py-3 rounded-3xl bg-white text-violet-600 font-black text-base shadow ring-1 ring-violet-200 hover:bg-violet-50 active:scale-95 transition-all"
            >
              📊 Gångertabell
            </button>
          </div>
        </div>
        {showTable && <TimesTableModal onClose={() => setShowTable(false)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 overflow-hidden relative select-none">
      {/* Header with score and lives */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-white/60 shadow-sm">
        <div className="text-2xl font-black text-violet-600">{score} p</div>
        <button
          onClick={() => setShowTable(true)}
          className="text-sm font-black text-violet-400 hover:text-violet-600 bg-violet-50 rounded-full px-3 py-1 transition-colors"
        >
          📊
        </button>
        <div className="flex-1" />
        <div className="flex gap-1.5">
          {Array.from({ length: 3 }, (_, i) => (
            <span key={i} className={`text-2xl transition-all ${i < lives ? '' : 'grayscale opacity-30'}`}>
              ❤️
            </span>
          ))}
        </div>
      </div>

      {/* Falling equation area + lava zone */}
      <div className="absolute top-[60px] left-0 right-0 bottom-[118px] overflow-hidden">
        {equation && (
          <FallingEquation
            key={equation.id}
            equation={equation}
            onMissed={handleMissed}
          />
        )}
        <LavaZone chomping={chomping} />
      </div>

      {/* Dots visual when correct */}
      {dots && (
        <div className="fixed bottom-36 left-0 right-0 flex justify-center pointer-events-none z-20 px-4">
          <div className="bg-white/95 rounded-3xl px-6 py-4 shadow-xl border border-violet-100 flex items-center gap-4 max-w-xs">
            <div className={`flex flex-wrap gap-1.5 max-w-[70px] transition-all duration-700 ${dotsPhase === 'merged' ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`}>
              {Array.from({ length: Math.min(dots.a, 10) }, (_, i) => (
                <div key={i} className="w-4 h-4 rounded-full bg-violet-400" />
              ))}
            </div>
            <span className="text-2xl font-black text-gray-500">{dots.op}</span>
            <div className={`flex flex-wrap gap-1.5 max-w-[70px] transition-all duration-700 ${dotsPhase === 'merged' ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`}>
              {Array.from({ length: Math.min(dots.b, 10) }, (_, i) => (
                <div key={i} className="w-4 h-4 rounded-full bg-pink-400" />
              ))}
            </div>
            <div className={`flex flex-col items-center transition-all duration-700 ${dotsPhase === 'merged' ? 'opacity-100 scale-110' : 'opacity-0 scale-50'}`}>
              <div className="flex flex-wrap gap-1 max-w-[80px] justify-center">
                {Array.from({ length: Math.min(dots.result, 12) }, (_, i) => (
                  <div key={i} className="w-4 h-4 rounded-full bg-green-400" />
                ))}
              </div>
              <div className="text-xl font-black text-green-600 mt-1">= {dots.result}</div>
            </div>
          </div>
        </div>
      )}

      {/* Flash feedback */}
      {flash && (
        <div className={`fixed inset-0 pointer-events-none z-30 flex items-center justify-center transition-all ${flash === 'correct' ? 'bg-green-400/15' : 'bg-red-400/15'}`}>
          <div className="text-7xl animate-bounce">{flash === 'correct' ? '✅' : '❌'}</div>
        </div>
      )}

      {/* Answer buttons */}
      <div className="fixed bottom-0 left-0 right-0 safe-bottom z-20">
        <div className="bg-white/90 backdrop-blur-sm border-t border-gray-100 px-4 pt-3 pb-5">
          {equation ? (
            <div className="flex gap-3 justify-center max-w-sm mx-auto">
              {equation.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  className="flex-1 py-5 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white font-black text-3xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 font-bold py-4">Väntar...</div>
          )}
        </div>
      </div>

      {showTable && <TimesTableModal onClose={() => setShowTable(false)} />}
    </div>
  );
}
