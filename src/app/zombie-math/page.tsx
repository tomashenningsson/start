'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

type GameState = 'menu' | 'playing' | 'gameover';

interface Question {
  n1: number;
  n2: number;
  op: string;
  answer: number;
}

interface Barrier {
  id: number;
  position: number; // 0–100 game-space
  health: number;   // 0–100
}

// ─── Constants ───────────────────────────────────────────────────────────────
const PLAYER_POS     = 5;
const ZOMBIE_INIT    = 93;
const GAMEOVER_POS   = 8.5;
const TICK_MS        = 50;
const BASE_SPEED     = 3.0;   // game-units / second at level 1
const BARRIER_LEAD   = 10;    // barrier placed this far ahead of zombie
const BARRIER_HP     = 100;
const BARRIER_DRAIN  = 88;    // HP/s while zombie fights barrier
const TRIGGER_DIST   = 1.8;   // distance at which zombie "hits" a barrier
const MIN_BAR_GAP    = 4;     // minimum spacing between barriers
const WRONG_BOOST    = 2.0;
const WRONG_BOOST_MS = 2500;

// ─── Static stars (computed once) ────────────────────────────────────────────
const STARS = Array.from({ length: 75 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 65,
  size: Math.random() * 2.2 + 0.4,
  opacity: Math.random() * 0.45 + 0.12,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rand(a: number, b: number) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function mkQuestion(level: number): Question {
  const lv = Math.min(level, 5);
  const ops = lv <= 1 ? ['+', '-'] : lv <= 2 ? ['+', '-', '×'] : ['+', '-', '×', '÷'];
  const op  = ops[rand(0, ops.length - 1)];
  const max = 10 + (lv - 1) * 5;
  let n1: number, n2: number, answer: number;
  if (op === '+') { n1 = rand(2, max); n2 = rand(2, max); answer = n1 + n2; }
  else if (op === '-') { n1 = rand(5, max); n2 = rand(1, n1 - 1); answer = n1 - n2; }
  else if (op === '×') { n1 = rand(2, 12); n2 = rand(2, 12); answer = n1 * n2; }
  else { n2 = rand(2, 9); answer = rand(2, 9); n1 = n2 * answer; }
  return { n1, n2, op, answer };
}

// game-space (0–100) → CSS left%  (player ≈ 9%, zombie-start ≈ 83%)
function toLeft(pos: number): number {
  return 9 + (pos / 100) * 74;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function BarrierEl({ b }: { b: Barrier }) {
  const hp  = b.health / BARRIER_HP;
  const col = hp > 0.6 ? '#4ade80' : hp > 0.3 ? '#fbbf24' : '#f87171';
  return (
    <div style={{
      position: 'absolute', bottom: 0,
      left: `${toLeft(b.position)}%`,
      transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      pointerEvents: 'none',
    }}>
      {/* health pip */}
      <div style={{ width: 22, height: 3, background: 'rgba(0,0,0,0.5)', borderRadius: 2, marginBottom: 3, overflow: 'hidden' }}>
        <div style={{ width: `${hp * 100}%`, height: '100%', background: col, transition: 'width 0.08s linear, background 0.3s' }} />
      </div>
      {/* bar body */}
      <div style={{
        width: 13, height: 58,
        background: `linear-gradient(to bottom, ${col}ee 0%, ${col}33 100%)`,
        borderRadius: '3px 3px 0 0',
        boxShadow: `0 0 10px ${col}90, 0 0 22px ${col}40`,
        opacity: 0.2 + hp * 0.8,
        backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 9px, rgba(0,0,0,0.18) 9px, rgba(0,0,0,0.18) 10px)',
      }} />
    </div>
  );
}

function MenuScreen({ onStart }: { onStart: () => void }) {
  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      background: 'linear-gradient(to bottom, #04000a 0%, #120020 50%, #1e0a12 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {STARS.map(s => (
          <div key={s.id} style={{
            position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size, borderRadius: '50%',
            background: '#fff', opacity: s.opacity,
          }} />
        ))}
      </div>
      {/* moon */}
      <div style={{
        position: 'absolute', top: '8%', right: '14%',
        width: 56, height: 56, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #fffbea, #e8cc50)',
        boxShadow: '0 0 22px 8px rgba(230,195,50,0.25), 0 0 55px 22px rgba(230,195,50,0.07)',
      }} />

      <div style={{ fontSize: 88, marginBottom: 12, filter: 'drop-shadow(0 0 22px rgba(255,80,80,0.85))', animation: 'zFloat 3s ease-in-out infinite' }}>🧟</div>
      <h1 style={{
        fontSize: 44, fontWeight: 900, margin: '0 0 6px',
        color: '#ff4545',
        textShadow: '0 0 30px rgba(255,60,60,0.9), 0 2px 6px rgba(0,0,0,0.6)',
        letterSpacing: 5,
      }}>ZOMBIE MATTE</h1>
      <p style={{ color: 'rgba(200,180,230,0.65)', margin: '10px 0 40px', textAlign: 'center', maxWidth: 340, lineHeight: 1.75, fontSize: 15 }}>
        Lös mattetal för att bygga glödande barriärer.<br />
        Ju fler du löser, desto fler hinder sätter du i zombiens väg!
      </p>
      <button onClick={onStart} style={{
        background: 'linear-gradient(135deg, #dc2626, #991b1b)',
        border: 'none', borderRadius: 18, color: '#fff',
        fontWeight: 800, fontSize: 22, padding: '16px 54px',
        cursor: 'pointer', letterSpacing: 3,
        boxShadow: '0 6px 30px rgba(220,38,38,0.65)',
        transition: 'transform 0.1s, box-shadow 0.1s',
      }}
        onMouseEnter={e => { (e.target as HTMLElement).style.transform = 'scale(1.04)'; }}
        onMouseLeave={e => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
      >
        SPELA
      </button>
      <p style={{ marginTop: 18, color: 'rgba(200,180,230,0.3)', fontSize: 13 }}>
        Skriv svaret och tryck Enter
      </p>
      <style>{`@keyframes zFloat { 0%,100%{transform:translateY(0) rotate(-4deg)} 50%{transform:translateY(-10px) rotate(4deg)} }`}</style>
    </div>
  );
}

