'use client';

import type { DrakenReward } from '@/lib/drakenStorage';

interface Props {
  reward?: DrakenReward | null;
  size?: number;
  flying?: boolean;
  className?: string;
}

export function Glittra({ reward, size = 96, flying, className = '' }: Props) {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{
        width: size,
        height: size,
        animation: flying ? 'draken-fly 4s ease-in-out infinite' : 'draken-bob 3s ease-in-out infinite',
      }}
      aria-hidden
    >
      {reward === 'vingar' && (
        <span
          className="absolute"
          style={{
            fontSize: size * 0.7,
            left: -size * 0.35,
            top: size * 0.05,
            transform: 'scaleX(-1) rotate(-10deg)',
            filter: 'drop-shadow(0 2px 4px rgba(168,85,247,0.45))',
          }}
        >
          🪽
        </span>
      )}
      {reward === 'vingar' && (
        <span
          className="absolute"
          style={{
            fontSize: size * 0.7,
            right: -size * 0.35,
            top: size * 0.05,
            transform: 'rotate(10deg)',
            filter: 'drop-shadow(0 2px 4px rgba(168,85,247,0.45))',
          }}
        >
          🪽
        </span>
      )}

      <span
        style={{
          fontSize: size * 0.95,
          filter: reward === 'farg'
            ? 'drop-shadow(0 4px 12px rgba(236,72,153,0.55)) hue-rotate(40deg) saturate(1.6)'
            : 'drop-shadow(0 4px 12px rgba(168,85,247,0.45))',
        }}
      >
        🐉
      </span>

      {reward === 'hatt' && (
        <span
          className="absolute"
          style={{
            fontSize: size * 0.55,
            top: -size * 0.18,
            left: '50%',
            transform: 'translateX(-50%) rotate(-8deg)',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
          }}
        >
          🎩
        </span>
      )}

      {reward === 'svans' && (
        <span
          className="absolute"
          style={{
            fontSize: size * 0.45,
            bottom: -size * 0.05,
            right: -size * 0.15,
            filter: 'drop-shadow(0 2px 6px rgba(250,204,21,0.6))',
          }}
        >
          ⭐
        </span>
      )}

      <style jsx>{`
        @keyframes draken-bob {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-8px) rotate(3deg); }
        }
        @keyframes draken-fly {
          0% { transform: translate(0, 0) rotate(-3deg); }
          25% { transform: translate(8px, -16px) rotate(2deg); }
          50% { transform: translate(0, -24px) rotate(-2deg); }
          75% { transform: translate(-8px, -16px) rotate(3deg); }
          100% { transform: translate(0, 0) rotate(-3deg); }
        }
      `}</style>
    </div>
  );
}
