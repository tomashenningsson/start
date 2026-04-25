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
  position: number;
  health: number;
}

const PLAYER_POS     = 5;
const ZOMBIE_INIT    = 93;
const GAMEOVER_POS   = 8.5;
const TICK_MS        = 50;
const BASE_SPEED     = 3.0;
const BARRIER_LEAD   = 10;
const BARRIER_HP     = 100;
const BARRIER_DRAIN  = 88;
const TRIGGER_DIST   = 1.8;
const MIN_BAR_GAP    = 4;
const WRONG_BOOST    = 2.0;
const WRONG_BOOST_MS = 2500;
const PUSH_AMOUNT    = 22;
const PUSH_COOLDOWN_S = 12;

const STARS = Array.from({ length: 75 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 65,
  size: Math.random() * 2.2 + 0.4,
  opacity: Math.random() * 0.45 + 0.12,
}));

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

function toLeft(pos: number): number {
  return 9 + (pos / 100) * 74;
}

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
      <div style={{ width: 22, height: 3, background: 'rgba(0,0,0,0.5)', borderRadius: 2, marginBottom: 3, overflow: 'hidden' }}>
        <div style={{ width: `${hp * 100}%`, height: '100%', background: col, transition: 'width 0.08s linear, background 0.3s' }} />
      </div>
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

function MenuScreen({ onStart }: { onStart: (mode: 'easy' | 'normal') => void }) {
  return (
    <div style={{
      width: '100vw', height: '100dvh', overflow: 'hidden',
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
        Knuffa zombien längre bort för att vinna mer tid!
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <button onClick={() => onStart('normal')} style={{
          background: 'linear-gradient(135deg, #dc2626, #991b1b)',
          border: 'none', borderRadius: 18, color: '#fff',
          fontWeight: 800, fontSize: 20, padding: '14px 48px',
          cursor: 'pointer', letterSpacing: 3,
          boxShadow: '0 6px 30px rgba(220,38,38,0.65)',
        }}>
          SPELA ⭐3/tal
        </button>
        <button onClick={() => onStart('easy')} style={{
          background: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
          border: 'none', borderRadius: 18, color: '#fff',
          fontWeight: 800, fontSize: 16, padding: '12px 36px',
          cursor: 'pointer', letterSpacing: 2,
          boxShadow: '0 4px 20px rgba(29,78,216,0.5)',
        }}>
          LÄTT — 60% fart ⭐1/tal
        </button>
      </div>
      <style>{`@keyframes zFloat { 0%,100%{transform:translateY(0) rotate(-4deg)} 50%{transform:translateY(-10px) rotate(4deg)} }`}</style>
    </div>
  );
}

function GameOverScreen({ score, level, mode, onRestart }: { score: number; level: number; mode: 'easy' | 'normal'; onRestart: (m: 'easy' | 'normal') => void }) {
  return (
    <div style={{
      width: '100vw', height: '100dvh', overflow: 'hidden',
      background: 'linear-gradient(to bottom, #040008, #1e0005, #0e0000)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    }}>
      <div style={{ fontSize: 80, marginBottom: 14, animation: 'pulse 1.2s ease-in-out infinite' }}>💀</div>
      <h1 style={{ fontSize: 52, fontWeight: 900, margin: 0, color: '#ef4444', textShadow: '0 0 40px rgba(239,68,68,0.9)' }}>GAME OVER</h1>
      <p style={{ color: 'rgba(255,180,180,0.55)', margin: '8px 0 28px', fontSize: 16 }}>Zombien nådde dig!</p>
      <div style={{
        background: 'rgba(255,255,255,0.05)', borderRadius: 22,
        padding: '22px 58px', marginBottom: 32,
        border: '1px solid rgba(255,255,255,0.09)', textAlign: 'center',
      }}>
        <div style={{ fontSize: 42, fontWeight: 800, color: '#fbbf24' }}>⭐ {score}</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 5 }}>Nådde nivå {level}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        <button onClick={() => onRestart(mode)} style={{
          background: 'linear-gradient(135deg, #dc2626, #991b1b)',
          border: 'none', borderRadius: 18, color: '#fff',
          fontWeight: 800, fontSize: 20, padding: '14px 46px',
          cursor: 'pointer', letterSpacing: 2,
          boxShadow: '0 6px 28px rgba(220,38,38,0.5)',
        }}>
          FÖRSÖK IGEN {mode === 'easy' ? '(LÄTT)' : ''}
        </button>
        {mode === 'easy' && (
          <button onClick={() => onRestart('normal')} style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, color: 'rgba(255,255,255,0.6)',
            fontWeight: 700, fontSize: 14, padding: '10px 28px',
            cursor: 'pointer',
          }}>
            Byt till normal ⭐3/tal
          </button>
        )}
      </div>
      <style>{`@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }`}</style>
    </div>
  );
}

