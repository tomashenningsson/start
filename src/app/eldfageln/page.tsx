'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, Hourglass } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';

type GameState = 'menu' | 'playing' | 'levelClear' | 'win' | 'gameover';
type Op = '+' | '-' | '×';

interface Fireball {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  x: number;
  y: number;
  duration: number;
  elapsed: number;
  state: 'flying' | 'blocked' | 'hit' | 'done';
  size: number;
  trail: { x: number; y: number; born: number }[];
}

interface MathQ {
  text: string;
  answer: number;
  choices: number[];
}

interface FX {
  id: number;
  x: number;
  y: number;
  kind: 'block' | 'hit' | 'spark' | 'star' | 'smoke';
  born: number;
  vx?: number;
  vy?: number;
}

const PLAYER_X = 50;
const PLAYER_Y = 13;
const WALL_Y   = 24;
const BIRD_Y   = 78;
const TICK_MS  = 50;

const TOTAL_LEVELS = 5;
const QUESTIONS_PER_LEVEL = [5, 5, 5, 5, 6];
const INIT_LIVES = 3;
const SLOW_CHARGES = 3;
const SLOW_FACTOR = 0.4;
const SLOW_MS = 2500;
const ROUND_GAP_MS = 900;

const STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 50,
  size: Math.random() * 1.6 + 0.4,
  opacity: Math.random() * 0.4 + 0.2,
}));

const CLOUDS = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  left: Math.random() * 90,
  top: 6 + Math.random() * 24,
  size: 90 + Math.random() * 110,
  delay: i * 2.4,
  opacity: 0.18 + Math.random() * 0.15,
}));

const MOUNTAINS = [
  { x: 0,  w: 38, h: 110, color: '#3a1d24' },
  { x: 22, w: 44, h: 145, color: '#2a131c' },
  { x: 52, w: 40, h: 125, color: '#3a1d24' },
  { x: 74, w: 36, h: 100, color: '#2a131c' },
];

const CASTLE_PARTS = [
  { x: 18, w: 30, h: 50 },
  { x: 50, w: 36, h: 70 },
  { x: 76, w: 28, h: 56 },
];