function GameOverScreen({ score, level, onRestart }: { score: number; level: number; onRestart: () => void }) {
  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      background: 'linear-gradient(to bottom, #040008, #1e0005, #0e0000)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    }}>
      <div style={{ fontSize: 80, marginBottom: 14, animation: 'pulse 1.2s ease-in-out infinite' }}>💀</div>
      <h1 style={{
        fontSize: 52, fontWeight: 900, margin: 0,
        color: '#ef4444', textShadow: '0 0 40px rgba(239,68,68,0.9)',
      }}>GAME OVER</h1>
      <p style={{ color: 'rgba(255,180,180,0.55)', margin: '8px 0 28px', fontSize: 16 }}>Zombien nådde dig!</p>
      <div style={{
        background: 'rgba(255,255,255,0.05)', borderRadius: 22,
        padding: '22px 58px', marginBottom: 32,
        border: '1px solid rgba(255,255,255,0.09)', textAlign: 'center',
      }}>
        <div style={{ fontSize: 42, fontWeight: 800, color: '#fbbf24' }}>⭐ {score}</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 5 }}>Nådde nivå {level}</div>
      </div>
      <button onClick={onRestart} style={{
        background: 'linear-gradient(135deg, #dc2626, #991b1b)',
        border: 'none', borderRadius: 18, color: '#fff',
        fontWeight: 800, fontSize: 20, padding: '14px 46px',
        cursor: 'pointer', letterSpacing: 2,
        boxShadow: '0 6px 28px rgba(220,38,38,0.5)',
      }}>
        FÖRSÖK IGEN
      </button>
      <style>{`@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }`}</style>
    </div>
  );
}

