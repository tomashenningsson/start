'use client';

import type { ReactNode, CSSProperties } from 'react';

export interface GameOrb {
  color: string;
  position: CSSProperties;
  animation: 'animate-aurora-1' | 'animate-aurora-2' | 'animate-aurora-3';
  size?: string;
  opacity?: number;
}

export interface GameFloat {
  emoji: string;
  position: CSSProperties;
  animation: 'animate-float-1' | 'animate-float-2' | 'animate-float-3';
  size?: string;
}

export interface GameTheme {
  gradient: string;
  orbs: GameOrb[];
  floats?: GameFloat[];
}

interface Props {
  theme: GameTheme;
  children: ReactNode;
  className?: string;
}

export function GameBackground({ theme, children, className = '' }: Props) {
  return (
    <div
      className={`min-h-screen relative overflow-hidden ${className}`}
      style={{ background: theme.gradient }}
    >
      {/* Aurora glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {theme.orbs.map((orb, i) => (
          <div
            key={i}
            className={`absolute rounded-full blur-3xl ${orb.animation}`}
            style={{
              width: orb.size ?? '380px',
              height: orb.size ?? '380px',
              opacity: orb.opacity ?? 0.28,
              background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
              ...orb.position,
            }}
          />
        ))}
      </div>

      {/* Floating emojis */}
      {theme.floats && theme.floats.length > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          {theme.floats.map((f, i) => (
            <span
              key={i}
              className={`absolute ${f.animation} opacity-35`}
              style={{ fontSize: f.size ?? '1.6rem', ...f.position }}
            >
              {f.emoji}
            </span>
          ))}
        </div>
      )}

      {children}
    </div>
  );
}
