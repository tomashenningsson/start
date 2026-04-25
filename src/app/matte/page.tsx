'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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
interface DotsAnim { a: number; b: number; op: '+' | '-'; result: number; }

function LavaMonster({ chompDx }: { chompDx: number | null }) {
  const chomping = chompDx !== null;
  const style: React.CSSProperties = chomping
    ? {
        ['--chomp-dx' as string]: `${chompDx}px`,
        ['--chomp-dx-70' as string]: `${chompDx * 0.7}px`,
        ['--chomp-dx-30' as string]: `${chompDx * 0.3}px`,
      }
    : {};
  return (
    <svg
      viewBox="0 0 64 64"
      style={style}
      className={`w-14 h-14 drop-shadow-lg select-none ${chomping ? 'animate-chomp-to' : ''}`}
    >
      <polygon points="16,22 11,4 22,19" fill="#b91c1c" />
      <polygon points="48,22 53,4 42,19" fill="#b91c1c" />
      <ellipse cx="32" cy="38" rx="26" ry="24" fill="#f97316" />
      <ellipse cx="30" cy="35" rx="16" ry="13" fill="#fb923c" opacity="0.5" />
      <circle cx="22" cy="33" r="8" fill="#fef9c3" />
      <circle cx="42" cy="33" r="8" fill="#fef9c3" />
      <circle cx="22" cy="33" r="5" fill="#f59e0b" />
      <circle cx="42" cy="33" r="5" fill="#f59e0b" />
      <circle cx="23" cy="32" r="3" fill="#1c1917" />
      <circle cx="43" cy="32" r="3" fill="#1c1917" />
      <circle cx="24" cy="31" r="1.2" fill="white" />
      <circle cx="44" cy="31" r="1.2" fill="white" />
      <path d="M 18 48 Q 32 60 46 48" fill="#7f1d1d" />
      <polygon points="20,48 23,54 26,48" fill="white" />
      <polygon points="28,48 31,56 34,48" fill="white" />
      <polygon points="36,48 39,54 42,48" fill="white" />
      <ellipse cx="31" cy="59" rx="2.5" ry="3.5" fill="#fb923c" opacity="0.7" />
    </svg>
  );
}

function LavaZone({ chompDx }: { chompDx: number | null }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[72px] pointer-events-none">
      <div
        className="absolute inset-0 bg-gradient-to-t from-red-700 via-orange-500 to-amber-400"
        style={{ animation: 'lava-wave 2.4s ease-in-out infinite' }}
      />
      <div className="absolute bottom-1 right-2">
        <LavaMonster chompDx={chompDx} />
      </div>
    </div>
  );
}

interface FallingEquationProps {
  equation: Equation;
  burning: boolean;
  onMissed: (id: number, cardCenterX: number) => void;
  penaltyRef: React.MutableRefObject<(() => void) | null>;
}

function FallingEquation({ equation, burning, onMissed, penaltyRef }: FallingEquationProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [penaltyState, setPenaltyState] = useState<{ top: number; duration: number } | null>(null);

  const applyPenalty = useCallback(() => {
    const el = divRef.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;

    const elRect = el.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    const currentTop = elRect.top - parentRect.top;
    const lavaTop = parent.offsetHeight - 132;
    const remaining = lavaTop - currentTop;
    if (remaining <= 10) return;

    const newTop = currentTop + remaining * 0.5;
    const totalRange = lavaTop + 100; // -100px to lavaTop
    const newDuration = equation.duration * (lavaTop - newTop) / totalRange;

    setPenaltyState({ top: newTop, duration: Math.max(0.3, newDuration) });
  }, [equation.duration]);

  useEffect(() => {
    penaltyRef.current = applyPenalty;
    return () => { penaltyRef.current = null; };
  }, [applyPenalty, penaltyRef]);

  const handleAnimEnd = (e: React.AnimationEvent) => {
    if (e.animationName === 'equation-fall' || e.animationName === 'equation-fall-from') {
      // Measure card center so monster can jump exactly to it
      const el = divRef.current;
      const parent = el?.parentElement;
      let centerX = -1;
      if (el && parent) {
        const elRect = el.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        centerX = elRect.left - parentRect.left + elRect.width / 2;
      }
      onMissed(equation.id, centerX);
    }
  };

  const style: React.CSSProperties = penaltyState
    ? {
        top: `${penaltyState.top}px`,
        left: `${equation.left}%`,
        ['--fall-from' as string]: `${penaltyState.top}px`,
        animation: `equation-fall-from ${penaltyState.duration}s linear forwards`,
      }
    : {
        left: `${equation.left}%`,
        animation: `equation-fall ${equation.duration}s linear forwards`,
      };

  return (
    <div ref={divRef} className="absolute" style={style} onAnimationEnd={handleAnimEnd}>
      <div
        className={`bg-white rounded-2xl px-5 py-3.5 shadow-lg border-2 whitespace-nowrap transition-colors ${
          burning ? 'border-orange-400 animate-burn' : 'border-violet-200'
        }`}
      >
        <span className="text-3xl font-black text-gray-800">
          {equation.a} {equation.op} {equation.b} = ?
        </span>
        {burning && <span className="ml-2 text-2xl select-none">🔥</span>}
      </div>
    </div>
  );
}

