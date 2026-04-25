'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSpeech } from '@/hooks/useSpeech';
import { useProgress } from '@/hooks/useProgress';
import { PageHeader } from '@/components/PageHeader';
import { GameBackground } from '@/components/GameBackground';
import { GAME_THEMES } from '@/lib/gameThemes';

type Level = 1 | 2 | 3;
type GamePhase = 'idle' | 'playing' | 'feedback' | 'gameover';
type Side = 'left' | 'right';

interface Expr {
  display: string;
  value: number;
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeExpr(level: Level, score: number): Expr {
  type Op = '+' | '−' | '×' | '÷';
  const opPool: Op[] =
    level === 1 ? ['+'] :
    level === 2 ? ['+', '+', '−'] :
    ['+', '−', '×', '×', '÷'];

  const op = opPool[Math.floor(Math.random() * opPool.length)];

  if (op === '+') {
    const max = score < 5 ? 9 : score < 15 ? 14 : 19;
    const a = rand(1, max), b = rand(1, max);
    return { display: `${a} + ${b}`, value: a + b };
  }
  if (op === '−') {
    const max = score < 5 ? 12 : score < 15 ? 18 : 20;
    const b = rand(1, max - 1);
    const a = rand(b + 1, max);
    return { display: `${a} − ${b}`, value: a - b };
  }
  if (op === '×') {
    const hi = score < 10 ? 5 : 9;
    const a = rand(2, hi), b = rand(2, hi);
    return { display: `${a} × ${b}`, value: a * b };
  }
  // ÷ — always a clean division
  const divisor = rand(2, 5);
  const quotient = rand(2, 9);
  return { display: `${divisor * quotient} ÷ ${divisor}`, value: quotient };
}

function genPair(level: Level, score: number): [Expr, Expr] {
  let left = makeExpr(level, score);
  let right = makeExpr(level, score);
  for (let i = 0; i < 20 && left.value === right.value; i++) {
    right = makeExpr(level, score);
  }
  return [left, right];
}

function getTimeLimit(score: number): number {
  if (score < 5) return 6;
  if (score < 10) return 5;
  if (score < 20) return 4;
  return 3;
}

// ─── Game card (defined outside to prevent remount on each render) ───────────

interface CardProps {
  side: Side;
  expr: Expr;
  phase: GamePhase;
  feedback: { correct: Side; chosen: Side | null } | null;
  onAnswer: (side: Side) => void;
}

function GameCard({ side, expr, phase, feedback, onAnswer }: CardProps) {
  const isCorrect = feedback?.correct === side;
  const isChosen = feedback?.chosen === side;
  const wasWrong = phase === 'feedback' && isChosen && !isCorrect;
  const isGreen = phase === 'feedback' && isCorrect;
  const isFaded = phase === 'feedback' && !isCorrect && !wasWrong;

  let cardClass = 'bg-white/90 ring-2 ring-indigo-200 hover:ring-indigo-400 hover:shadow-xl cursor-pointer';
  if (isGreen) cardClass = 'bg-green-100 ring-4 ring-green-400';
  else if (wasWrong) cardClass = 'bg-red-100 ring-4 ring-red-400';
  else if (isFaded) cardClass = 'bg-gray-100 ring-2 ring-gray-200 opacity-50';

  const isLong = expr.display.length > 7;
  let textClass = isLong ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl';
  let textColor = 'text-gray-800';
  if (isGreen) textColor = 'text-green-700';
  else if (wasWrong) textColor = 'text-red-600';
  else if (isFaded) textColor = 'text-gray-500';

  return (
    <button
      onClick={() => onAnswer(side)}
      disabled={phase !== 'playing'}
      className={`flex-1 min-h-[170px] rounded-3xl flex flex-col items-center justify-center gap-2 shadow-lg transition-all duration-200 select-none ${cardClass} ${
        phase === 'playing' ? 'active:scale-95' : 'cursor-default'
      }`}
    >
      <div className={`font-black text-center px-2 leading-tight ${textClass} ${textColor}`}>
        {expr.display}
      </div>

      {phase === 'feedback' ? (
        <div className={`text-xl font-black ${
          isGreen ? 'text-green-600' : wasWrong ? 'text-red-500' : 'text-gray-400'
        }`}>
          = {expr.value}
          {isGreen && isChosen && ' ✅'}
          {wasWrong && ' ❌'}
          {isGreen && !isChosen && ' ←'}
        </div>
      ) : (
        <div className="text-3xl font-black text-indigo-200">?</div>
      )}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StorstPage() {
  const { speak } = useSpeech();
  const { progress, updateMathScore } = useProgress();

  const [phase, setPhase] = useState<GamePhase>('idle');
  const [level, setLevel] = useState<Level>(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [roundKey, setRoundKey] = useState(0);
  const [exprs, setExprs] = useState<[Expr, Expr]>(() => genPair(1, 0));
  const [feedback, setFeedback] = useState<{ correct: Side; chosen: Side | null } | null>(null);
  const [timeLeft, setTimeLeft] = useState(1);

  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const levelRef = useRef<Level>(1);
  const lockedRef = useRef(false);
  const visualRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const handleAnswerRef = useRef<((s: Side | null) => void) | null>(null);

  scoreRef.current = score;
  livesRef.current = lives;
  levelRef.current = level;

  const stopTimers = useCallback(() => {
    if (visualRef.current) { clearInterval(visualRef.current); visualRef.current = null; }
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  const nextRound = useCallback((s: number, l: number) => {
    if (l <= 0) { setPhase('gameover'); return; }
    stopTimers();
    lockedRef.current = false;
    setExprs(genPair(levelRef.current, s));
    setFeedback(null);
    setTimeLeft(1);
    setPhase('playing');
    setRoundKey(k => k + 1);
  }, [stopTimers]);

  const handleAnswer = useCallback((chosen: Side | null) => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    stopTimers();

    setExprs(prev => {
      const [l, r] = prev;
      const correctSide: Side = l.value > r.value ? 'left' : 'right';
      const isCorrect = chosen !== null && chosen === correctSide;

      setFeedback({ correct: correctSide, chosen });
      setPhase('feedback');

      if (isCorrect) {
        speak('Rätt!');
        const ns = scoreRef.current + 1;
        scoreRef.current = ns;
        setScore(ns);
        updateMathScore(ns);
        setTimeout(() => nextRound(ns, livesRef.current), 1200);
      } else {
        speak(chosen === null ? 'För långsamt!' : 'Fel!');
        const nl = livesRef.current - 1;
        livesRef.current = nl;
        setLives(nl);
        setTimeout(() => nextRound(scoreRef.current, nl), 1200);
      }
      return prev;
    });
  }, [stopTimers, nextRound, speak, updateMathScore]);

  handleAnswerRef.current = handleAnswer;

  // Timer — resets on each new round
  useEffect(() => {
    if (phase !== 'playing') return;
    const limit = getTimeLimit(scoreRef.current) * 1000;
    const startMs = Date.now();

    visualRef.current = setInterval(() => {
      setTimeLeft(Math.max(0, 1 - (Date.now() - startMs) / limit));
    }, 50);

    timerRef.current = setTimeout(() => {
      stopTimers();
      setTimeLeft(0);
      handleAnswerRef.current?.(null);
    }, limit);

    return stopTimers;
  }, [roundKey, phase, stopTimers]);

  const startGame = useCallback(() => {
    stopTimers();
    scoreRef.current = 0;
    livesRef.current = 3;
    lockedRef.current = false;
    setScore(0);
    setLives(3);
    setFeedback(null);
    setTimeLeft(1);
    setExprs(genPair(levelRef.current, 0));
    setPhase('playing');
    setRoundKey(k => k + 1);
  }, [stopTimers]);

  const timerColor =
    timeLeft > 0.5 ? 'bg-green-400' :
    timeLeft > 0.25 ? 'bg-amber-400' :
    'bg-red-400';

  // ── Idle screen ─────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <GameBackground theme={GAME_THEMES.storst}>
        <PageHeader title="Störst!" emoji="⚡" />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center gap-6">
          <div className="text-8xl select-none">⚡</div>
          <div>
            <h2 className="text-4xl font-black text-white mb-2">Vem är störst?</h2>
            <p className="text-lg text-white/70 font-semibold max-w-xs">
              Tryck snabbt på uttrycket med det STÖRST värdet — innan tiden tar slut!
            </p>
          </div>
          {progress.mathHighScore > 0 && (
            <p className="text-xl font-black text-indigo-300">
              🏆 Rekord: {progress.mathHighScore} poäng
            </p>
          )}

          {/* Level picker */}
          <div className="flex flex-col gap-2.5 w-full max-w-xs">
            {([1, 2, 3] as Level[]).map(l => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all ${
                  level === l
                    ? 'bg-indigo-500 text-white shadow-md scale-105'
                    : 'bg-white/10 text-white/70 ring-1 ring-white/20 hover:bg-white/20'
                }`}
              >
                {l === 1 && '⭐ Nivå 1 — Plus'}
                {l === 2 && '⭐⭐ Nivå 2 — Plus & minus'}
                {l === 3 && '⭐⭐⭐ Nivå 3 — Alla räknesätt'}
              </button>
            ))}
          </div>

          <button
            onClick={startGame}
            className="w-full max-w-xs py-5 rounded-3xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-black text-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
          >
            Starta! ⚡
          </button>
        </div>
      </GameBackground>
    );
  }

  // ── Game over screen ─────────────────────────────────────────────────────────
  if (phase === 'gameover') {
    const isRecord = score > 0 && score >= progress.mathHighScore;
    return (
      <GameBackground theme={GAME_THEMES.storst}>
        <PageHeader title="Störst!" emoji="⚡" />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center gap-6">
          <div className="text-8xl select-none">🎯</div>
          <h2 className="text-4xl font-black text-white">Game Over!</h2>
          <div>
            <div className="text-6xl font-black text-indigo-300">{score}</div>
            <div className="text-xl font-bold text-white/70">poäng</div>
          </div>
          {isRecord && (
            <div className="text-2xl font-black text-amber-500 animate-bounce">
              🏆 Nytt rekord!
            </div>
          )}
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={startGame}
              className="w-full py-4 rounded-3xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-black text-xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
            >
              Spela igen 🔄
            </button>
            <button
              onClick={() => setPhase('idle')}
              className="w-full py-3.5 rounded-2xl bg-white/10 text-indigo-300 font-black text-base shadow ring-1 ring-indigo-400/40 hover:bg-indigo-900/50 active:scale-95 transition-all"
            >
              Byt nivå
            </button>
          </div>
        </div>
      </GameBackground>
    );
  }

  // ── Playing / feedback ───────────────────────────────────────────────────────
  const statusMsg =
    phase === 'feedback'
      ? feedback?.chosen === feedback?.correct ? '🎉 Rätt!' :
        feedback?.chosen === null ? '⏰ För långsamt!' : '❌ Fel svar!'
      : 'Vilket uttryck är STÖRST?';

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: GAME_THEMES.storst.gradient }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute w-[420px] h-[420px] rounded-full blur-3xl opacity-30 animate-aurora-1" style={{ top: '-12%', right: '-8%', background: 'radial-gradient(circle, #6366f1, transparent 70%)' }} />
        <div className="absolute w-[340px] h-[340px] rounded-full blur-3xl opacity-20 animate-aurora-2" style={{ bottom: '5%', left: '-8%', background: 'radial-gradient(circle, #06b6d4, transparent 70%)' }} />
        <div className="absolute w-[260px] h-[260px] rounded-full blur-3xl opacity-20 animate-aurora-3" style={{ top: '40%', right: '15%', background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
      </div>
      <PageHeader
        title="Störst!"
        emoji="⚡"
        rightContent={
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-indigo-300 bg-indigo-900/50 rounded-full px-3 py-1 ring-1 ring-indigo-400/40">
              {score} p
            </span>
            <div className="flex gap-0.5">
              {Array.from({ length: 3 }, (_, i) => (
                <span
                  key={i}
                  className={`text-base transition-all ${i < lives ? '' : 'grayscale opacity-30'}`}
                >
                  ❤️
                </span>
              ))}
            </div>
          </div>
        }
      />

      <div className="flex flex-col flex-1 px-4 pt-4 pb-6 max-w-sm mx-auto w-full gap-4">
        {/* Timer bar */}
        <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${timerColor}`}
            style={{
              width: `${timeLeft * 100}%`,
              transition: 'width 0.05s linear, background-color 0.3s',
            }}
          />
        </div>

        {/* Status message */}
        <p className={`text-center text-lg font-black transition-colors ${
          phase === 'feedback'
            ? feedback?.chosen === feedback?.correct ? 'text-green-600' :
              feedback?.chosen === null ? 'text-amber-500' : 'text-red-500'
            : 'text-white/60'
        }`}>
          {statusMsg}
        </p>

        {/* Two cards + VS separator */}
        <div className="flex gap-2 flex-1 items-stretch">
          <GameCard
            side="left"
            expr={exprs[0]}
            phase={phase}
            feedback={feedback}
            onAnswer={handleAnswer}
          />
          <div className="flex items-center justify-center px-1">
            <span className="text-base font-black text-white/40 select-none">VS</span>
          </div>
          <GameCard
            side="right"
            expr={exprs[1]}
            phase={phase}
            feedback={feedback}
            onAnswer={handleAnswer}
          />
        </div>

        {/* Level badge */}
        <p className="text-center text-xs font-bold text-white/50">
          {'⭐'.repeat(level)} Nivå {level}
        </p>
      </div>
    </div>
  );
}
