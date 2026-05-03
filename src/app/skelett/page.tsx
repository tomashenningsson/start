'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';

type GameState = 'menu' | 'playing' | 'gameover';
type ProjectileType = 'arrow' | 'slime';

interface Skeleton {
  id: number;
  x: number;
  shootCooldown: number;
  windup: number;
  variant: 0 | 1 | 2;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  type: ProjectileType;
  symbol: string;
  spin: number;
  startX: number;
  baseY: number;
  arcHeight: number;
}

interface FX {
  id: number;
  x: number;
  y: number;
  kind: 'hit' | 'miss' | 'dust';
  born: number;
}

const PLAYER_X       = 8;
const SKELETON_SPAWN = 96;
const SKELETON_HIT_X = 14;
const PROJECTILE_HIT_X = 12;
const TICK_MS        = 50;

const LETTERS = 'ABCDEFGHIJKLMNOPRSTUVÄÖ'.split('');
const DIGITS  = '0123456789'.split('');

const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 55,
  size: Math.random() * 1.8 + 0.4,
  opacity: Math.random() * 0.4 + 0.15,
}));

const FOG_BLOBS = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  left: Math.random() * 80,
  size: 140 + Math.random() * 110,
  delay: i * 1.7,
  opacity: 0.06 + Math.random() * 0.05,
}));

const GRAVES = [
  { x: 25, type: 'cross' as const },
  { x: 52, type: 'rounded' as const },
  { x: 74, type: 'cross' as const },
  { x: 88, type: 'rounded' as const },
];

const TORCHES = [
  { x: 6 },
  { x: 50 },
  { x: 94 },
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildChoices(correct: string, type: ProjectileType): string[] {
  const pool = (type === 'arrow' ? DIGITS : LETTERS).filter(c => c !== correct);
  return shuffle([correct, ...shuffle(pool).slice(0, 5)]);
}

function difficulty(level: number) {
  return {
    skeletonCount:    Math.min(1 + Math.floor((level - 1) / 2), 4),
    skeletonSpeed:    1.4 + (level - 1) * 0.35,        // % per second
    shootInterval:    Math.max(2.0, 4.5 - (level - 1) * 0.4),
    projectileSpeed:  18 + (level - 1) * 3.5,           // % per second
    letterChance:     Math.min(0.25 + (level - 1) * 0.06, 0.55),
  };
}

// ── Visuals ───────────────────────────────────────────────────────────────────

function Torch({ x }: { x: number }) {
  return (
    <div style={{
      position: 'absolute', bottom: 60, left: `${x}%`,
      transform: 'translateX(-50%)', pointerEvents: 'none',
      width: 14,
    }}>
      <div style={{
        width: 16, height: 22, borderRadius: '50% 50% 40% 40% / 60% 60% 40% 40%',
        background: 'radial-gradient(circle at 50% 30%, #fffbe6, #fbbf24 40%, #ea580c 70%, #7c2d12 100%)',
        boxShadow: '0 0 22px 8px rgba(251,146,60,0.55), 0 0 60px 18px rgba(251,146,60,0.18)',
        animation: 'flame 0.42s ease-in-out infinite alternate',
        margin: '0 auto',
      }} />
      <div style={{
        width: 4, height: 28, background: 'linear-gradient(to bottom, #5b3a1e, #2a1808)',
        borderRadius: 2, margin: '0 auto', marginTop: -2,
      }} />
    </div>
  );
}

function Grave({ x, type }: { x: number; type: 'cross' | 'rounded' }) {
  return (
    <div style={{
      position: 'absolute', bottom: 14, left: `${x}%`,
      transform: 'translateX(-50%)', pointerEvents: 'none',
    }}>
      {type === 'rounded' ? (
        <div style={{
          width: 22, height: 30,
          background: 'linear-gradient(to bottom, #4a4a55, #2a2a35)',
          borderRadius: '50% 50% 0 0 / 65% 65% 0 0',
          boxShadow: 'inset 1px 0 1px rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.5)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
            color: 'rgba(180,180,200,0.55)', fontSize: 8, fontWeight: 800,
          }}>RIP</div>
        </div>
      ) : (
        <div style={{
          width: 18, height: 28,
          background: 'linear-gradient(to bottom, #4a4a55, #2a2a35)',
          borderRadius: '4px 4px 2px 2px',
          position: 'relative',
          boxShadow: 'inset 1px 0 1px rgba(255,255,255,0.12), 0 2px 4px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)',
            width: 4, height: 14, background: '#3a3a45', borderRadius: 2,
          }} />
          <div style={{
            position: 'absolute', top: 1, left: '50%', transform: 'translateX(-50%)',
            width: 12, height: 4, background: '#3a3a45', borderRadius: 2,
          }} />
        </div>
      )}
    </div>
  );
}

function SkeletonChar({ s, fire }: { s: Skeleton; fire: boolean }) {
  const tilt = fire ? -10 : 0;
  return (
    <div style={{
      position: 'absolute', bottom: 18, left: `${s.x}%`,
      transform: 'translateX(-50%)', pointerEvents: 'none',
      transition: 'transform 0.15s',
    }}>
      <div style={{
        fontSize: 42,
        animation: fire ? 'shootShake 0.18s ease-in-out infinite' : 'walkBone 0.55s ease-in-out infinite',
        filter: 'drop-shadow(0 0 12px rgba(180,200,255,0.55)) drop-shadow(0 0 22px rgba(120,150,255,0.25))',
        transform: `scaleX(-1) rotate(${tilt}deg)`,
      }}>💀</div>
      <div style={{
        position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)',
        width: 28, height: 5, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.55), transparent 70%)',
      }} />
    </div>
  );
}

