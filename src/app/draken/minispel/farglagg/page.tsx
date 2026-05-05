'use client';

import { useEffect, useState } from 'react';
import { GameBackground } from '@/components/GameBackground';
import { GAME_THEMES } from '@/lib/gameThemes';
import { DrakenHeader } from '@/components/draken/DrakenHeader';
import { useSpeech } from '@/hooks/useSpeech';
import { hapticImpact } from '@/utils/haptics';

interface Palette {
  id: string;
  label: string;
  color: string;
}

const PALETTE: Palette[] = [
  { id: 'red',     label: 'röd',     color: '#ef4444' },
  { id: 'orange',  label: 'orange',  color: '#fb923c' },
  { id: 'yellow',  label: 'gul',     color: '#facc15' },
  { id: 'green',   label: 'grön',    color: '#22c55e' },
  { id: 'cyan',    label: 'turkos',  color: '#22d3ee' },
  { id: 'blue',    label: 'blå',     color: '#3b82f6' },
  { id: 'violet',  label: 'lila',    color: '#a855f7' },
  { id: 'pink',    label: 'rosa',    color: '#ec4899' },
  { id: 'brown',   label: 'brun',    color: '#92400e' },
  { id: 'white',   label: 'vit',     color: '#ffffff' },
];

const ERASER: Palette = { id: 'eraser', label: 'sudd', color: 'transparent' };

interface Region {
  id: string;
  label: string;
  d: string; // SVG path
  defaultFill: string;
  textOffset: { x: number; y: number };
}

const REGIONS: Region[] = [
  // Body main
  {
    id: 'body',
    label: 'kropp',
    d: 'M 100 130 C 60 130 50 170 70 200 C 80 215 90 225 100 240 C 110 225 120 215 130 200 C 150 170 140 130 100 130 Z',
    defaultFill: '#fde68a',
    textOffset: { x: 100, y: 195 },
  },
  // Head
  {
    id: 'head',
    label: 'huvud',
    d: 'M 100 60 C 70 60 55 90 65 115 C 75 130 90 135 100 135 C 110 135 125 130 135 115 C 145 90 130 60 100 60 Z',
    defaultFill: '#fef3c7',
    textOffset: { x: 100, y: 100 },
  },
  // Left wing
  {
    id: 'wing-l',
    label: 'vänster vinge',
    d: 'M 65 145 C 30 130 15 165 30 195 C 50 200 65 180 70 165 Z',
    defaultFill: '#bae6fd',
    textOffset: { x: 45, y: 175 },
  },
  // Right wing
  {
    id: 'wing-r',
    label: 'höger vinge',
    d: 'M 135 145 C 170 130 185 165 170 195 C 150 200 135 180 130 165 Z',
    defaultFill: '#bae6fd',
    textOffset: { x: 155, y: 175 },
  },
  // Tail
  {
    id: 'tail',
    label: 'svans',
    d: 'M 100 240 C 90 260 70 270 60 290 C 80 285 95 275 100 265 Z',
    defaultFill: '#fbcfe8',
    textOffset: { x: 80, y: 275 },
  },
  // Belly
  {
    id: 'belly',
    label: 'mage',
    d: 'M 90 165 C 80 175 80 195 90 210 C 100 215 110 215 110 210 C 120 195 120 175 110 165 Z',
    defaultFill: '#fbcfe8',
    textOffset: { x: 100, y: 190 },
  },
];