// ─── Main game ────────────────────────────────────────────────────────────────
export default function ZombieGame() {
  const [gs, setGs]           = useState<GameState>('menu');
  const [zPos, setZPos]       = useState(ZOMBIE_INIT);
  const [barriers, setBarriers] = useState<Barrier[]>([]);
  const [question, setQuestion] = useState<Question>(() => mkQuestion(1));
  const [input, setInput]     = useState('');
  const [score, setScore]     = useState(0);
  const [level, setLevel]     = useState(1);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [shake, setShake]     = useState(false);
  const [zStruggle, setZStruggle] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // mutable game state to avoid stale closures in the interval
  const gRef = useRef({
    zPos: ZOMBIE_INIT,
    barriers: [] as Barrier[],
    score: 0, level: 1,
    boost: 1, boostEnd: 0,
    nextId: 0,
  });

  // ── Start / restart ─────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const g = gRef.current;
    g.zPos = ZOMBIE_INIT; g.barriers = []; g.score = 0; g.level = 1;
    g.boost = 1; g.boostEnd = 0; g.nextId = 0;
    setZPos(ZOMBIE_INIT); setBarriers([]); setScore(0); setLevel(1);
    setInput(''); setQuestion(mkQuestion(1));
    setFeedback(null); setShake(false); setZStruggle(false);
    setGs('playing');
    setTimeout(() => inputRef.current?.focus(), 120);
  }, []);

  // ── Submit answer ────────────────────────────────────────────────────────────
  const submitAnswer = useCallback(() => {
    if (gs !== 'playing') return;
    const g   = gRef.current;
    const val = parseInt(input, 10);
    if (isNaN(val)) { setInput(''); return; }

    if (val === question.answer) {
      // ── CORRECT ─────────────────────────────────────────────────────────────
      let bPos = g.zPos - BARRIER_LEAD;
      bPos = Math.max(bPos, PLAYER_POS + 5);

      // avoid stacking barriers too close together
      const clash = g.barriers.some(b => Math.abs(b.position - bPos) < MIN_BAR_GAP);
      const finalPos = clash ? bPos - MIN_BAR_GAP : bPos;

      if (finalPos > PLAYER_POS + 3) {
        const nb: Barrier = { id: g.nextId++, position: finalPos, health: BARRIER_HP };
        g.barriers = [...g.barriers, nb].sort((a, b) => b.position - a.position);
        setBarriers([...g.barriers]);
      }

      g.score += 10 * g.level;
      g.level  = Math.floor(g.score / 80) + 1;
      setScore(g.score);
      setLevel(g.level);
      setFeedback('correct');
      setTimeout(() => setFeedback(null), 550);
    } else {
      // ── WRONG ───────────────────────────────────────────────────────────────
      g.boost    = WRONG_BOOST;
      g.boostEnd = Date.now() + WRONG_BOOST_MS;
      setFeedback('wrong');
      setShake(true);
      setTimeout(() => { setFeedback(null); setShake(false); }, 620);
    }

    setInput('');
    setQuestion(mkQuestion(g.level));
    setTimeout(() => inputRef.current?.focus(), 10);
  }, [gs, input, question]);

  // ── Game loop ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gs !== 'playing') return;
    const g = gRef.current;

    const id = setInterval(() => {
      const now = Date.now();
      if (now > g.boostEnd) g.boost = 1;

      const speed = BASE_SPEED * (1 + (g.level - 1) * 0.12) * g.boost;
      const step  = speed * (TICK_MS / 1000);

      // find the nearest barrier just ahead of the zombie
      const blocking = g.barriers.find(b =>
        b.position <= g.zPos && (g.zPos - b.position) <= TRIGGER_DIST
      );

      if (blocking) {
        blocking.health -= BARRIER_DRAIN * (TICK_MS / 1000);
        if (blocking.health <= 0) {
          g.barriers = g.barriers.filter(b => b.id !== blocking.id);
        }
        setBarriers([...g.barriers]);
        g.zPos -= step * 0.06; // barely crawls through barrier
        setZStruggle(true);
      } else {
        g.zPos -= step;
        setZStruggle(false);
      }

      setZPos(g.zPos);
      if (g.zPos <= GAMEOVER_POS) setGs('gameover');
    }, TICK_MS);

    return () => clearInterval(id);
  }, [gs]);

  const handleKey = useCallback((e: { key: string }) => {
    if (e.key === 'Enter') submitAnswer();
  }, [submitAnswer]);

  // ── Routing ──────────────────────────────────────────────────────────────────
  if (gs === 'menu')     return <MenuScreen onStart={startGame} />;
  if (gs === 'gameover') return <GameOverScreen score={score} level={level} onRestart={startGame} />;

  // ── Derived values ────────────────────────────────────────────────────────────
  const progress = Math.max(0, (zPos - GAMEOVER_POS) / (ZOMBIE_INIT - GAMEOVER_POS));
  const danger   = 1 - progress;                     // 0=safe, 1=imminent
  const barColor = danger < 0.35 ? '#22c55e' : danger < 0.65 ? '#f59e0b' : '#ef4444';

  return (
    <div
      className={shake ? 'shake' : ''}
      style={{
        width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(to bottom, #04000a 0%, #0e0022 35%, #1a0530 65%, #090912 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      }}
    >
      {/* ── Stars ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {STARS.map(s => (
          <div key={s.id} style={{
            position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size, borderRadius: '50%',
            background: '#fff', opacity: s.opacity,
          }} />
        ))}
      </div>

      {/* ── Moon ── */}
      <div style={{
        position: 'absolute', top: '7%', right: '13%',
        width: 52, height: 52, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #fffbea, #e8cc50)',
        boxShadow: '0 0 20px 7px rgba(230,195,50,0.22), 0 0 50px 20px rgba(230,195,50,0.07)',
      }} />

      {/* ── Danger vignette (grows as zombie approaches) ── */}
      {danger > 0.08 && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse at 9% 60%, rgba(${Math.round(200*danger)},0,0,${(danger * 0.28).toFixed(2)}), transparent 65%)`,
        }} />
      )}

      {/* ── HUD ── */}
      <div style={{
        position: 'absolute', top: 16, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', padding: '0 20px', zIndex: 10,
      }}>
        <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 20, textShadow: '0 0 10px rgba(74,222,128,0.5)' }}>
          ⭐ {score}
        </div>
        <div style={{
          color: '#f87171', fontWeight: 700, fontSize: 15,
          background: 'rgba(0,0,0,0.35)', padding: '4px 14px', borderRadius: 10,
          border: '1px solid rgba(248,113,113,0.3)',
        }}>
          NIVÅ {level}
        </div>
      </div>

      {/* ── Scene ── */}
      {/* Characters sit on a strip ~60% from top */}
      <div style={{ position: 'absolute', bottom: 'calc(28% + 12px)', left: 0, right: 0 }}>

        {/* Fog */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 140,
          background: 'linear-gradient(to top, rgba(70,110,70,0.07), transparent)',
          pointerEvents: 'none',
        }} />

        {/* Player */}
        <div style={{
          position: 'absolute', bottom: 0,
          left: `${toLeft(PLAYER_POS)}%`,
          transform: 'translateX(-50%)',
          fontSize: 34, userSelect: 'none',
          filter: danger > 0.5
            ? 'drop-shadow(0 0 12px rgba(255,100,100,0.8))'
            : 'drop-shadow(0 0 6px rgba(100,180,255,0.35))',
          transition: 'filter 0.5s',
        }}>
          🧍
        </div>

        {/* Barriers */}
        {barriers.map(b => <BarrierEl key={b.id} b={b} />)}

        {/* Zombie – outer div positions, inner div animates */}
        <div style={{
          position: 'absolute', bottom: 0,
          left: `${toLeft(zPos)}%`,
          transform: 'translateX(-50%)',
          userSelect: 'none',
        }}>
          <div style={{
            fontSize: 38,
            animation: zStruggle ? 'struggle 0.18s ease-in-out infinite' : 'walk 0.48s ease-in-out infinite',
            filter: zStruggle
              ? 'drop-shadow(0 0 16px rgba(255,50,50,1)) drop-shadow(0 0 6px rgba(255,0,0,0.7))'
              : 'drop-shadow(0 0 8px rgba(140,255,90,0.45))',
            transition: 'filter 0.3s',
          }}>
            🧟
          </div>
        </div>
      </div>

      {/* Ground */}
      <div style={{
        position: 'absolute', bottom: 'calc(28% + 10px)',
        left: 0, right: 0, height: 3,
        background: 'linear-gradient(to right, #0a280a, #1a4a1a, #2a6a2a, #1a4a1a, #0a280a)',
        boxShadow: '0 0 14px rgba(40,130,40,0.3)',
      }} />

      {/* Danger bar */}
      <div style={{
        position: 'absolute', bottom: 'calc(28% + 4px)',
        left: '9%', right: '9%', height: 5,
        background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${progress * 100}%`,
          background: barColor,
          borderRadius: 3,
          transition: 'background 0.5s',
          boxShadow: `0 0 8px ${barColor}80`,
        }} />
      </div>

      {/* Barrier count hint */}
      {barriers.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 'calc(28% - 18px)',
          left: '50%', transform: 'translateX(-50%)',
          color: 'rgba(74,222,128,0.55)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
        }}>
          {barriers.length} barriär{barriers.length !== 1 ? 'er' : ''} aktivt
        </div>
      )}

      {/* ── Question panel ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '28%',
        background: 'linear-gradient(to top, rgba(2,0,10,0.98) 55%, transparent)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        paddingBottom: 20, gap: 14,
      }}>

        {/* Feedback toast */}
        {feedback && (
          <div style={{
            position: 'absolute', top: 0, left: '50%',
            transform: 'translateX(-50%)',
            color: feedback === 'correct' ? '#4ade80' : '#f87171',
            fontWeight: 800, fontSize: 17,
            textShadow: feedback === 'correct' ? '0 0 18px #4ade80' : '0 0 18px #f87171',
            animation: 'feedUp 0.65s ease-out forwards',
            whiteSpace: 'nowrap',
          }}>
            {feedback === 'correct' ? '✓ Rätt! Barriär byggd!' : '✗ Fel — zombien skyndar sig!'}
          </div>
        )}

        {/* Question */}
        <div style={{
          color: '#ece8ff', fontSize: 38, fontWeight: 800, letterSpacing: 4,
          textShadow: '0 0 20px rgba(200,180,255,0.4)',
        }}>
          {question.n1} {question.op} {question.n2} = ?
        </div>

        {/* Input row */}
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            ref={inputRef}
            type="number"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            style={{
              width: 118, padding: '10px 14px',
              fontSize: 26, fontWeight: 700, textAlign: 'center',
              background: 'rgba(255,255,255,0.07)',
              border: '2px solid rgba(255,255,255,0.2)',
              borderRadius: 14, color: '#fff', outline: 'none',
              caretColor: '#a78bfa',
            }}
            placeholder="?"
          />
          <button
            onClick={submitAnswer}
            style={{
              padding: '10px 28px', fontSize: 18, fontWeight: 800,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              border: 'none', borderRadius: 14, color: '#fff',
              cursor: 'pointer', letterSpacing: 1,
              boxShadow: '0 4px 20px rgba(34,197,94,0.5)',
            }}
          >
            SVARA
          </button>
        </div>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes walk {
          0%,100% { transform: translateY(0) rotate(-3deg) scaleX(-1); }
          50%      { transform: translateY(-6px) rotate(3deg) scaleX(-1); }
        }
        @keyframes struggle {
          0%,100% { transform: translateX(-5px) rotate(-6deg) scaleX(-1); }
          50%      { transform: translateX(5px)  rotate(6deg)  scaleX(-1); }
        }
        @keyframes feedUp {
          0%   { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-36px); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          15%     { transform: translateX(-9px) rotate(-0.4deg); }
          30%     { transform: translateX(9px)  rotate(0.4deg); }
          45%     { transform: translateX(-6px); }
          60%     { transform: translateX(6px); }
          78%     { transform: translateX(-3px); }
          90%     { transform: translateX(3px); }
        }
        .shake { animation: shake 0.55s ease-in-out; }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}