function TimesTableModal({ onClose }: { onClose: () => void }) {
  const [selRow, setSelRow] = useState<number | null>(null);
  const [selCol, setSelCol] = useState<number | null>(null);
  const product = selRow !== null && selCol !== null ? selRow * selCol : null;
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2" onClick={onClose}>
      <div
        className="bg-white rounded-3xl p-4 w-full max-w-sm max-h-[94vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-black text-gray-800">Gångertabell</h2>
          <button onClick={onClose} className="text-xl text-gray-400 hover:text-gray-600 font-black">✕</button>
        </div>
        <div className="h-10 flex items-center justify-center mb-2">
          {product !== null ? (
            <div className="text-2xl font-black text-amber-600 bg-amber-50 rounded-2xl px-5 py-1">
              {selRow} × {selCol} = {product}
            </div>
          ) : (
            <p className="text-xs text-gray-400 font-bold">Tryck på ett tal i vänstra kolumnen och övre raden</p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0.5 text-xs font-black">
            <thead>
              <tr>
                <th className="w-7 h-7 text-gray-300 text-center">×</th>
                {nums.map(c => (
                  <th key={c}
                    onClick={() => setSelCol(selCol === c ? null : c)}
                    className={`w-7 h-7 rounded-lg cursor-pointer transition-all text-center ${
                      selCol === c ? 'bg-violet-500 text-white shadow-md scale-110' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                    }`}
                  >{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nums.map(r => (
                <tr key={r}>
                  <th
                    onClick={() => setSelRow(selRow === r ? null : r)}
                    className={`w-7 h-7 rounded-lg cursor-pointer transition-all text-center ${
                      selRow === r ? 'bg-rose-500 text-white shadow-md scale-110' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                    }`}
                  >{r}</th>
                  {nums.map(c => {
                    const isHit = selRow === r && selCol === c;
                    return (
                      <td key={c}
                        className={`w-7 h-7 rounded-lg text-center transition-all ${
                          isHit ? 'bg-amber-400 text-white shadow-lg font-black text-sm ring-2 ring-amber-500'
                            : selRow === r ? 'bg-rose-100 text-rose-800'
                            : selCol === c ? 'bg-violet-100 text-violet-800'
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >{r * c}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function MattePage() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [equation, setEquation] = useState<Equation | null>(null);
  const [burningId, setBurningId] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [flash, setFlash] = useState<Flash>(null);
  const [dots, setDots] = useState<DotsAnim | null>(null);
  const [dotsPhase, setDotsPhase] = useState<'split' | 'merged'>('split');
  const [chompDx, setChompDx] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const scoreRef = useRef(0);
  const eqIdRef = useRef(0);
  const livesRef = useRef(3);
  const equationPenaltyRef = useRef<(() => void) | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  scoreRef.current = score;
  livesRef.current = lives;

  const { progress, updateMathScore } = useProgress();

  const spawnNext = useCallback(() => {
    eqIdRef.current += 1;
    setBurningId(null);
    setEquation(makeEquation(scoreRef.current, eqIdRef.current));
  }, []);

  const showFlash = useCallback((type: Flash) => {
    setFlash(type);
    setTimeout(() => setFlash(null), 500);
  }, []);

  const handleMissed = useCallback((id: number, cardCenterX: number) => {
    // Compute horizontal offset so monster slides to where the equation landed
    const gameArea = gameAreaRef.current;
    if (gameArea) {
      // Monster center from left: right-2 (8px gap) + w-14/2 (28px) from right edge
      const monsterCenterX = gameArea.offsetWidth - 36;
      setChompDx(cardCenterX >= 0 ? cardCenterX - monsterCenterX : -60);
    }
    setBurningId(id);
    showFlash('wrong');
    const nl = livesRef.current - 1;
    livesRef.current = nl;
    setLives(nl);
    if (nl <= 0) {
      setTimeout(() => setGameState('gameover'), 800);
    } else {
      setTimeout(spawnNext, 900);
    }
    setTimeout(() => setChompDx(null), 880);
    // Clear the burning equation after burn animation completes
    setTimeout(() => { setBurningId(null); setEquation(null); }, 700);
  }, [spawnNext, showFlash]);

  const handleAnswer = useCallback((answer: number) => {
    setEquation(prev => {
      if (!prev) return prev;
      if (answer === prev.result) {
        showFlash('correct');
        const ns = scoreRef.current + 1;
        scoreRef.current = ns;
        setScore(ns);
        updateMathScore(ns);
        setDots({ a: prev.a, b: prev.b, op: prev.op, result: prev.result });
        setDotsPhase('split');
        setTimeout(() => setDotsPhase('merged'), 1500);
        setTimeout(() => setDots(null), 3500);
        setTimeout(spawnNext, 500);
        return null;
      } else {
        // Wrong answer: penalty only — no life lost, same equation continues
        showFlash('wrong');
        equationPenaltyRef.current?.();
        return prev;
      }
    });
  }, [spawnNext, showFlash, updateMathScore]);

  const startGame = () => {
    scoreRef.current = 0; eqIdRef.current = 0; livesRef.current = 3;
    setScore(0); setLives(3); setEquation(null); setFlash(null);
    setBurningId(null); setDots(null); setChompDx(null); setGameState('playing');
    setTimeout(() => { eqIdRef.current = 1; setEquation(makeEquation(0, 1)); }, 700);
  };

  if (gameState === 'idle') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50">
        <PageHeader title="Lavamonstret" emoji="🌋" />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          <div className="text-8xl mb-6 select-none">🌋</div>
          <h2 className="text-4xl font-black text-gray-800 mb-3">Rädda talen!</h2>
          <p className="text-lg text-gray-500 mb-8 max-w-sm font-semibold">
            Tal faller mot lavan — räkna rätt och rädda dem innan monstret äter dem!
          </p>
          {progress.mathHighScore > 0 && (
            <p className="text-xl font-black text-violet-600 mb-6">🏆 Rekord: {progress.mathHighScore} poäng</p>
          )}
          <div className="flex flex-col gap-3 items-center w-full max-w-xs">
            <button onClick={startGame}
              className="w-full px-12 py-5 rounded-3xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-black text-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
            >Starta! 🚀</button>
            <button onClick={() => setShowTable(true)}
              className="w-full px-8 py-3.5 rounded-3xl bg-white text-violet-600 font-black text-lg shadow ring-1 ring-violet-200 hover:bg-violet-50 active:scale-95 transition-all"
            >📊 Gångertabell</button>
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
        <PageHeader title="Lavamonstret" emoji="🌋" />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          <div className="text-8xl mb-6 select-none">🎯</div>
          <h2 className="text-4xl font-black text-gray-800 mb-3">Game Over!</h2>
          <div className="text-6xl font-black text-violet-600 mb-2">{score}</div>
          <div className="text-xl font-bold text-gray-500 mb-4">poäng</div>
          {isRecord && <div className="text-2xl font-black text-amber-500 mb-6 animate-bounce">🏆 Nytt rekord!</div>}
          <div className="flex flex-col gap-3 items-center w-full max-w-xs mt-4">
            <button onClick={startGame}
              className="w-full px-8 py-4 rounded-3xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-black text-xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
            >Spela igen 🔄</button>
            <button onClick={() => setShowTable(true)}
              className="w-full px-8 py-3 rounded-3xl bg-white text-violet-600 font-black text-base shadow ring-1 ring-violet-200 hover:bg-violet-50 active:scale-95 transition-all"
            >📊 Gångertabell</button>
          </div>
        </div>
        {showTable && <TimesTableModal onClose={() => setShowTable(false)} />}
      </div>
    );
  }

  // Playing state
  return (
    <div className="flex flex-col bg-gradient-to-br from-violet-50 to-purple-50 overflow-hidden select-none" style={{ height: '100dvh' }}>
      {/* Score bar */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-sm border-b border-white/60 shadow-sm z-10 safe-top">
        <div className="text-xl font-black text-violet-600">{score} p</div>
        <button onClick={() => setShowTable(true)}
          className="text-xs font-black text-violet-400 hover:text-violet-600 bg-violet-50 rounded-full px-2.5 py-1 transition-colors"
        >📊</button>
        <div className="flex-1" />
        <div className="flex gap-1">
          {Array.from({ length: 3 }, (_, i) => (
            <span key={i} className={`text-xl transition-all ${i < lives ? '' : 'grayscale opacity-30'}`}>❤️</span>
          ))}
        </div>
      </div>

      {/* Game area */}
      <div ref={gameAreaRef} className="flex-1 relative overflow-hidden min-h-0">
        {equation && (
          <FallingEquation
            key={equation.id}
            equation={equation}
            burning={equation.id === burningId}
            onMissed={handleMissed}
            penaltyRef={equationPenaltyRef}
          />
        )}
        <LavaZone chompDx={chompDx} />
      </div>

      {/* Answer buttons */}
      <div className="flex-shrink-0 z-20 bg-white/90 backdrop-blur-sm border-t border-gray-100 px-4 pt-2 pb-3 safe-bottom">
        {equation && burningId === null ? (
          <div className="flex gap-3 justify-center max-w-sm mx-auto">
            {equation.options.map((opt, i) => (
              <button key={i} onClick={() => handleAnswer(opt)}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white font-black text-3xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >{opt}</button>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 font-bold py-3">Väntar...</div>
        )}
      </div>

      {/* Dot animation */}
      {dots && (
        <div className="fixed inset-x-0 bottom-36 flex justify-center pointer-events-none z-20 px-4">
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

      {/* Flash overlay */}
      {flash && (
        <div className={`fixed inset-0 pointer-events-none z-30 flex items-center justify-center ${flash === 'correct' ? 'bg-green-400/15' : 'bg-red-400/15'}`}>
          <div className="text-7xl animate-bounce">{flash === 'correct' ? '✅' : '❌'}</div>
        </div>
      )}

      {showTable && <TimesTableModal onClose={() => setShowTable(false)} />}
    </div>
  );
}
