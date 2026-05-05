'use client';

import { useEffect, useState } from 'react';
import { GameBackground } from '@/components/GameBackground';
import { GAME_THEMES } from '@/lib/gameThemes';
import { DrakenHeader } from '@/components/draken/DrakenHeader';
import { useSpeech } from '@/hooks/useSpeech';
import { hapticImpact } from '@/utils/haptics';
import { recordMiniGameScore, loadDraken } from '@/lib/drakenStorage';

const BALLOON_COLORS = [
  'from-pink-300 to-rose-500',
  'from-sky-300 to-blue-500',
  'from-amber-200 to-yellow-500',
  'from-emerald-300 to-green-500',
  'from-violet-300 to-purple-500',
  'from-rose-300 to-red-500',
];

const NUMBER_WORDS = ['noll', 'en', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio'];
const GAME_SECONDS = 30;

interface Balloon {
  id: number;
  color: string;
  x: number;
  y: number;
  size: number;
  popped: boolean;
  number: number;
}

let nextId = 1;

function spawnBalloon(): Balloon {
  return {
    id: nextId++,
    color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
    x: 8 + Math.random() * 80,
    y: 100 + Math.random() * 5,
    size: 56 + Math.random() * 24,
    popped: false,
    number: 1 + Math.floor(Math.random() * 10),
  };
}

export default function BalloonMiniGame() {
  const { speak } = useSpeech();
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(GAME_SECONDS);
  const [running, setRunning] = useState(false);
  const [best, setBest] = useState(0);

  useEffect(() => {
    setBest(loadDraken().miniGameScores['ballonger'] ?? 0);
  }, []);

  useEffect(() => {
    if (!running) return;
    const spawn = setInterval(() => {
      setBalloons(prev => [...prev, spawnBalloon()].slice(-25));
    }, 700);
    return () => clearInterval(spawn);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    const rise = setInterval(() => {
      setBalloons(prev =>
        prev
          .map(b => ({ ...b, y: b.y - 1.6 }))
          .filter(b => b.y > -20 && !b.popped),
      );
    }, 60);
    return () => clearInterval(rise);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    if (time <= 0) {
      setRunning(false);
      const updated = recordMiniGameScore('ballonger', score);
      setBest(updated.miniGameScores['ballonger'] ?? score);
      speak(`Tiden är slut! Du fick ${score} poäng!`);
      return;
    }
    const t = setTimeout(() => setTime(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, time, score, speak]);

  const start = () => {
    setBalloons([]);
    setScore(0);
    setTime(GAME_SECONDS);
    setRunning(true);
    speak('Pop så många ballonger du hinner!');
  };

  const popBalloon = (id: number) => {
    if (!running) return;
    setBalloons(prev =>
      prev.map(b => {
        if (b.id !== id || b.popped) return b;
        hapticImpact('light');
        const word = NUMBER_WORDS[b.number] || String(b.number);
        speak(word);
        setScore(s => s + b.number);
        return { ...b, popped: true };
      }),
    );
    setTimeout(() => {
      setBalloons(prev => prev.filter(b => b.id !== id));
    }, 350);
  };

  return (
    <GameBackground theme={GAME_THEMES.draken} className="pb-12">
      <DrakenHeader title="Ballongpoppning" emoji="🎈" backHref="/draken/minispel" />

      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className="flex items-center justify-between gap-2 mb-3 bg-white/80 rounded-2xl px-4 py-2 shadow-sm ring-2 ring-pink-200">
          <div className="text-base font-black text-purple-800">⏱️ {time}s</div>
          <div className="text-base font-black text-amber-600">⭐ {score}</div>
          <div className="text-xs font-bold text-purple-600/70">Bäst: {best}</div>
        </div>

        <div
          className="relative w-full rounded-[36px] bg-gradient-to-b from-sky-200/80 via-cyan-100/70 to-emerald-200/80 ring-4 ring-white/60 shadow-xl overflow-hidden"
          style={{ height: 480 }}
        >
          {/* Grass */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-green-500 to-transparent opacity-70" />

          {!running && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-sm">
              <div className="text-6xl mb-3">🎈</div>
              <p className="text-lg font-black text-purple-800 mb-1">Hinn poppa så många du kan!</p>
              <p className="text-xs font-bold text-purple-700/80 mb-4">
                Varje ballong ger lika många poäng som siffran på den
              </p>
              <button
                onClick={start}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white font-black shadow-md active:scale-95 transition-transform"
              >
                {time === 0 ? 'Spela igen' : 'Starta!'}
              </button>
            </div>
          )}

          {balloons.map(b => (
            <button
              key={b.id}
              onClick={() => popBalloon(b.id)}
              disabled={b.popped || !running}
              className={`absolute select-none active:scale-90 transition-transform ${
                b.popped ? 'animate-balloon-pop pointer-events-none' : ''
              }`}
              style={{
                left: `${b.x}%`,
                top: `${b.y}%`,
                width: b.size,
                height: b.size * 1.2,
              }}
              aria-label={`Ballong ${b.number}`}
            >
              <div
                className={`relative w-full h-full rounded-[50%/55%] bg-gradient-to-br ${b.color} shadow-lg flex items-center justify-center`}
                style={{
                  boxShadow: '0 10px 18px -6px rgba(168,85,247,0.45), 0 0 0 2px rgba(255,255,255,0.5) inset',
                }}
              >
                <span className="text-2xl font-black text-white drop-shadow">{b.number}</span>
                <div className="absolute top-2 left-3 w-3 h-4 bg-white/60 rounded-full blur-sm" />
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-xs font-bold text-purple-900/70 mt-3">
          Hinn poppa så många siffer-ballonger du kan! 🎈
        </p>
      </div>
    </GameBackground>
  );
}
