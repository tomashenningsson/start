'use client';

import type { Equipped } from '@/lib/drakenStorage';

interface Props {
  equipped?: Equipped;
  size?: number;
  flying?: boolean;
  className?: string;
}

const BODY_FILTERS: Record<string, string> = {
  'farg-regnbage': 'drop-shadow(0 4px 12px rgba(236,72,153,0.55)) hue-rotate(40deg) saturate(1.6)',
  'farg-guld': 'drop-shadow(0 4px 14px rgba(250,204,21,0.7)) hue-rotate(-50deg) saturate(2)',
  'farg-rosa': 'drop-shadow(0 4px 12px rgba(244,114,182,0.55)) hue-rotate(190deg) saturate(1.4)',
};

const HAT_EMOJI: Record<string, string> = {
  hatt: '🎩',
  krona: '👑',
  blomkrans: '🌸',
  keps: '🧢',
};

const WING_EMOJI: Record<string, string> = {
  vingar: '🪽',
  fjarilsvingar: '🦋',
  eldvingar: '🔥',
};

const ACCESSORY_EMOJI: Record<string, { emoji: string; pos: 'face' | 'chest' | 'tail' }> = {
  glasogon: { emoji: '🕶️', pos: 'face' },
  halsband: { emoji: '💖', pos: 'chest' },
  svans: { emoji: '⭐', pos: 'tail' },
};

export function Glittra({ equipped = {}, size = 96, flying, className = '' }: Props) {
  const bodyFilter = (equipped.body && BODY_FILTERS[equipped.body])
    || 'drop-shadow(0 4px 12px rgba(168,85,247,0.45))';
  const hat = equipped.hat ? HAT_EMOJI[equipped.hat] : null;
  const wing = equipped.wings ? WING_EMOJI[equipped.wings] : null;
  const accessory = equipped.accessory ? ACCESSORY_EMOJI[equipped.accessory] : null;

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
      {wing && (
        <>
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
            {wing}
          </span>
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
            {wing}
          </span>
        </>
      )}

      <span style={{ fontSize: size * 0.95, filter: bodyFilter }}>🐉</span>

      {hat && (
        <span
          className="absolute"
          style={{
            fontSize: size * 0.55,
            top: -size * 0.2,
            left: '50%',
            transform: 'translateX(-50%) rotate(-8deg)',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
          }}
        >
          {hat}
        </span>
      )}

      {accessory?.pos === 'face' && (
        <span
          className="absolute"
          style={{
            fontSize: size * 0.32,
            top: size * 0.32,
            left: '50%',
            transform: 'translateX(-50%)',
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
          }}
        >
          {accessory.emoji}
        </span>
      )}

      {accessory?.pos === 'chest' && (
        <span
          className="absolute"
          style={{
            fontSize: size * 0.36,
            bottom: size * 0.1,
            left: '50%',
            transform: 'translateX(-50%)',
            filter: 'drop-shadow(0 2px 4px rgba(236,72,153,0.55))',
          }}
        >
          {accessory.emoji}
        </span>
      )}

      {accessory?.pos === 'tail' && (
        <span
          className="absolute"
          style={{
            fontSize: size * 0.45,
            bottom: -size * 0.05,
            right: -size * 0.15,
            filter: 'drop-shadow(0 2px 6px rgba(250,204,21,0.6))',
          }}
        >
          {accessory.emoji}
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