function ProjectileEl({ p }: { p: Projectile }) {
  const isArrow = p.type === 'arrow';
  return (
    <div style={{
      position: 'absolute', left: `${p.x}%`, bottom: `${p.y}%`,
      transform: `translate(-50%, 50%) rotate(${isArrow ? '180deg' : `${p.spin}deg`})`,
      pointerEvents: 'none',
      transition: 'left 0.05s linear',
    }}>
      {isArrow ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 0,
          filter: 'drop-shadow(0 0 8px rgba(255,200,100,0.6)) drop-shadow(0 0 16px rgba(255,140,40,0.3))',
        }}>
          <div style={{
            width: 0, height: 0,
            borderTop: '12px solid transparent',
            borderBottom: '12px solid transparent',
            borderLeft: '14px solid #fbbf24',
          }} />
          <div style={{
            width: 30, height: 20, marginLeft: -1,
            background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#3a1900', fontWeight: 900, fontSize: 16,
            transform: 'rotate(180deg)',
            border: '2px solid #92400e',
            borderRadius: 4,
          }}>{p.symbol}</div>
          <div style={{
            width: 14, height: 4, background: '#92400e',
            borderRadius: 2, marginLeft: 1,
          }} />
        </div>
      ) : (
        <div style={{
          width: 38, height: 38, borderRadius: '52% 48% 45% 55% / 50% 55% 45% 50%',
          background: 'radial-gradient(circle at 35% 30%, #d9f99d, #84cc16 40%, #4d7c0f 80%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#1a2e05', fontWeight: 900, fontSize: 18,
          boxShadow: '0 0 16px rgba(132,204,22,0.6), 0 0 30px rgba(132,204,22,0.3), inset -3px -4px 8px rgba(0,0,0,0.25), inset 3px 3px 6px rgba(255,255,255,0.35)',
          textShadow: '0 1px 0 rgba(255,255,255,0.4)',
        }}>{p.symbol}</div>
      )}
    </div>
  );
}

