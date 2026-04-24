'use client';

import { useEffect, useState } from 'react';

const COLORS = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#A78BFA', '#6BCB77', '#FF85A1', '#FF9F1C'];

interface Particle {
  id: number;
  color: string;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  size: number;
  delay: number;
}

function makeBurst(cx: number, cy: number, count: number, offset: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 70 + Math.random() * 110;
    return {
      id: offset + i,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      startX: cx,
      startY: cy,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist + 30,
      size: 8 + Math.random() * 8,
      delay: Math.random() * 120,
    };
  });
}

interface Props {
  active: boolean;
  onComplete?: () => void;
}

export function Celebration({ active, onComplete }: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [exploded, setExploded] = useState(false);

  useEffect(() => {
    if (!active) {
      // Clear immediately when deactivated (e.g. next word)
      setParticles([]);
      setExploded(false);
      return;
    }

    const all = [
      ...makeBurst(50, 32, 18, 0),
      ...makeBurst(20, 55, 12, 18),
      ...makeBurst(80, 55, 12, 30),
    ];
    setParticles(all);
    setExploded(false);

    const t1 = setTimeout(() => setExploded(true), 40);
    const t2 = setTimeout(() => {
      setParticles([]);
      setExploded(false);
      onComplete?.();
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active, onComplete]);

  if (!particles.length) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.startX}%`,
            top: `${p.startY}%`,
            width: p.size,
            height: p.size,
            marginLeft: -(p.size / 2),
            marginTop: -(p.size / 2),
            backgroundColor: p.color,
            transitionProperty: exploded ? 'transform, opacity' : 'none',
            transitionDuration: exploded ? `${700 + Math.random() * 500}ms` : '0ms',
            transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            transitionDelay: `${p.delay}ms`,
            transform: exploded
              ? `translate(${p.dx}px, ${p.dy}px) scale(0.2)`
              : 'translate(0, 0) scale(1)',
            opacity: exploded ? 0 : 1,
          }}
        />
      ))}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ animation: 'successPop 0.5s ease-out' }}
      >
        <div className="text-5xl md:text-7xl font-black text-center select-none">
          🎉 Bra jobbat! 🎉
        </div>
      </div>
    </div>
  );
}