export default function ColoringMiniGame() {
  const { speak } = useSpeech();
  const [active, setActive] = useState<Palette>(PALETTE[5]);
  const [colors, setColors] = useState<Record<string, string>>({});
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => speak('Måla draken som du vill!'), 350);
    return () => clearTimeout(t);
  }, [speak]);

  const handleFill = (regionId: string) => {
    hapticImpact('light');
    setColors(prev => {
      if (active.id === 'eraser') {
        const next = { ...prev };
        delete next[regionId];
        return next;
      }
      return { ...prev, [regionId]: active.color };
    });
  };

  const reset = () => {
    setColors({});
    speak('Ny målarbild!');
  };

  const celebrate = () => {
    setConfetti(true);
    speak('Wow så fint målat!');
    setTimeout(() => setConfetti(false), 2800);
  };

  return (
    <GameBackground theme={GAME_THEMES.draken} className="pb-12">
      <DrakenHeader title="Färgläggning" emoji="🎨" backHref="/draken/minispel" />

      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className="bg-white/85 rounded-3xl p-3 shadow-md ring-2 ring-emerald-200 mb-3">
          <p className="text-sm font-black text-purple-800 text-center">
            Tryck på en färg, sen på draken 🎨
          </p>
          <p className="text-xs font-bold text-purple-700/70 text-center mt-0.5">
            Just nu målar du i: <span className="text-emerald-700">{active.label}</span>
          </p>
        </div>

        {/* Canvas */}
        <div className="relative w-full rounded-[36px] bg-gradient-to-b from-emerald-50 via-teal-100 to-cyan-100 ring-4 ring-white/70 shadow-xl p-4 mb-3">
          {confetti && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[36px]">
              {Array.from({ length: 24 }, (_, i) => (
                <span
                  key={i}
                  className="absolute text-2xl animate-confetti-fall"
                  style={{
                    left: `${(i * 4 + 5) % 95}%`,
                    top: '-30px',
                    animationDelay: `${i * 0.06}s`,
                  }}
                >
                  {['🎉', '✨', '⭐', '💖', '🌈'][i % 5]}
                </span>
              ))}
            </div>
          )}
          <svg viewBox="0 0 200 320" className="w-full h-auto">
            {REGIONS.map(r => (
              <g key={r.id}>
                <path
                  d={r.d}
                  fill={colors[r.id] || r.defaultFill}
                  stroke="#1e1b4b"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                  onClick={() => handleFill(r.id)}
                  style={{ cursor: 'pointer' }}
                />
              </g>
            ))}
            {/* Eyes */}
            <circle cx="88" cy="95" r="5" fill="#1e1b4b" />
            <circle cx="112" cy="95" r="5" fill="#1e1b4b" />
            <circle cx="89.5" cy="93" r="1.5" fill="#fff" />
            <circle cx="113.5" cy="93" r="1.5" fill="#fff" />
            {/* Smile */}
            <path d="M 88 110 Q 100 120 112 110" stroke="#1e1b4b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>

        {/* Palette */}
        <div className="grid grid-cols-6 gap-2 mb-3">
          {PALETTE.map(p => (
            <button
              key={p.id}
              onClick={() => {
                setActive(p);
                hapticImpact('light');
                speak(p.label);
              }}
              className={`aspect-square rounded-2xl shadow ring-4 active:scale-95 transition-all ${
                active.id === p.id ? 'ring-amber-300 scale-105' : 'ring-white/80'
              }`}
              style={{ backgroundColor: p.color, borderColor: '#fff' }}
              aria-label={p.label}
            />
          ))}
          <button
            onClick={() => {
              setActive(ERASER);
              speak('Sudd');
            }}
            className={`aspect-square rounded-2xl bg-white shadow ring-4 flex items-center justify-center active:scale-95 transition-all ${
              active.id === 'eraser' ? 'ring-amber-300 scale-105' : 'ring-white/80'
            }`}
            aria-label="Sudd"
          >
            🧽
          </button>
          <button
            onClick={reset}
            className="aspect-square rounded-2xl bg-rose-100 shadow ring-2 ring-rose-200 flex items-center justify-center active:scale-95 transition-all"
            aria-label="Börja om"
          >
            🗑️
          </button>
        </div>

        <button
          onClick={celebrate}
          className="w-full py-3 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black shadow-md active:scale-95 transition-transform"
        >
          ✨ Visa upp ditt mästerverk! ✨
        </button>

        <p className="text-center text-xs font-bold text-purple-900/70 mt-3">
          Måla draken precis som du vill 🎨💜
        </p>
      </div>
    </GameBackground>
  );
}