function FXEl({ fx }: { fx: FX }) {
  const age = (Date.now() - fx.born) / 600;
  const opacity = Math.max(0, 1 - age);
  if (fx.kind === 'hit') {
    return (
      <div style={{
        position: 'absolute', left: `${fx.x}%`, bottom: `${fx.y}%`,
        transform: `translate(-50%, 50%) scale(${1 + age * 1.6})`,
        pointerEvents: 'none', opacity,
        fontSize: 32, filter: 'drop-shadow(0 0 12px #fde047)',
      }}>✨</div>
    );
  }
  if (fx.kind === 'miss') {
    return (
      <div style={{
        position: 'absolute', left: `${fx.x}%`, bottom: `${fx.y}%`,
        transform: `translate(-50%, ${50 + age * -30}%) scale(${1 + age * 0.6})`,
        pointerEvents: 'none', opacity,
        color: '#f87171', fontWeight: 900, fontSize: 22,
        textShadow: '0 0 14px rgba(248,113,113,0.9)',
      }}>−1</div>
    );
  }
  return (
    <div style={{
      position: 'absolute', left: `${fx.x}%`, bottom: `${fx.y}%`,
      transform: `translate(-50%, 50%) scale(${1 + age})`,
      pointerEvents: 'none', opacity: opacity * 0.5,
      width: 24, height: 24, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(180,180,200,0.7), transparent 70%)',
    }} />
  );
}

// ── Screens ───────────────────────────────────────────────────────────────────

function MenuScreen({ onStart, totalStars }: { onStart: () => void; totalStars: number }) {
  return (
    <div style={{
      width: '100vw', height: '100dvh', overflow: 'hidden',
      background: 'linear-gradient(to bottom, #02000a 0%, #0a0518 35%, #1a0d2a 65%, #0a0210 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      padding: 'env(safe-area-inset-top) 24px env(safe-area-inset-bottom)',
      position: 'relative',
    }}>
      <Link href="/" style={{
        position: 'absolute',
        top: 'calc(env(safe-area-inset-top) + 12px)', left: 12,
        width: 44, height: 44, borderRadius: 22,
        background: 'rgba(255,255,255,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textDecoration: 'none', backdropFilter: 'blur(8px)',
      }}>
        <ChevronLeft className="w-6 h-6 text-white" />
      </Link>

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
        position: 'absolute', top: '7%', right: '12%',
        width: 72, height: 72, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #fffbea, #d4d4d8 70%, #71717a)',
        boxShadow: '0 0 30px 10px rgba(220,220,240,0.35), 0 0 80px 26px rgba(180,180,210,0.12)',
        opacity: 0.85,
      }} />

      <div style={{
        fontSize: 96, marginBottom: 8,
        filter: 'drop-shadow(0 0 26px rgba(180,200,255,0.85)) drop-shadow(0 0 60px rgba(120,150,255,0.3))',
        animation: 'sFloat 3.2s ease-in-out infinite',
      }}>💀</div>
      <h1 style={{
        fontSize: 40, fontWeight: 900, margin: '0 0 6px',
        color: '#e0e7ff',
        textShadow: '0 0 28px rgba(180,200,255,0.85), 0 2px 8px rgba(0,0,0,0.7)',
        letterSpacing: 4, textAlign: 'center',
      }}>SKELETTKRYPTAN</h1>
      <p style={{
        color: 'rgba(200,200,230,0.7)', margin: '12px 0 32px',
        textAlign: 'center', maxWidth: 320, lineHeight: 1.6, fontSize: 14,
      }}>
        Skelett kastar pilar med <b style={{ color: '#fbbf24' }}>siffror</b> och
        slem med <b style={{ color: '#a3e635' }}>bokstäver</b>.<br />
        Tryck rätt symbol innan du blir träffad!
      </p>

      <button onClick={onStart} style={{
        background: 'linear-gradient(135deg, #6d28d9, #4c1d95)',
        border: '1px solid rgba(196,181,253,0.4)',
        borderRadius: 22, color: '#fff',
        fontWeight: 900, fontSize: 22, padding: '16px 56px',
        cursor: 'pointer', letterSpacing: 4,
        boxShadow: '0 8px 32px rgba(109,40,217,0.65), inset 0 1px 0 rgba(255,255,255,0.25)',
      }}>
        SPELA
      </button>

      <div style={{
        marginTop: 28,
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 18, padding: '10px 24px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 22 }}>⭐</span>
        <span style={{ fontSize: 20, fontWeight: 900, color: '#fde047' }}>{totalStars}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>stjärnor totalt</span>
      </div>

      <style>{`
        @keyframes sFloat {
          0%,100% { transform: translateY(0) rotate(-3deg); }
          50%      { transform: translateY(-12px) rotate(3deg); }
        }
      `}</style>
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
      background: 'linear-gradient(to bottom, #04000a, #1a0418, #0a0008)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      padding: '24px',
    }}>
      <div style={{
        fontSize: 84, marginBottom: 14,
        animation: 'pulse 1.2s ease-in-out infinite',
        filter: 'drop-shadow(0 0 22px rgba(180,200,255,0.6))',
      }}>☠️</div>
      <h1 style={{
        fontSize: 46, fontWeight: 900, margin: 0,
        color: '#c4b5fd', textShadow: '0 0 28px rgba(196,181,253,0.85)',
        letterSpacing: 3,
      }}>SLUT!</h1>
      <p style={{ color: 'rgba(220,210,255,0.55)', margin: '8px 0 24px', fontSize: 15 }}>
        Skeletten fick dig...
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
          background: 'linear-gradient(135deg, #6d28d9, #4c1d95)',
          border: '1px solid rgba(196,181,253,0.4)',
          borderRadius: 18, color: '#fff',
          fontWeight: 900, fontSize: 20, padding: '14px 46px',
          cursor: 'pointer', letterSpacing: 2,
          boxShadow: '0 6px 28px rgba(109,40,217,0.55)',
        }}>FÖRSÖK IGEN</button>
        <button onClick={onMenu} style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 14, color: 'rgba(255,255,255,0.7)',
          fontWeight: 700, fontSize: 14, padding: '10px 28px',
          cursor: 'pointer',
        }}>Tillbaka till menyn</button>
      </div>

      <style>{`@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }`}</style>
    </div>
  );
}