export default function ZombieGame() {
  const [gs, setGs]             = useState<GameState>('menu');
  const [zPos, setZPos]         = useState(ZOMBIE_INIT);
  const [barriers, setBarriers] = useState<Barrier[]>([]);
  const [question, setQuestion] = useState<Question>(() => mkQuestion(1));
  const [input, setInput]       = useState('');
  const [score, setScore]       = useState(0);
  const [level, setLevel]       = useState(1);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'push' | null>(null);
  const [shake, setShake]       = useState(false);
  const [zStruggle, setZStruggle] = useState(false);
  const [pushCooldown, setPushCooldown] = useState(0);
  const [mode, setMode] = useState<'easy' | 'normal'>('normal');

  const pushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const modeRef = useRef<'easy' | 'normal'>('normal');

  const gRef = useRef({
    zPos: ZOMBIE_INIT,
    barriers: [] as Barrier[],
    score: 0, level: 1,
    boost: 1, boostEnd: 0,
    nextId: 0,
  });

  const startGame = useCallback((selectedMode: 'easy' | 'normal') => {
    if (pushIntervalRef.current) clearInterval(pushIntervalRef.current);
    pushIntervalRef.current = null;
    const g = gRef.current;
    g.zPos = ZOMBIE_INIT; g.barriers = []; g.score = 0; g.level = 1;
    g.boost = 1; g.boostEnd = 0; g.nextId = 0;
    setZPos(ZOMBIE_INIT); setBarriers([]); setScore(0); setLevel(1);
    setInput(''); setQuestion(mkQuestion(1));
    setFeedback(null); setShake(false); setZStruggle(false);
    setPushCooldown(0);
    setMode(selectedMode);
    modeRef.current = selectedMode;
    setGs('playing');
  }, []);

  useEffect(() => {
    return () => { if (pushIntervalRef.current) clearInterval(pushIntervalRef.current); };
  }, []);

  const handleDigit = useCallback((d: string) => {
    setInput(prev => prev.length >= 3 ? prev : prev + d);
  }, []);

  const handleBackspace = useCallback(() => {
    setInput(prev => prev.slice(0, -1));
  }, []);

  const handleConfirm = useCallback(() => {
    if (gs !== 'playing') return;
    const g = gRef.current;
    const val = parseInt(input, 10);
    setInput('');
    if (isNaN(val)) return;

    if (val === question.answer) {
      let bPos = g.zPos - BARRIER_LEAD;
      bPos = Math.max(bPos, PLAYER_POS + 5);
      const clash = g.barriers.some(b => Math.abs(b.position - bPos) < MIN_BAR_GAP);
      const finalPos = clash ? bPos - MIN_BAR_GAP : bPos;
      if (finalPos > PLAYER_POS + 3) {
        const nb: Barrier = { id: g.nextId++, position: finalPos, health: BARRIER_HP };
        g.barriers = [...g.barriers, nb].sort((a, b) => b.position - a.position);
        setBarriers([...g.barriers]);
      }
      const pts = modeRef.current === 'easy' ? 1 : 3;
      g.score += pts * g.level;
      g.level  = Math.floor(g.score / 24) + 1;
      setScore(g.score);
      setLevel(g.level);
      setFeedback('correct');
      setTimeout(() => setFeedback(null), 550);
    } else {
      g.boost    = WRONG_BOOST;
      g.boostEnd = Date.now() + WRONG_BOOST_MS;
      setFeedback('wrong');
      setShake(true);
      setTimeout(() => { setFeedback(null); setShake(false); }, 620);
    }
    setQuestion(mkQuestion(g.level));
  }, [gs, input, question]);

  const handlePush = useCallback(() => {
    if (pushCooldown > 0 || gs !== 'playing') return;
    const g = gRef.current;
    g.zPos = Math.min(g.zPos + PUSH_AMOUNT, ZOMBIE_INIT);
    setZPos(g.zPos);
    setFeedback('push');
    setTimeout(() => setFeedback(null), 700);
    setPushCooldown(PUSH_COOLDOWN_S);
    if (pushIntervalRef.current) clearInterval(pushIntervalRef.current);
    pushIntervalRef.current = setInterval(() => {
      setPushCooldown(prev => {
        if (prev <= 1) {
          clearInterval(pushIntervalRef.current!);
          pushIntervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [pushCooldown, gs]);

  // Physical keyboard support for desktop
  useEffect(() => {
    if (gs !== 'playing') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
      else if (e.key === 'Backspace') handleBackspace();
      else if (e.key === 'Enter') handleConfirm();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gs, handleDigit, handleBackspace, handleConfirm]);

  useEffect(() => {
    if (gs !== 'playing') return;
    const g = gRef.current;
    const id = setInterval(() => {
      const now = Date.now();
      if (now > g.boostEnd) g.boost = 1;
      const speedMult = modeRef.current === 'easy' ? 0.6 : 1.0;
      const speed = BASE_SPEED * speedMult * (1 + (g.level - 1) * 0.12) * g.boost;
      const step  = speed * (TICK_MS / 1000);
      const blocking = g.barriers.find(b =>
        b.position <= g.zPos && (g.zPos - b.position) <= TRIGGER_DIST
      );
      if (blocking) {
        blocking.health -= BARRIER_DRAIN * (TICK_MS / 1000);
        if (blocking.health <= 0) {
          g.barriers = g.barriers.filter(b => b.id !== blocking.id);
        }
        setBarriers([...g.barriers]);
        g.zPos -= step * 0.06;
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

  if (gs === 'menu')     return <MenuScreen onStart={(m) => startGame(m)} />;
  if (gs === 'gameover') return <GameOverScreen score={score} level={level} mode={mode} onRestart={(m) => startGame(m)} />;

  const progress = Math.max(0, (zPos - GAMEOVER_POS) / (ZOMBIE_INIT - GAMEOVER_POS));
  const danger   = 1 - progress;
  const barColor = danger < 0.35 ? '#22c55e' : danger < 0.65 ? '#f59e0b' : '#ef4444';

  return (
    <div
      className={shake ? 'shake' : ''}
      style={{
        width: '100vw', height: '100dvh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(to bottom, #04000a 0%, #0e0022 35%, #1a0530 65%, #090912 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        userSelect: 'none',
      }}
    >
      {/* ── Scene (flex: 1) ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        {/* Stars */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {STARS.map(s => (
            <div key={s.id} style={{
              position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
              width: s.size, height: s.size, borderRadius: '50%',
              background: '#fff', opacity: s.opacity,
            }} />
          ))}
        </div>
        {/* Moon */}
        <div style={{
          position: 'absolute', top: '7%', right: '13%',
          width: 52, height: 52, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #fffbea, #e8cc50)',
          boxShadow: '0 0 20px 7px rgba(230,195,50,0.22)',
        }} />
        {/* Danger vignette */}
        {danger > 0.08 && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `radial-gradient(ellipse at 9% 60%, rgba(${Math.round(200*danger)},0,0,${(danger * 0.28).toFixed(2)}), transparent 65%)`,
          }} />
        )}
        {/* HUD */}
        <div style={{
          position: 'absolute', top: 'calc(env(safe-area-inset-top) + 14px)', left: 0, right: 0,
          display: 'flex', justifyContent: 'space-between', padding: '0 18px', zIndex: 10,
        }}>
          <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 20, textShadow: '0 0 10px rgba(74,222,128,0.5)' }}>
            ⭐ {score}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {mode === 'easy' && (
              <div style={{
                color: '#93c5fd', fontWeight: 700, fontSize: 13,
                background: 'rgba(29,78,216,0.25)', padding: '4px 10px', borderRadius: 10,
                border: '1px solid rgba(147,197,253,0.3)',
              }}>LÄTT</div>
            )}
            <div style={{
              color: '#f87171', fontWeight: 700, fontSize: 15,
              background: 'rgba(0,0,0,0.35)', padding: '4px 14px', borderRadius: 10,
              border: '1px solid rgba(248,113,113,0.3)',
            }}>
              NIVÅ {level}
            </div>
          </div>
        </div>
        {/* Characters + barriers */}
        <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0 }}>
          {/* Player */}
          <div style={{
            position: 'absolute', bottom: 0, left: `${toLeft(PLAYER_POS)}%`,
            transform: 'translateX(-50%)', fontSize: 34,
            filter: danger > 0.5 ? 'drop-shadow(0 0 12px rgba(255,100,100,0.8))' : 'drop-shadow(0 0 6px rgba(100,180,255,0.35))',
            transition: 'filter 0.5s',
          }}>🧍</div>
          {/* Barriers */}
          {barriers.map((b: Barrier) => <BarrierEl key={b.id} b={b} />)}
          {/* Zombie */}
          <div style={{
            position: 'absolute', bottom: 0, left: `${toLeft(zPos)}%`,
            transform: 'translateX(-50%)',
          }}>
            <div style={{
              fontSize: 38,
              animation: zStruggle ? 'struggle 0.18s ease-in-out infinite' : 'walk 0.48s ease-in-out infinite',
              filter: zStruggle
                ? 'drop-shadow(0 0 16px rgba(255,50,50,1)) drop-shadow(0 0 6px rgba(255,0,0,0.7))'
                : 'drop-shadow(0 0 8px rgba(140,255,90,0.45))',
              transition: 'filter 0.3s',
            }}>🧟</div>
          </div>
        </div>
        {/* Ground */}
        <div style={{
          position: 'absolute', bottom: 12, left: 0, right: 0, height: 3,
          background: 'linear-gradient(to right, #0a280a, #1a4a1a, #2a6a2a, #1a4a1a, #0a280a)',
          boxShadow: '0 0 14px rgba(40,130,40,0.3)',
        }} />
        {/* Danger bar */}
        <div style={{
          position: 'absolute', bottom: 4, left: '9%', right: '9%', height: 5,
          background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${progress * 100}%`,
            background: barColor, borderRadius: 3,
            transition: 'background 0.5s',
            boxShadow: `0 0 8px ${barColor}80`,
          }} />
        </div>
        {/* Barrier count */}
        {barriers.length > 0 && (
          <div style={{
            position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            color: 'rgba(74,222,128,0.55)', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
          }}>
            {barriers.length} barriär{barriers.length !== 1 ? 'er' : ''} aktiv{barriers.length !== 1 ? 'a' : 't'}
          </div>
        )}
      </div>

      {/* ── Bottom panel: question + numpad ── */}
      <div style={{
        flexShrink: 0,
        background: 'linear-gradient(to top, rgba(2,0,10,0.99) 70%, rgba(2,0,10,0.85))',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '10px 16px 20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}>
        {/* Feedback toast */}
        <div style={{ height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {feedback && (
            <div style={{
              color: feedback === 'correct' ? '#4ade80' : feedback === 'push' ? '#fbbf24' : '#f87171',
              fontWeight: 800, fontSize: 15,
              textShadow: feedback === 'correct' ? '0 0 14px #4ade80' : feedback === 'push' ? '0 0 14px #fbbf24' : '0 0 14px #f87171',
              animation: 'feedUp 0.7s ease-out forwards',
            }}>
              {feedback === 'correct' ? '✓ Rätt! Barriär byggd!' : feedback === 'push' ? '💨 Zombien knuffades bort!' : '✗ Fel — zombien skyndar sig!'}
            </div>
          )}
        </div>

        {/* Question */}
        <div style={{
          color: '#ece8ff', fontSize: 32, fontWeight: 800, letterSpacing: 3,
          textShadow: '0 0 20px rgba(200,180,255,0.4)',
        }}>
          {question.n1} {question.op} {question.n2} = ?
        </div>

        {/* Input display + Push button */}
        <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 340 }}>
          <div style={{
            flex: 1, height: 48,
            background: 'rgba(255,255,255,0.07)',
            border: '2px solid rgba(255,255,255,0.18)',
            borderRadius: 14, display: 'flex', alignItems: 'center',
            paddingLeft: 18,
          }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: input ? '#fff' : 'rgba(255,255,255,0.2)' }}>
              {input || '?'}
            </span>
          </div>
          <button
            onClick={handlePush}
            disabled={pushCooldown > 0}
            style={{
              height: 48, padding: '0 14px', borderRadius: 14,
              border: 'none', cursor: pushCooldown > 0 ? 'default' : 'pointer',
              fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap',
              background: pushCooldown > 0
                ? 'rgba(255,255,255,0.07)'
                : 'linear-gradient(135deg, #d97706, #b45309)',
              color: pushCooldown > 0 ? 'rgba(255,255,255,0.3)' : '#fff',
              boxShadow: pushCooldown > 0 ? 'none' : '0 4px 16px rgba(217,119,6,0.5)',
              transition: 'all 0.2s',
            }}
          >
            {pushCooldown > 0 ? `💪 ${pushCooldown}s` : '💪 Knuffa!'}
          </button>
        </div>

        {/* Numpad */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8, width: '100%', maxWidth: 340,
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
            <button key={d} onClick={() => handleDigit(String(d))} style={{
              height: 44, fontSize: 22, fontWeight: 800,
              background: 'linear-gradient(135deg, #4c1d95, #6d28d9)',
              border: 'none', borderRadius: 12, color: '#fff',
              cursor: 'pointer', boxShadow: '0 3px 10px rgba(109,40,217,0.4)',
            }}>{d}</button>
          ))}
          <button onClick={handleBackspace} style={{
            height: 44, fontSize: 20, fontWeight: 800,
            background: 'rgba(255,255,255,0.1)',
            border: 'none', borderRadius: 12, color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
          }}>⌫</button>
          <button onClick={() => handleDigit('0')} style={{
            height: 44, fontSize: 22, fontWeight: 800,
            background: 'linear-gradient(135deg, #4c1d95, #6d28d9)',
            border: 'none', borderRadius: 12, color: '#fff',
            cursor: 'pointer', boxShadow: '0 3px 10px rgba(109,40,217,0.4)',
          }}>0</button>
          <button onClick={handleConfirm} disabled={!input} style={{
            height: 44, fontSize: 22, fontWeight: 800,
            background: input
              ? 'linear-gradient(135deg, #16a34a, #15803d)'
              : 'rgba(255,255,255,0.07)',
            border: 'none', borderRadius: 12,
            color: input ? '#fff' : 'rgba(255,255,255,0.2)',
            cursor: input ? 'pointer' : 'default',
            boxShadow: input ? '0 3px 14px rgba(22,163,74,0.5)' : 'none',
          }}>✓</button>
        </div>
      </div>

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
          0%   { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
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
      `}</style>
    </div>
  );
}