function randInt(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuestion(level: number): MathQ {
  let a = 1, b = 1, op: Op = '+';

  if (level === 1) {
    op = '+';
    a = randInt(1, 5);
    b = randInt(1, 5);
  } else if (level === 2) {
    if (Math.random() < 0.55) {
      op = '+';
      a = randInt(2, 10);
      b = randInt(2, 10);
    } else {
      op = '-';
      a = randInt(5, 15);
      b = randInt(1, a);
    }
  } else if (level === 3) {
    const r = Math.random();
    if (r < 0.4) { op = '+'; a = randInt(5, 15); b = randInt(5, 15); }
    else if (r < 0.8) { op = '-'; a = randInt(8, 20); b = randInt(1, a); }
    else { op = '×'; a = randInt(2, 5); b = randInt(2, 5); }
  } else if (level === 4) {
    const r = Math.random();
    if (r < 0.3) { op = '+'; a = randInt(8, 25); b = randInt(5, 15); }
    else if (r < 0.6) { op = '-'; a = randInt(10, 30); b = randInt(1, a); }
    else { op = '×'; a = randInt(2, 6); b = randInt(2, 7); }
  } else {
    const r = Math.random();
    if (r < 0.3) { op = '+'; a = randInt(10, 30); b = randInt(5, 25); }
    else if (r < 0.6) { op = '-'; a = randInt(10, 35); b = randInt(1, a); }
    else { op = '×'; a = randInt(3, 8); b = randInt(3, 8); }
  }

  const answer = op === '+' ? a + b : op === '-' ? a - b : a * b;
  const span = Math.max(3, Math.floor(answer * 0.4));

  const choices = new Set<number>([answer]);
  let tries = 0;
  while (choices.size < 4 && tries < 40) {
    const v = answer + randInt(-span, span);
    if (v >= 0 && v !== answer) choices.add(v);
    tries++;
  }
  while (choices.size < 4) {
    const v = randInt(0, Math.max(answer + 5, 15));
    if (v !== answer) choices.add(v);
  }

  return { text: `${a} ${op} ${b}`, answer, choices: shuffle(Array.from(choices)) };
}

// ── Visual subcomponents ─────────────────────────────────────────────────────

function Background({ slowed }: { slowed: boolean }) {
  return (
    <>
      {/* Sky gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: slowed
          ? 'linear-gradient(to bottom, #0c1a4a 0%, #1a2a6a 30%, #2a3680 65%, #1a2050 100%)'
          : 'linear-gradient(to bottom, #2a0a1a 0%, #5a1226 18%, #b14f2c 42%, #e88a35 65%, #f4be58 80%, #4d1a25 100%)',
        transition: 'background 0.4s',
      }} />

      {/* Sun/Moon */}
      <div style={{
        position: 'absolute', top: '20%', right: '14%',
        width: 70, height: 70, borderRadius: '50%',
        background: slowed
          ? 'radial-gradient(circle at 35% 35%, #fffbea, #d4d4d8 70%, #71717a)'
          : 'radial-gradient(circle at 35% 35%, #fff8d4, #fde047 50%, #f97316 90%)',
        boxShadow: slowed
          ? '0 0 25px 8px rgba(220,220,240,0.3)'
          : '0 0 50px 18px rgba(251,191,36,0.45), 0 0 100px 30px rgba(249,115,22,0.2)',
        opacity: 0.95,
      }} />

      {/* Stars (subtle) */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {STARS.map(s => (
          <div key={s.id} style={{
            position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size, borderRadius: '50%',
            background: '#fff', opacity: s.opacity * (slowed ? 1 : 0.55),
          }} />
        ))}
      </div>

      {/* Drifting clouds */}
      {CLOUDS.map(c => (
        <div key={c.id} style={{
          position: 'absolute', top: `${c.top}%`, left: `${c.left}%`,
          width: c.size, height: c.size * 0.32, borderRadius: '50%',
          background: `radial-gradient(ellipse, rgba(255,200,170,${c.opacity}), transparent 65%)`,
          animation: `eldDrift ${28 + c.delay}s linear infinite`,
          animationDelay: `${-c.delay}s`,
          pointerEvents: 'none',
          filter: 'blur(6px)',
        }} />
      ))}

      {/* Mountains */}
      <div style={{ position: 'absolute', bottom: 80, left: 0, right: 0, height: 145, pointerEvents: 'none' }}>
        {MOUNTAINS.map((m, i) => (
          <div key={i} style={{
            position: 'absolute', bottom: 0, left: `${m.x}%`,
            width: 0, height: 0, opacity: 0.85,
            borderLeft: `${m.w * 0.6}vw solid transparent`,
            borderRight: `${m.w * 0.6}vw solid transparent`,
            borderBottom: `${m.h}px solid ${m.color}`,
          }} />
        ))}
      </div>

      {/* Castle silhouette */}
      <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, height: 90, pointerEvents: 'none' }}>
        {CASTLE_PARTS.map((p, i) => (
          <div key={i} style={{
            position: 'absolute', bottom: 0, left: `${p.x}%`,
            transform: 'translateX(-50%)',
            width: p.w, height: p.h,
            background: 'linear-gradient(to bottom, #1a0d12 0%, #0a0408 100%)',
            opacity: 0.92,
            borderTopLeftRadius: 4, borderTopRightRadius: 4,
            boxShadow: 'inset 0 1px 0 rgba(255,180,140,0.08)',
          }}>
            {/* Battlements */}
            <div style={{
              position: 'absolute', top: -6, left: 0, right: 0, height: 6,
              background: 'repeating-linear-gradient(to right, #1a0d12 0 6px, transparent 6px 12px)',
            }} />
            {/* Window glow */}
            {i === 1 && (
              <div style={{
                position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)',
                width: 6, height: 10, background: '#fbbf24',
                boxShadow: '0 0 10px 2px rgba(251,191,36,0.7)',
                borderRadius: 1,
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Ground */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 14,
        background: 'linear-gradient(to bottom, #2a0810 0%, #100408 60%, #050203 100%)',
        borderTop: '1px solid rgba(160,80,40,0.3)',
      }} />
    </>
  );
}

function BirdEnemy({ x, y, windup, isBoss }: { x: number; y: number; windup: boolean; isBoss: boolean }) {
  return (
    <div style={{
      position: 'absolute', left: `${x}%`, bottom: `${y}%`,
      transform: 'translate(-50%, 50%)', pointerEvents: 'none',
    }}>
      <div style={{
        fontSize: isBoss ? 84 : 52,
        animation: windup
          ? 'birdWindup 0.25s ease-in-out infinite alternate'
          : 'birdHover 1.6s ease-in-out infinite',
        filter: isBoss
          ? 'drop-shadow(0 0 22px rgba(220,38,38,0.85)) drop-shadow(0 0 40px rgba(249,115,22,0.5))'
          : 'drop-shadow(0 0 14px rgba(249,115,22,0.7)) drop-shadow(0 0 28px rgba(220,38,38,0.35))',
      }}>{isBoss ? '🐉' : '🦅'}</div>
      {/* Fire aura */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: isBoss ? 110 : 70, height: isBoss ? 110 : 70,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249,115,22,0.25), transparent 65%)',
        animation: 'birdGlow 1.4s ease-in-out infinite',
        pointerEvents: 'none',
        zIndex: -1,
      }} />
    </div>
  );
}

function FireballEl({ f, slowed }: { f: Fireball; slowed: boolean }) {
  const progress = f.elapsed / f.duration;
  return (
    <>
      {/* Trail */}
      {f.trail.map((t, i) => {
        const age = (Date.now() - t.born) / 400;
        if (age >= 1) return null;
        const fade = 1 - age;
        return (
          <div key={`${f.id}-t-${i}`} style={{
            position: 'absolute', left: `${t.x}%`, bottom: `${t.y}%`,
            transform: `translate(-50%, 50%) scale(${0.45 + fade * 0.6})`,
            pointerEvents: 'none',
            width: f.size * 0.7, height: f.size * 0.7,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(253,224,71,0.7), rgba(249,115,22,0.45) 50%, transparent 75%)',
            opacity: fade * 0.7,
            filter: 'blur(2px)',
          }} />
        );
      })}
      {/* Fireball */}
      <div style={{
        position: 'absolute', left: `${f.x}%`, bottom: `${f.y}%`,
        transform: `translate(-50%, 50%) rotate(${progress * 360}deg)`,
        pointerEvents: 'none',
        transition: 'left 0.05s linear, bottom 0.05s linear',
      }}>
        <div style={{
          width: f.size, height: f.size, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #fff7c2, #fbbf24 35%, #ea580c 70%, #7c2d12 100%)',
          boxShadow: slowed
            ? '0 0 22px rgba(96,165,250,0.7), 0 0 50px rgba(96,165,250,0.4), inset -3px -4px 8px rgba(0,0,0,0.3)'
            : '0 0 26px rgba(251,146,60,0.85), 0 0 60px rgba(220,38,38,0.45), inset -3px -4px 8px rgba(0,0,0,0.35), inset 3px 3px 6px rgba(255,255,255,0.45)',
          fontSize: f.size * 0.55, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fireFlicker 0.18s ease-in-out infinite alternate',
        }}>🔥</div>
      </div>
    </>
  );
}

function Player({ lives, hit }: { lives: number; hit: boolean }) {
  return (
    <div style={{
      position: 'absolute', bottom: `${PLAYER_Y}%`, left: `${PLAYER_X}%`,
      transform: 'translate(-50%, 50%)', pointerEvents: 'none',
    }}>
      <div style={{
        fontSize: 44,
        filter: hit
          ? 'drop-shadow(0 0 18px rgba(248,113,113,0.95))'
          : lives === 1
            ? 'drop-shadow(0 0 14px rgba(248,113,113,0.7))'
            : 'drop-shadow(0 0 10px rgba(253,224,71,0.4))',
        animation: 'playerBob 2s ease-in-out infinite',
        transition: 'filter 0.3s',
      }}>🛡️</div>
    </div>
  );
}