// ── Main game ─────────────────────────────────────────────────────────────────

export default function SkelettGame() {
  const { progress, updateMathScore } = useProgress();

  const [gs, setGs] = useState<GameState>('menu');

  const [skeletons, setSkeletons]   = useState<Skeleton[]>([]);
  const [projectile, setProjectile] = useState<Projectile | null>(null);
  const [choices, setChoices]       = useState<string[]>([]);
  const [fxList, setFxList]         = useState<FX[]>([]);

  const [score, setScore]   = useState(0);
  const [lives, setLives]   = useState(3);
  const [level, setLevel]   = useState(1);
  const [shake, setShake]   = useState(false);
  const [flashRed, setFlashRed] = useState(false);
  const [feedback, setFeedback] = useState<'hit' | 'miss' | null>(null);
  const [endStars, setEndStars] = useState(0);

  const idRef           = useRef(1);
  const stateRef        = useRef({
    skeletons: [] as Skeleton[],
    projectile: null as Projectile | null,
    score: 0, lives: 3, level: 1,
    speedBoostUntil: 0,
  });

  // Keep stateRef in sync after mutations done in the loop
  const syncSkeletons   = (next: Skeleton[]) => { stateRef.current.skeletons = next; setSkeletons(next); };
  const syncProjectile  = (next: Projectile | null) => { stateRef.current.projectile = next; setProjectile(next); };

  const spawnSkeletons = (count: number, spreadStartX = SKELETON_SPAWN) => {
    const arr: Skeleton[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        id: idRef.current++,
        x: spreadStartX + i * 6,
        shootCooldown: 1.2 + i * 0.7,
        windup: 0,
        variant: (i % 3) as 0 | 1 | 2,
      });
    }
    return arr;
  };

  const fireFromSkeleton = useCallback((sk: Skeleton, lvl: number) => {
    const d = difficulty(lvl);
    const isLetter = Math.random() < d.letterChance;
    const type: ProjectileType = isLetter ? 'slime' : 'arrow';
    const symbol = isLetter ? rand(LETTERS) : rand(DIGITS);
    const startX = sk.x - 3;
    const baseY = 8;
    const proj: Projectile = {
      id: idRef.current++,
      x: startX,
      y: baseY,
      vx: -d.projectileSpeed,
      type, symbol,
      spin: Math.random() * 360,
      startX,
      baseY,
      arcHeight: 14 + Math.random() * 5,
    };
    setChoices(buildChoices(symbol, type));
    syncProjectile(proj);
  }, []);

  const startGame = useCallback(() => {
    idRef.current = 1;
    const init = spawnSkeletons(1);
    stateRef.current = {
      skeletons: init,
      projectile: null,
      score: 0, lives: 3, level: 1,
      speedBoostUntil: 0,
    };
    setSkeletons(init);
    setProjectile(null);
    setChoices([]);
    setFxList([]);
    setScore(0); setLives(3); setLevel(1);
    setShake(false); setFlashRed(false); setFeedback(null);
    setGs('playing');
  }, []);

  const endGame = useCallback(() => {
    const finalScore = stateRef.current.score;
    // Reuses the shared math-stars channel: every 5 points = 1 star, and only the
    // delta over the previous high score is granted.
    const earned = Math.max(0, Math.floor(finalScore / 5) - Math.floor(progress.mathHighScore / 5));
    updateMathScore(finalScore);
    setEndStars(earned);
    setGs('gameover');
  }, [updateMathScore, progress.mathHighScore]);

  // Add an FX particle, cleanup after lifetime
  const pushFx = (x: number, y: number, kind: FX['kind']) => {
    const fx: FX = { id: idRef.current++, x, y, kind, born: Date.now() };
    setFxList(prev => [...prev, fx]);
    setTimeout(() => setFxList(prev => prev.filter(f => f.id !== fx.id)), 650);
  };

  const onAnswer = useCallback((choice: string) => {
    if (gs !== 'playing') return;
    const proj = stateRef.current.projectile;
    if (!proj) return;
    if (choice === proj.symbol) {
      // correct: destroy projectile, push skeletons back, +1 score
      pushFx(proj.x, proj.y, 'hit');
      stateRef.current.score += 1;
      setScore(stateRef.current.score);
      // bump level every 8 points
      const newLevel = Math.min(8, Math.floor(stateRef.current.score / 8) + 1);
      if (newLevel > stateRef.current.level) {
        stateRef.current.level = newLevel;
        setLevel(newLevel);
        // spawn extra skeleton if needed
        const target = difficulty(newLevel).skeletonCount;
        if (stateRef.current.skeletons.length < target) {
          const extra = spawnSkeletons(target - stateRef.current.skeletons.length, SKELETON_SPAWN);
          syncSkeletons([...stateRef.current.skeletons, ...extra]);
        }
      }
      // push all skeletons back a bit, and cap cooldowns so the next shot
      // arrives within ~1s instead of waiting out the full base interval
      const pushed = stateRef.current.skeletons.map(s => ({
        ...s,
        x: Math.min(SKELETON_SPAWN, s.x + 6),
        shootCooldown: Math.min(s.shootCooldown, 1.0),
      }));
      syncSkeletons(pushed);
      syncProjectile(null);
      setChoices([]);
      setFeedback('hit');
      setTimeout(() => setFeedback(null), 400);
    } else {
      // wrong: temporary speed boost on skeletons, screen shake
      stateRef.current.speedBoostUntil = Date.now() + 1500;
      setShake(true);
      setFeedback('miss');
      setTimeout(() => { setShake(false); setFeedback(null); }, 450);
    }
  }, [gs]);

  // Game loop
  useEffect(() => {
    if (gs !== 'playing') return;
    const id = setInterval(() => {
      const st = stateRef.current;
      const dt = TICK_MS / 1000;
      const d  = difficulty(st.level);
      const speedMul = Date.now() < st.speedBoostUntil ? 2.0 : 1.0;

      // Update skeletons (movement + shoot cooldown)
      let died = false;
      let needShoot: Skeleton | null = null;
      const updated = st.skeletons.map(sk => {
        const next: Skeleton = { ...sk };
        next.x = Math.max(SKELETON_HIT_X - 0.5, sk.x - d.skeletonSpeed * dt * speedMul);
        next.shootCooldown = sk.shootCooldown - dt;
        if (next.windup > 0) next.windup = Math.max(0, sk.windup - dt);
        if (next.x <= SKELETON_HIT_X) {
          died = true;
        }
        return next;
      });

      // Pick a shooter (only if there's no in-flight projectile)
      if (!st.projectile) {
        const ready = updated.filter(s => s.shootCooldown <= 0);
        if (ready.length > 0) {
          const chosen = ready[Math.floor(Math.random() * ready.length)];
          chosen.windup = 0.18;
          chosen.shootCooldown = d.shootInterval * (0.85 + Math.random() * 0.3);
          needShoot = chosen;
        }
      }

      st.skeletons = updated;
      setSkeletons(updated);

      if (needShoot) {
        fireFromSkeleton(needShoot, st.level);
      }

      // Update projectile
      if (st.projectile) {
        const newX = st.projectile.x + st.projectile.vx * dt;
        const span = st.projectile.startX - PROJECTILE_HIT_X;
        const traveled = st.projectile.startX - newX;
        const progress = Math.min(1, Math.max(0, span > 0 ? traveled / span : 1));
        const arcY = st.projectile.baseY + st.projectile.arcHeight * 4 * progress * (1 - progress);
        const np: Projectile = {
          ...st.projectile,
          x: newX,
          y: arcY,
          spin: st.projectile.spin + 240 * dt,
        };
        if (np.x <= PROJECTILE_HIT_X) {
          // Hit player
          pushFx(np.x, np.y, 'miss');
          syncProjectile(null);
          setChoices([]);
          // Speed up next shot so the player doesn't wait the full base interval
          const bumped = st.skeletons.map(s => ({
            ...s,
            shootCooldown: Math.min(s.shootCooldown, 1.0),
          }));
          st.skeletons = bumped;
          setSkeletons(bumped);
          st.lives -= 1;
          setLives(st.lives);
          setShake(true); setFlashRed(true);
          setTimeout(() => { setShake(false); setFlashRed(false); }, 450);
          if (st.lives <= 0) {
            // game over from projectile
            endGame();
            return;
          }
        } else {
          syncProjectile(np);
        }
      }

      if (died) {
        // Skeleton reached player
        pushFx(PLAYER_X + 4, 30, 'miss');
        // Knock skeletons back instead of instant death? Make it lose a life and reset positions
        st.lives -= 1;
        setLives(st.lives);
        setShake(true); setFlashRed(true);
        setTimeout(() => { setShake(false); setFlashRed(false); }, 500);
        const reset = st.skeletons.map((s, i) => ({
          ...s,
          x: SKELETON_SPAWN - i * 6,
          shootCooldown: 1.5 + i * 0.6,
          windup: 0,
        }));
        st.skeletons = reset;
        setSkeletons(reset);
        if (st.lives <= 0) {
          endGame();
        }
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [gs, fireFromSkeleton, endGame]);

  // Physical keyboard support (desktop)
  useEffect(() => {
    if (gs !== 'playing') return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase();
      if (choices.includes(k)) onAnswer(k);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gs, choices, onAnswer]);

  if (gs === 'menu')      return <MenuScreen onStart={startGame} totalStars={progress.totalStars} />;
  if (gs === 'gameover')  return <GameOverScreen score={score} level={level} starsEarned={endStars} onRestart={startGame} onMenu={() => setGs('menu')} />;

  return (
    <div
      className={shake ? 'skshake' : ''}
      style={{
        width: '100vw', height: '100dvh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(to bottom, #02000a 0%, #0a0518 30%, #1a0d2c 65%, #050008 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        userSelect: 'none', position: 'relative',
      }}
    >
      {/* Top header */}
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
        <div style={{ flex: 1, color: '#e0e7ff', fontWeight: 900, fontSize: 16, letterSpacing: 2 }}>
          💀 SKELETTKRYPTAN
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
          position: 'absolute', top: '8%', right: '10%',
          width: 56, height: 56, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #fffbea, #d4d4d8 70%, #71717a)',
          boxShadow: '0 0 25px 8px rgba(220,220,240,0.3), 0 0 65px 22px rgba(180,180,210,0.1)',
          opacity: 0.85,
        }} />

        {/* Crypt arch silhouette */}
        <div style={{
          position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)',
          width: 220, height: 90, opacity: 0.35,
          background: 'radial-gradient(ellipse at center top, rgba(40,30,55,0.9) 0%, transparent 75%)',
          borderRadius: '50% 50% 0 0',
        }} />

        {/* Fog */}
        {FOG_BLOBS.map(f => (
          <div key={f.id} style={{
            position: 'absolute', bottom: 30 + (f.id % 2) * 12,
            left: `${f.left}%`,
            width: f.size, height: f.size * 0.42,
            borderRadius: '50%',
            background: `radial-gradient(ellipse, rgba(180,180,210,${f.opacity}), transparent 65%)`,
            animation: `drift ${22 + f.delay}s linear infinite`,
            animationDelay: `${-f.delay}s`,
            pointerEvents: 'none',
            filter: 'blur(8px)',
          }} />
        ))}

        {/* Torches */}
        {TORCHES.map((t, i) => <Torch key={i} x={t.x} />)}

        {/* HUD: score + level */}
        <div style={{
          position: 'absolute', top: 12, left: 0, right: 0,
          display: 'flex', justifyContent: 'space-between',
          padding: '0 16px', zIndex: 5,
        }}>
          <div style={{
            color: '#fde047', fontWeight: 800, fontSize: 18,
            background: 'rgba(0,0,0,0.4)', padding: '4px 12px', borderRadius: 12,
            border: '1px solid rgba(253,224,71,0.3)',
            textShadow: '0 0 10px rgba(253,224,71,0.5)',
          }}>
            ⭐ {score}
          </div>
          <div style={{
            color: '#c4b5fd', fontWeight: 800, fontSize: 14,
            background: 'rgba(0,0,0,0.4)', padding: '4px 12px', borderRadius: 12,
            border: '1px solid rgba(196,181,253,0.3)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span>NIVÅ {level}</span>
            <span style={{ color: 'rgba(196,181,253,0.5)' }}>·</span>
            <span>{skeletons.length} 💀</span>
          </div>
        </div>

        {/* Graves */}
        {GRAVES.map((g, i) => <Grave key={i} {...g} />)}

        {/* Player (defender — wizard / kid) */}
        <div style={{
          position: 'absolute', bottom: 18, left: `${PLAYER_X}%`,
          transform: 'translateX(-50%)', pointerEvents: 'none',
        }}>
          <div style={{
            fontSize: 40,
            filter: lives === 1 ? 'drop-shadow(0 0 14px rgba(255,80,80,0.8))' : 'drop-shadow(0 0 10px rgba(167,139,250,0.55))',
            transition: 'filter 0.3s',
            animation: 'playerIdle 2s ease-in-out infinite',
          }}>🧙</div>
          {/* Shield aura when feedback hit */}
          {feedback === 'hit' && (
            <div style={{
              position: 'absolute', top: -8, left: '50%',
              transform: 'translateX(-50%)',
              width: 80, height: 80, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(253,224,71,0.55), transparent 65%)',
              animation: 'shieldPop 0.4s ease-out',
              pointerEvents: 'none',
            }} />
          )}
        </div>

        {/* Skeletons */}
        {skeletons.map(s => (
          <SkeletonChar key={s.id} s={s} fire={s.windup > 0} />
        ))}

        {/* Projectile */}
        {projectile && <ProjectileEl p={projectile} />}

        {/* FX */}
        {fxList.map(fx => <FXEl key={fx.id} fx={fx} />)}

        {/* Ground */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 18,
          background: 'linear-gradient(to bottom, #1a0a18 0%, #0a0410 60%, #050008 100%)',
          borderTop: '1px solid rgba(120,80,140,0.25)',
          boxShadow: 'inset 0 1px 0 rgba(180,140,200,0.15)',
        }} />

        {/* Red flash on damage */}
        {flashRed && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 9% 60%, rgba(220,40,40,0.45), transparent 65%)',
            animation: 'redPulse 0.45s ease-out',
          }} />
        )}
      </div>

      {/* Bottom panel: prompt + answer buttons */}
      <div style={{
        flexShrink: 0,
        background: 'linear-gradient(to top, rgba(2,0,10,0.99) 70%, rgba(2,0,10,0.85))',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '12px 16px calc(env(safe-area-inset-bottom) + 16px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        minHeight: 200,
      }}>
        {/* Prompt */}
        <div style={{ minHeight: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
          {projectile ? (
            <>
              <span style={{
                color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: 700,
              }}>
                Tryck på
              </span>
              <span style={{
                background: projectile.type === 'arrow'
                  ? 'linear-gradient(135deg, #fbbf24, #d97706)'
                  : 'linear-gradient(135deg, #84cc16, #4d7c0f)',
                color: projectile.type === 'arrow' ? '#3a1900' : '#1a2e05',
                fontWeight: 900, fontSize: 22, padding: '2px 14px',
                borderRadius: 10, letterSpacing: 1,
                boxShadow: projectile.type === 'arrow'
                  ? '0 0 14px rgba(251,191,36,0.5)'
                  : '0 0 14px rgba(132,204,22,0.5)',
                animation: 'symbolPop 0.3s ease-out',
              }} key={projectile.id}>
                {projectile.symbol}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: 700 }}>
                {projectile.type === 'arrow' ? 'siffra' : 'bokstav'}!
              </span>
            </>
          ) : (
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, fontWeight: 700 }}>
              Skelettet laddar nästa attack...
            </span>
          )}
        </div>

        {/* Choice grid (3 cols × 2 rows) */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8, width: '100%', maxWidth: 380,
        }}>
          {Array.from({ length: 6 }).map((_, i) => {
            const c = choices[i] ?? '';
            const isLetter = c && LETTERS.includes(c);
            const disabled = !c || !projectile;
            return (
              <button
                key={`slot-${i}`}
                onClick={() => c && onAnswer(c)}
                disabled={disabled}
                style={{
                  height: 56, borderRadius: 14, border: 'none',
                  fontSize: 24, fontWeight: 900,
                  cursor: disabled ? 'default' : 'pointer',
                  color: disabled
                    ? 'rgba(255,255,255,0.15)'
                    : isLetter ? '#1a2e05' : '#3a1900',
                  background: disabled
                    ? 'rgba(255,255,255,0.05)'
                    : isLetter
                      ? 'linear-gradient(135deg, #d9f99d, #84cc16)'
                      : 'linear-gradient(135deg, #fde68a, #fbbf24)',
                  boxShadow: disabled
                    ? 'none'
                    : isLetter
                      ? '0 4px 14px rgba(132,204,22,0.45), inset 0 1px 0 rgba(255,255,255,0.4)'
                      : '0 4px 14px rgba(251,191,36,0.45), inset 0 1px 0 rgba(255,255,255,0.4)',
                  transition: 'transform 0.08s, box-shadow 0.2s',
                }}
                onTouchStart={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.94)'; }}
                onTouchEnd={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
                onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.94)'; }}
                onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes walkBone {
          0%,100% { transform: scaleX(-1) translateY(0) rotate(-2deg); }
          50%      { transform: scaleX(-1) translateY(-4px) rotate(2deg); }
        }
        @keyframes shootShake {
          0%,100% { transform: scaleX(-1) translateX(0) rotate(-10deg); }
          50%      { transform: scaleX(-1) translateX(2px) rotate(-6deg); }
        }
        @keyframes flame {
          0%   { transform: scaleY(1) scaleX(1); opacity: 1; }
          100% { transform: scaleY(1.18) scaleX(0.92); opacity: 0.85; }
        }
        @keyframes drift {
          0%   { transform: translateX(0); opacity: 0.0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateX(-110vw); opacity: 0; }
        }
        @keyframes playerIdle {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-3px); }
        }
        @keyframes shieldPop {
          0% { transform: translateX(-50%) scale(0.5); opacity: 0.9; }
          100% { transform: translateX(-50%) scale(1.3); opacity: 0; }
        }
        @keyframes redPulse {
          0% { opacity: 0; }
          40% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes symbolPop {
          0% { transform: scale(0.6); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes skshake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-8px) rotate(-0.4deg); }
          40%     { transform: translateX(8px)  rotate(0.4deg); }
          60%     { transform: translateX(-5px); }
          80%     { transform: translateX(5px); }
        }
        .skshake { animation: skshake 0.45s ease-in-out; }
      `}</style>
    </div>
  );
}