function Wall({ state }: { state: 'hidden' | 'rising' | 'up' | 'falling' }) {
  if (state === 'hidden') return null;
  const tx =
    state === 'rising' ? 'translateY(110%)' :
    state === 'up'     ? 'translateY(0)' :
                         'translateY(110%) rotate(8deg)';
  return (
    <div style={{
      position: 'absolute', bottom: `${WALL_Y}%`, left: `${PLAYER_X}%`,
      transform: 'translate(-50%, 50%)', pointerEvents: 'none',
      transition: 'transform 0.28s cubic-bezier(0.34,1.4,0.64,1), opacity 0.4s',
      opacity: state === 'falling' ? 0 : 1,
    }}>
      <div style={{
        transform: tx,
        transition: 'transform 0.3s cubic-bezier(0.34,1.5,0.64,1)',
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        {[0, 1, 2].map(row => (
          <div key={row} style={{
            display: 'flex', gap: 2,
            paddingLeft: row % 2 === 0 ? 0 : 14,
          }}>
            {Array.from({ length: row % 2 === 0 ? 5 : 4 }).map((_, i) => (
              <div key={i} style={{
                width: 28, height: 18,
                background: 'linear-gradient(to bottom, #6b3a2a, #3a1d18)',
                borderRadius: 3,
                border: '1px solid #2a1410',
                boxShadow: 'inset 0 1px 0 rgba(255,180,140,0.25), inset 0 -2px 2px rgba(0,0,0,0.4)',
              }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function FXEl({ fx }: { fx: FX }) {
  const age = (Date.now() - fx.born) / 700;
  const opacity = Math.max(0, 1 - age);
  if (fx.kind === 'block') {
    return (
      <div style={{
        position: 'absolute', left: `${fx.x}%`, bottom: `${fx.y}%`,
        transform: `translate(-50%, 50%) scale(${1 + age * 1.7})`,
        pointerEvents: 'none', opacity,
        fontSize: 36, filter: 'drop-shadow(0 0 14px #fde047)',
      }}>💥</div>
    );
  }
  if (fx.kind === 'hit') {
    return (
      <div style={{
        position: 'absolute', left: `${fx.x}%`, bottom: `${fx.y}%`,
        transform: `translate(-50%, ${50 + age * -50}%) scale(${1 + age * 0.5})`,
        pointerEvents: 'none', opacity,
        color: '#f87171', fontWeight: 900, fontSize: 24,
        textShadow: '0 0 14px rgba(248,113,113,0.9)',
      }}>−1 ❤️</div>
    );
  }
  if (fx.kind === 'star') {
    const dx = (fx.vx ?? 0) * age * 60;
    const dy = (fx.vy ?? 0) * age * 60;
    return (
      <div style={{
        position: 'absolute', left: `${fx.x + dx}%`, bottom: `${fx.y + dy}%`,
        transform: `translate(-50%, 50%) scale(${1 + age * 0.4}) rotate(${age * 180}deg)`,
        pointerEvents: 'none', opacity,
        fontSize: 22, filter: 'drop-shadow(0 0 10px #fde047)',
      }}>⭐</div>
    );
  }
  if (fx.kind === 'spark') {
    const dx = (fx.vx ?? 0) * age * 80;
    const dy = (fx.vy ?? 0) * age * 80;
    return (
      <div style={{
        position: 'absolute', left: `${fx.x + dx}%`, bottom: `${fx.y + dy}%`,
        transform: `translate(-50%, 50%) scale(${1 - age * 0.4})`,
        pointerEvents: 'none', opacity,
        width: 10, height: 10, borderRadius: '50%',
        background: 'radial-gradient(circle, #fde047, #f97316 55%, transparent 80%)',
        boxShadow: '0 0 8px rgba(253,224,71,0.7)',
      }} />
    );
  }
  // smoke
  return (
    <div style={{
      position: 'absolute', left: `${fx.x}%`, bottom: `${fx.y + age * 8}%`,
      transform: `translate(-50%, 50%) scale(${1 + age * 1.4})`,
      pointerEvents: 'none', opacity: opacity * 0.55,
      width: 26, height: 26, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(180,170,160,0.7), transparent 70%)',
      filter: 'blur(2px)',
    }} />
  );
}

// ── Screens ──────────────────────────────────────────────────────────────────

function MenuScreen({ onStart, totalStars }: { onStart: () => void; totalStars: number }) {
  return (
    <div style={{
      width: '100vw', height: '100dvh', overflow: 'hidden',
      background: 'linear-gradient(to bottom, #2a0a1a 0%, #5a1226 22%, #b14f2c 50%, #f4be58 80%, #2a0a18 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      padding: 'env(safe-area-inset-top) 24px env(safe-area-inset-bottom)',
      position: 'relative',
    }}>
      <Link href="/" style={{
        position: 'absolute',
        top: 'calc(env(safe-area-inset-top) + 12px)', left: 12,
        width: 44, height: 44, borderRadius: 22,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textDecoration: 'none', backdropFilter: 'blur(8px)',
      }}>
        <ChevronLeft className="w-6 h-6 text-white" />
      </Link>

      {/* Sun */}
      <div style={{
        position: 'absolute', top: '14%', left: '50%', transform: 'translateX(-50%)',
        width: 110, height: 110, borderRadius: '50%',
        background: 'radial-gradient(circle at 40% 40%, #fffbea, #fde047 50%, #f97316 90%)',
        boxShadow: '0 0 60px 22px rgba(251,191,36,0.5), 0 0 130px 50px rgba(249,115,22,0.25)',
        opacity: 0.9,
      }} />

      <div style={{
        fontSize: 96, marginBottom: 8,
        filter: 'drop-shadow(0 0 30px rgba(249,115,22,0.85)) drop-shadow(0 0 70px rgba(220,38,38,0.4))',
        animation: 'birdHover 2.4s ease-in-out infinite',
        zIndex: 2,
      }}>🦅</div>
      <h1 style={{
        fontSize: 'clamp(28px, 9vw, 44px)', fontWeight: 900, margin: '0 0 6px',
        color: '#fff7d4',
        textShadow: '0 0 28px rgba(251,191,36,0.85), 0 2px 8px rgba(0,0,0,0.7)',
        letterSpacing: 2, textAlign: 'center', whiteSpace: 'nowrap',
        zIndex: 2,
      }}>ELDFÅGELN</h1>
      <p style={{
        color: 'rgba(255,240,220,0.85)', margin: '12px 0 32px',
        textAlign: 'center', maxWidth: 320, lineHeight: 1.6, fontSize: 14,
        zIndex: 2,
      }}>
        Eldfågeln skjuter <b style={{ color: '#fdba74' }}>eldbollar</b>!<br />
        Lös <b style={{ color: '#fde047' }}>matteuppgiften</b> för att bygga
        en mur som skyddar dig.<br />
        Slå <b style={{ color: '#a78bfa' }}>draken</b> i nivå 5! 🐉
      </p>

      <button onClick={onStart} style={{
        background: 'linear-gradient(135deg, #ea580c, #b91c1c)',
        border: '1px solid rgba(254,215,170,0.5)',
        borderRadius: 22, color: '#fff',
        fontWeight: 900, fontSize: 22, padding: '16px 56px',
        cursor: 'pointer', letterSpacing: 4,
        boxShadow: '0 8px 32px rgba(220,38,38,0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
        zIndex: 2,
      }}>
        SPELA
      </button>

      <div style={{
        marginTop: 28,
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: 18, padding: '10px 24px',
        display: 'flex', alignItems: 'center', gap: 8,
        zIndex: 2,
      }}>
        <span style={{ fontSize: 22 }}>⭐</span>
        <span style={{ fontSize: 20, fontWeight: 900, color: '#fde047' }}>{totalStars}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>stjärnor totalt</span>
      </div>
    </div>
  );
}

function LevelClearScreen({ level, score, onNext }: { level: number; score: number; onNext: () => void }) {
  const isBoss = level === TOTAL_LEVELS - 1;
  return (
    <div style={{
      width: '100vw', height: '100dvh', overflow: 'hidden',
      background: 'linear-gradient(to bottom, #1a3a8a 0%, #5a1226 50%, #2a0a18 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      padding: '24px',
    }}>
      <div style={{
        fontSize: 84, marginBottom: 14,
        animation: 'pulse 1s ease-in-out infinite',
        filter: 'drop-shadow(0 0 22px rgba(253,224,71,0.85))',
      }}>🏰</div>
      <h1 style={{
        fontSize: 40, fontWeight: 900, margin: 0,
        color: '#fde047', textShadow: '0 0 28px rgba(253,224,71,0.85)',
        letterSpacing: 3,
      }}>NIVÅ {level} KLAR!</h1>
      <p style={{ color: 'rgba(255,240,220,0.7)', margin: '10px 0 30px', fontSize: 15 }}>
        {isBoss ? 'Draken väntar...' : 'Bra kämpat!'}
      </p>

      <div style={{
        background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(253,224,71,0.4)',
        borderRadius: 20, padding: '14px 40px', marginBottom: 30,
        textAlign: 'center', minWidth: 200,
      }}>
        <div style={{ fontSize: 32, fontWeight: 900, color: '#fde047' }}>⭐ {score}</div>
      </div>

      <button onClick={onNext} style={{
        background: isBoss
          ? 'linear-gradient(135deg, #b91c1c, #7f1d1d)'
          : 'linear-gradient(135deg, #ea580c, #b91c1c)',
        border: '1px solid rgba(254,215,170,0.5)',
        borderRadius: 18, color: '#fff',
        fontWeight: 900, fontSize: 20, padding: '14px 46px',
        cursor: 'pointer', letterSpacing: 2,
        boxShadow: '0 6px 28px rgba(234,88,12,0.55)',
      }}>
        {isBoss ? 'MÖT DRAKEN 🐉' : 'NÄSTA NIVÅ'}
      </button>
    </div>
  );
}

function WinScreen({ score, starsEarned, onPlayAgain, onMenu }: {
  score: number; starsEarned: number; onPlayAgain: () => void; onMenu: () => void;
}) {
  return (
    <div style={{
      width: '100vw', height: '100dvh', overflow: 'hidden',
      background: 'linear-gradient(to bottom, #fde047 0%, #f97316 30%, #b91c1c 70%, #2a0a18 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      padding: '24px',
    }}>
      <div style={{
        fontSize: 100, marginBottom: 14,
        animation: 'pulse 1.2s ease-in-out infinite',
        filter: 'drop-shadow(0 0 30px rgba(253,224,71,0.95))',
      }}>👑</div>
      <h1 style={{
        fontSize: 'clamp(32px, 11vw, 54px)', fontWeight: 900, margin: 0,
        color: '#fff7d4', textShadow: '0 0 32px rgba(253,224,71,0.9), 0 2px 8px rgba(0,0,0,0.5)',
        letterSpacing: 4, whiteSpace: 'nowrap',
      }}>VINST!</h1>
      <p style={{ color: 'rgba(255,255,255,0.9)', margin: '12px 0 28px', fontSize: 16, fontWeight: 700 }}>
        Du besegrade draken! 🐉
      </p>

      <div style={{
        background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(253,224,71,0.5)',
        borderRadius: 24, padding: '22px 50px', marginBottom: 28, textAlign: 'center', minWidth: 240,
      }}>
        <div style={{ fontSize: 44, fontWeight: 900, color: '#fde047' }}>+{starsEarned} ⭐</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 }}>
          Poäng: {score}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        <button onClick={onPlayAgain} style={{
          background: 'linear-gradient(135deg, #ea580c, #b91c1c)',
          border: '1px solid rgba(254,215,170,0.5)',
          borderRadius: 18, color: '#fff',
          fontWeight: 900, fontSize: 20, padding: '14px 46px',
          cursor: 'pointer', letterSpacing: 2,
          boxShadow: '0 6px 28px rgba(234,88,12,0.6)',
        }}>SPELA IGEN</button>
        <button onClick={onMenu} style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 14, color: 'rgba(255,255,255,0.85)',
          fontWeight: 700, fontSize: 14, padding: '10px 28px',
          cursor: 'pointer',
        }}>Tillbaka till menyn</button>
      </div>
    </div>
  );
}

function GameOverScreen({ score, level, starsEarned, onRestart, onMenu }: {
  score: number; level: number; starsEarned: number;
  onRestart: () => void; onMenu: () => void;
}) {
  return (
    <div style={{
      width: '100vw', height: '100dvh', overflow: 'hidden',
      background: 'linear-gradient(to bottom, #1a0408, #5a1218, #2a0a08)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      padding: '24px',
    }}>
      <div style={{
        fontSize: 84, marginBottom: 14,
        animation: 'pulse 1.2s ease-in-out infinite',
        filter: 'drop-shadow(0 0 22px rgba(248,113,113,0.7))',
      }}>🔥</div>
      <h1 style={{
        fontSize: 46, fontWeight: 900, margin: 0,
        color: '#fca5a5', textShadow: '0 0 28px rgba(248,113,113,0.7)',
        letterSpacing: 3,
      }}>SLUT!</h1>
      <p style={{ color: 'rgba(255,210,210,0.55)', margin: '8px 0 24px', fontSize: 15 }}>
        Eldfågeln tog dig...
      </p>

      <div style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 22,
        padding: '20px 50px', marginBottom: 28, textAlign: 'center', minWidth: 230,
      }}>
        <div style={{ fontSize: 40, fontWeight: 900, color: '#fde047' }}>+{starsEarned} ⭐</div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>
          Poäng: {score} · Nivå {level}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        <button onClick={onRestart} style={{
          background: 'linear-gradient(135deg, #ea580c, #b91c1c)',
          border: '1px solid rgba(254,215,170,0.5)',
          borderRadius: 18, color: '#fff',
          fontWeight: 900, fontSize: 20, padding: '14px 46px',
          cursor: 'pointer', letterSpacing: 2,
          boxShadow: '0 6px 28px rgba(234,88,12,0.55)',
        }}>FÖRSÖK IGEN</button>
        <button onClick={onMenu} style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 14, color: 'rgba(255,255,255,0.7)',
          fontWeight: 700, fontSize: 14, padding: '10px 28px',
          cursor: 'pointer',
        }}>Tillbaka till menyn</button>
      </div>
    </div>
  );
}

// ── Main game ────────────────────────────────────────────────────────────────

export default function EldfagelnGame() {
  const { progress, updateMathScore } = useProgress();

  const [gs, setGs] = useState<GameState>('menu');

  const [fireball, setFireball] = useState<Fireball | null>(null);
  const [question, setQuestion] = useState<MathQ | null>(null);
  const [wallState, setWallState] = useState<'hidden' | 'rising' | 'up' | 'falling'>('hidden');
  const [fxList, setFxList]       = useState<FX[]>([]);

  const [score, setScore]   = useState(0);
  const [lives, setLives]   = useState(INIT_LIVES);
  const [level, setLevel]   = useState(1);
  const [questionsLeft, setQuestionsLeft] = useState(QUESTIONS_PER_LEVEL[0]);
  const [bossHp, setBossHp] = useState(0);
  const [bossMaxHp, setBossMaxHp] = useState(0);
  const [slowCharges, setSlowCharges] = useState(SLOW_CHARGES);
  const [slowed, setSlowed] = useState(false);

  const [shake, setShake] = useState(false);
  const [flashRed, setFlashRed] = useState(false);
  const [feedback, setFeedback] = useState<'block' | 'hit' | null>(null);
  const [endStars, setEndStars] = useState(0);
  const [birdX, setBirdX] = useState(50);

  const idRef = useRef(1);
  const stateRef = useRef({
    fireball: null as Fireball | null,
    question: null as MathQ | null,
    score: 0,
    lives: INIT_LIVES,
    level: 1,
    questionsLeft: QUESTIONS_PER_LEVEL[0],
    bossHp: 0,
    slowUntil: 0,
    answered: false,
    nextRoundAt: 0,
    levelClearedAt: 0,
    birdX: 50,
    birdDir: 1,
  });

  const syncFireball = (f: Fireball | null) => {
    stateRef.current.fireball = f;
    setFireball(f);
  };

  const syncQuestion = (q: MathQ | null) => {
    stateRef.current.question = q;
    setQuestion(q);
  };

  const pushFx = (x: number, y: number, kind: FX['kind'], vx?: number, vy?: number) => {
    const fx: FX = { id: idRef.current++, x, y, kind, born: Date.now(), vx, vy };
    setFxList(prev => [...prev, fx]);
    setTimeout(() => setFxList(prev => prev.filter(f => f.id !== fx.id)), 750);
  };

  const startNextRound = useCallback(() => {
    const st = stateRef.current;
    const lvl = st.level;
    const q = generateQuestion(lvl);
    const isBoss = lvl === TOTAL_LEVELS;
    const baseDur = isBoss ? 3.4 : Math.max(2.6, 5.2 - (lvl - 1) * 0.55);
    const startX = st.birdX;
    const startY = BIRD_Y;
    const f: Fireball = {
      id: idRef.current++,
      startX, startY,
      endX: PLAYER_X, endY: PLAYER_Y,
      x: startX, y: startY,
      duration: baseDur,
      elapsed: 0,
      state: 'flying',
      size: isBoss ? 50 : 40,
      trail: [],
    };
    syncQuestion(q);
    syncFireball(f);
    st.answered = false;
    setWallState('hidden');
  }, []);

  const startGame = useCallback(() => {
    idRef.current = 1;
    stateRef.current = {
      fireball: null,
      question: null,
      score: 0,
      lives: INIT_LIVES,
      level: 1,
      questionsLeft: QUESTIONS_PER_LEVEL[0],
      bossHp: 0,
      slowUntil: 0,
      answered: false,
      nextRoundAt: 0,
      levelClearedAt: 0,
      birdX: 50,
      birdDir: 1,
    };
    setFireball(null); setQuestion(null);
    setScore(0); setLives(INIT_LIVES); setLevel(1);
    setQuestionsLeft(QUESTIONS_PER_LEVEL[0]);
    setBossHp(0); setBossMaxHp(QUESTIONS_PER_LEVEL[TOTAL_LEVELS - 1]);
    setSlowCharges(SLOW_CHARGES); setSlowed(false);
    setShake(false); setFlashRed(false); setFeedback(null);
    setWallState('hidden');
    setFxList([]);
    setBirdX(50);
    setGs('playing');
    setTimeout(startNextRound, 600);
  }, [startNextRound]);

  const goNextLevel = useCallback(() => {
    const st = stateRef.current;
    const newLevel = st.level + 1;
    if (newLevel > TOTAL_LEVELS) {
      // Win
      const finalScore = st.score;
      const earned = Math.max(0, Math.floor(finalScore / 5) - Math.floor(progress.mathHighScore / 5));
      updateMathScore(finalScore);
      setEndStars(earned);
      setGs('win');
      return;
    }
    const isBoss = newLevel === TOTAL_LEVELS;
    st.level = newLevel;
    st.questionsLeft = QUESTIONS_PER_LEVEL[newLevel - 1];
    st.bossHp = isBoss ? QUESTIONS_PER_LEVEL[newLevel - 1] : 0;
    st.fireball = null; st.question = null;
    setLevel(newLevel);
    setQuestionsLeft(QUESTIONS_PER_LEVEL[newLevel - 1]);
    setBossHp(isBoss ? QUESTIONS_PER_LEVEL[newLevel - 1] : 0);
    setBossMaxHp(QUESTIONS_PER_LEVEL[newLevel - 1]);
    setFireball(null); setQuestion(null);
    setWallState('hidden');
    setGs('playing');
    setTimeout(startNextRound, 600);
  }, [progress.mathHighScore, updateMathScore, startNextRound]);

  const endGame = useCallback(() => {
    const finalScore = stateRef.current.score;
    const earned = Math.max(0, Math.floor(finalScore / 5) - Math.floor(progress.mathHighScore / 5));
    updateMathScore(finalScore);
    setEndStars(earned);
    setGs('gameover');
  }, [progress.mathHighScore, updateMathScore]);

  const onSlowMo = useCallback(() => {
    const st = stateRef.current;
    if (slowCharges <= 0) return;
    if (Date.now() < st.slowUntil) return;
    setSlowCharges(c => c - 1);
    st.slowUntil = Date.now() + SLOW_MS;
    setSlowed(true);
    setTimeout(() => {
      if (Date.now() >= stateRef.current.slowUntil) setSlowed(false);
    }, SLOW_MS + 50);
  }, [slowCharges]);

  const onAnswer = useCallback((n: number) => {
    const st = stateRef.current;
    if (gs !== 'playing') return;
    if (st.answered) return;
    if (!st.fireball || !st.question) return;
    if (st.fireball.state !== 'flying') return;

    st.answered = true;

    if (n === st.question.answer) {
      // Correct: build wall, fireball will explode at wall
      pushFx(st.fireball.x, WALL_Y + 4, 'block');
      // sparks
      for (let i = 0; i < 6; i++) {
        const ang = Math.random() * Math.PI * 2;
        pushFx(st.fireball.x, WALL_Y + 4, 'spark', Math.cos(ang) * 0.6, Math.sin(ang) * 0.6);
      }
      // stars flying to HUD
      for (let i = 0; i < 3; i++) {
        pushFx(st.fireball.x + (Math.random() - 0.5) * 8, WALL_Y + 4, 'star',
          (8 - st.fireball.x) / 60, (90 - WALL_Y) / 80);
      }

      st.score += 1;
      setScore(st.score);

      const isBoss = st.level === TOTAL_LEVELS;
      if (isBoss) {
        st.bossHp = Math.max(0, st.bossHp - 1);
        setBossHp(st.bossHp);
      }
      st.questionsLeft = Math.max(0, st.questionsLeft - 1);
      setQuestionsLeft(st.questionsLeft);

      // Wall raise + redirect fireball
      setWallState('rising');
      st.fireball.endY = WALL_Y;
      st.fireball.endX = PLAYER_X;
      // Stop fireball at wall
      st.fireball.state = 'blocked';
      setFeedback('block');
      setTimeout(() => setFeedback(null), 400);
    } else {
      // Wrong: fireball continues; small shake + miss feedback
      setShake(true);
      setTimeout(() => setShake(false), 350);
    }
  }, [gs]);

  // Game loop
  useEffect(() => {
    if (gs !== 'playing') return;
    const id = setInterval(() => {
      const st = stateRef.current;
      const dt = TICK_MS / 1000;
      const slowFactor = Date.now() < st.slowUntil ? SLOW_FACTOR : 1.0;

      // Bird hover sway
      st.birdX += st.birdDir * 6 * dt;
      if (st.birdX > 70) { st.birdX = 70; st.birdDir = -1; }
      if (st.birdX < 30) { st.birdX = 30; st.birdDir = 1; }
      setBirdX(st.birdX);

      // Slow indicator off
      if (slowed && Date.now() >= st.slowUntil) setSlowed(false);

      // Update fireball
      const fb = st.fireball;
      if (fb) {
        if (fb.state === 'flying' || fb.state === 'blocked') {
          fb.elapsed += dt * slowFactor;
          const t = Math.min(1, fb.elapsed / fb.duration);
          // Parabolic arc: linear interpolation in X, but Y dips upward then comes back
          const arc = 14;  // peak above midpoint of straight line
          const midY = (fb.startY + fb.endY) / 2;
          const lineY = fb.startY + (fb.endY - fb.startY) * t;
          // Offset down toward target with a small over-arc on the way
          const overshoot = -arc * 4 * t * (1 - t);
          fb.x = fb.startX + (fb.endX - fb.startX) * t;
          fb.y = lineY + overshoot;

          // Trail
          if (Math.random() < 0.65) {
            fb.trail.push({ x: fb.x, y: fb.y, born: Date.now() });
            if (fb.trail.length > 10) fb.trail.shift();
          }
          // Cleanup old trail
          fb.trail = fb.trail.filter(t => Date.now() - t.born < 400);

          if (t >= 1) {
            if (fb.state === 'blocked') {
              fb.state = 'done';
              setWallState('up');
              // Crumble shortly after
              setTimeout(() => setWallState('falling'), 380);
              setTimeout(() => setWallState('hidden'), 760);
            } else {
              // Hit player
              fb.state = 'done';
              pushFx(PLAYER_X, PLAYER_Y + 8, 'hit');
              for (let i = 0; i < 5; i++) pushFx(PLAYER_X, PLAYER_Y + 4, 'smoke');
              st.lives = Math.max(0, st.lives - 1);
              setLives(st.lives);
              setShake(true); setFlashRed(true);
              setFeedback('hit');
              setTimeout(() => { setShake(false); setFlashRed(false); setFeedback(null); }, 500);
              if (st.lives <= 0) {
                endGame();
                return;
              }
              st.questionsLeft = Math.max(0, st.questionsLeft - 1);
              setQuestionsLeft(st.questionsLeft);
              const isBoss = st.level === TOTAL_LEVELS;
              if (isBoss) {
                // Boss: missing doesn't reduce HP, but life lost
              }
            }
            // Schedule next round / level change
            st.nextRoundAt = Date.now() + ROUND_GAP_MS;
            syncFireball(fb);
          } else {
            syncFireball(fb);
          }
        }
      }

      // Round transition
      if (!st.fireball || st.fireball.state === 'done') {
        if (st.nextRoundAt > 0 && Date.now() >= st.nextRoundAt) {
          st.nextRoundAt = 0;
          syncFireball(null);
          syncQuestion(null);

          const isBoss = st.level === TOTAL_LEVELS;
          const cleared = isBoss ? st.bossHp <= 0 : st.questionsLeft <= 0;

          if (cleared) {
            // Level complete
            setGs(st.level === TOTAL_LEVELS ? 'win' : 'levelClear');
            if (st.level === TOTAL_LEVELS) {
              const earned = Math.max(0, Math.floor(st.score / 5) - Math.floor(progress.mathHighScore / 5));
              updateMathScore(st.score);
              setEndStars(earned);
            }
          } else {
            startNextRound();
          }
        }
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [gs, slowed, endGame, startNextRound, progress.mathHighScore, updateMathScore]);

  if (gs === 'menu') return <MenuScreen onStart={startGame} totalStars={progress.totalStars} />;
  if (gs === 'gameover') return <GameOverScreen score={score} level={level} starsEarned={endStars} onRestart={startGame} onMenu={() => setGs('menu')} />;
  if (gs === 'win') return <WinScreen score={score} starsEarned={endStars} onPlayAgain={startGame} onMenu={() => setGs('menu')} />;
  if (gs === 'levelClear') return <LevelClearScreen level={level} score={score} onNext={goNextLevel} />;

  const isBoss = level === TOTAL_LEVELS;
  const slowReady = slowCharges > 0 && !slowed;

  return (
    <div
      className={shake ? 'eldShake' : ''}
      style={{
        width: '100vw', height: '100dvh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        userSelect: 'none', position: 'relative',
      }}
    >
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: 'calc(env(safe-area-inset-top) + 10px) 14px 10px',
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <button
          onClick={() => setGs('menu')}
          style={{
            width: 40, height: 40, borderRadius: 20,
            background: 'rgba(255,255,255,0.12)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div style={{ flex: 1, color: '#fde68a', fontWeight: 900, fontSize: 16, letterSpacing: 2 }}>
          {isBoss ? '🐉 DRAKBOSS' : '🦅 ELDFÅGELN'}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              fontSize: 18, opacity: i < lives ? 1 : 0.18,
              filter: i < lives ? 'drop-shadow(0 0 6px rgba(248,113,113,0.7))' : 'grayscale(1)',
              transition: 'all 0.3s',
            }}>❤️</span>
          ))}
        </div>
      </header>

      {/* Scene */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        <Background slowed={slowed} />

        {/* Slow-mo blue tint */}
        {slowed && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(circle at center, rgba(96,165,250,0.18), rgba(30,64,175,0.28) 70%)',
            mixBlendMode: 'screen',
          }} />
        )}

        {/* HUD top */}
        <div style={{
          position: 'absolute', top: 12, left: 0, right: 0,
          display: 'flex', justifyContent: 'space-between',
          padding: '0 16px', zIndex: 5, pointerEvents: 'none',
        }}>
          <div style={{
            color: '#fde047', fontWeight: 800, fontSize: 18,
            background: 'rgba(0,0,0,0.45)', padding: '4px 12px', borderRadius: 12,
            border: '1px solid rgba(253,224,71,0.3)',
            textShadow: '0 0 10px rgba(253,224,71,0.5)',
          }}>
            ⭐ {score}
          </div>
          <div style={{
            color: '#fef3c7', fontWeight: 800, fontSize: 14,
            background: 'rgba(0,0,0,0.45)', padding: '4px 12px', borderRadius: 12,
            border: '1px solid rgba(254,215,170,0.3)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span>NIVÅ {level}/{TOTAL_LEVELS}</span>
            {!isBoss && <>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>·</span>
              <span>{QUESTIONS_PER_LEVEL[level - 1] - questionsLeft + 1}/{QUESTIONS_PER_LEVEL[level - 1]}</span>
            </>}
          </div>
        </div>

        {/* Boss HP bar */}
        {isBoss && bossMaxHp > 0 && (
          <div style={{
            position: 'absolute', top: 50, left: '50%', transform: 'translateX(-50%)',
            zIndex: 5, pointerEvents: 'none',
            background: 'rgba(0,0,0,0.55)', padding: '4px 8px', borderRadius: 12,
            border: '1px solid rgba(220,38,38,0.5)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>🐉</span>
            <div style={{
              width: 140, height: 10, borderRadius: 5,
              background: 'rgba(0,0,0,0.55)',
              overflow: 'hidden', position: 'relative',
            }}>
              <div style={{
                height: '100%', width: `${(bossHp / bossMaxHp) * 100}%`,
                background: 'linear-gradient(to right, #fde047, #ea580c, #b91c1c)',
                transition: 'width 0.4s',
                boxShadow: '0 0 10px rgba(220,38,38,0.6)',
              }} />
            </div>
            <span style={{ color: '#fca5a5', fontWeight: 900, fontSize: 12 }}>
              {bossHp}/{bossMaxHp}
            </span>
          </div>
        )}

        {/* Bird */}
        <BirdEnemy x={birdX} y={BIRD_Y} windup={!!fireball && fireball.state === 'flying' && fireball.elapsed < 0.18} isBoss={isBoss} />

        {/* Wall */}
        <Wall state={wallState} />

        {/* Fireball */}
        {fireball && fireball.state !== 'done' && <FireballEl f={fireball} slowed={slowed} />}

        {/* Player */}
        <Player lives={lives} hit={feedback === 'hit'} />

        {/* FX */}
        {fxList.map(fx => <FXEl key={fx.id} fx={fx} />)}

        {/* Slow-mo button (in scene, bottom-left) */}
        <button
          onClick={onSlowMo}
          disabled={!slowReady}
          style={{
            position: 'absolute', bottom: 14, right: 14, zIndex: 6,
            width: 60, height: 60, borderRadius: 30,
            background: slowReady
              ? 'linear-gradient(135deg, #60a5fa, #2563eb)'
              : 'rgba(60,60,80,0.5)',
            border: slowReady ? '2px solid rgba(191,219,254,0.6)' : '2px solid rgba(255,255,255,0.1)',
            color: '#fff', cursor: slowReady ? 'pointer' : 'default',
            boxShadow: slowReady
              ? '0 4px 18px rgba(37,99,235,0.6), inset 0 1px 0 rgba(255,255,255,0.4)'
              : 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900,
            opacity: slowReady ? 1 : 0.55,
            transition: 'transform 0.1s, box-shadow 0.2s',
          }}
        >
          <Hourglass className="w-6 h-6" />
          <div style={{ fontSize: 11, marginTop: 1 }}>{slowCharges}</div>
        </button>

        {/* Red flash on damage */}
        {flashRed && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 50% 18%, rgba(220,40,40,0.5), transparent 65%)',
            animation: 'redPulse 0.5s ease-out',
          }} />
        )}
      </div>

      {/* Bottom panel: question + choices */}
      <div style={{
        flexShrink: 0,
        background: 'linear-gradient(to top, rgba(20,5,5,0.99) 70%, rgba(20,5,5,0.85))',
        borderTop: '1px solid rgba(255,200,150,0.15)',
        padding: '12px 16px calc(env(safe-area-inset-bottom) + 16px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        minHeight: 200,
      }}>
        <div style={{ minHeight: 36, display: 'flex', alignItems: 'center', gap: 10 }}>
          {question ? (
            <>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700 }}>
                Bygg muren —
              </span>
              <span style={{
                background: 'linear-gradient(135deg, #fde047, #f97316)',
                color: '#3a1900', fontWeight: 900, fontSize: 24,
                padding: '4px 16px', borderRadius: 12, letterSpacing: 1,
                boxShadow: '0 0 18px rgba(251,146,60,0.55)',
                animation: 'symbolPop 0.3s ease-out',
              }} key={question.text}>
                {question.text} = ?
              </span>
            </>
          ) : (
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 700 }}>
              Eldfågeln laddar...
            </span>
          )}
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8, width: '100%', maxWidth: 420,
        }}>
          {Array.from({ length: 4 }).map((_, i) => {
            const c = question?.choices[i];
            const disabled = c == null || !question || !fireball || stateRef.current.answered;
            return (
              <button
                key={`slot-${i}`}
                onClick={() => c != null && onAnswer(c)}
                disabled={disabled}
                style={{
                  height: 60, borderRadius: 14, border: 'none',
                  fontSize: 24, fontWeight: 900,
                  cursor: disabled ? 'default' : 'pointer',
                  color: disabled ? 'rgba(255,255,255,0.18)' : '#3a1900',
                  background: disabled
                    ? 'rgba(255,255,255,0.06)'
                    : 'linear-gradient(135deg, #fef3c7, #fbbf24)',
                  boxShadow: disabled
                    ? 'none'
                    : '0 4px 14px rgba(251,191,36,0.45), inset 0 1px 0 rgba(255,255,255,0.5)',
                  transition: 'transform 0.08s, box-shadow 0.2s',
                }}
                onTouchStart={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.94)'; }}
                onTouchEnd={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
                onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.94)'; }}
                onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
              >
                {c ?? ''}
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes birdHover {
          0%,100% { transform: translateY(0) rotate(-3deg); }
          50%      { transform: translateY(-8px) rotate(3deg); }
        }
        @keyframes birdWindup {
          0%   { transform: translateY(0) rotate(-6deg) scale(1); }
          100% { transform: translateY(-3px) rotate(8deg) scale(1.08); }
        }
        @keyframes birdGlow {
          0%,100% { transform: translate(-50%,-50%) scale(0.9); opacity: 0.5; }
          50%      { transform: translate(-50%,-50%) scale(1.15); opacity: 0.85; }
        }
        @keyframes fireFlicker {
          0%   { transform: scale(1); }
          100% { transform: scale(1.06); }
        }
        @keyframes eldDrift {
          0%   { transform: translateX(0); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateX(110vw); opacity: 0; }
        }
        @keyframes playerBob {
          0%,100% { transform: translate(-50%, 50%) translateY(0); }
          50%      { transform: translate(-50%, 50%) translateY(-3px); }
        }
        @keyframes redPulse {
          0% { opacity: 0; }
          40% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes symbolPop {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.07); }
        }
        @keyframes eldshake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-8px) rotate(-0.4deg); }
          40%     { transform: translateX(8px)  rotate(0.4deg); }
          60%     { transform: translateX(-5px); }
          80%     { transform: translateX(5px); }
        }
        .eldShake { animation: eldshake 0.45s ease-in-out; }
      `}</style>
    </div>
  );
}
