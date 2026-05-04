'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GameBackground } from '@/components/GameBackground';
import { GAME_THEMES } from '@/lib/gameThemes';
import { Glittra } from '@/components/draken/Glittra';
import { useSpeech } from '@/hooks/useSpeech';
import { hapticNotification } from '@/utils/haptics';
import {
  loadDraken,
  setReward,
  isAllLevelsComplete,
  type DrakenReward,
  type DrakenProgress,
  DEFAULT_DRAKEN,
} from '@/lib/drakenStorage';

const REWARDS: { id: DrakenReward; label: string; emoji: string; desc: string }[] = [
  { id: 'hatt', label: 'Trollhatt', emoji: '🎩', desc: 'En magisk hatt' },
  { id: 'vingar', label: 'Nya vingar', emoji: '🪽', desc: 'Glittrande vingar' },
  { id: 'farg', label: 'Ny färg', emoji: '🌈', desc: 'Regnbågsfärger' },
  { id: 'svans', label: 'Stjärnsvans', emoji: '⭐', desc: 'En stjärna att svänga med' },
];

export default function VinstPage() {
  const { speak } = useSpeech();
  const [progress, setProgress] = useState<DrakenProgress>(DEFAULT_DRAKEN);
  const [chosen, setChosen] = useState<DrakenReward | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const p = loadDraken();
    setProgress(p);
    setChosen(p.reward);
    if (isAllLevelsComplete(p)) {
      const t1 = setTimeout(() => setRevealed(true), 600);
      const t2 = setTimeout(() => {
        speak('Du räddade de magiska öarna! Tack snälla!');
        hapticNotification('success');
      }, 1200);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [speak]);

  const pickReward = (r: DrakenReward) => {
    const updated = setReward(r);
    setChosen(r);
    setProgress(updated);
    speak('Vad fint! Tack!');
    hapticNotification('success');
  };

  const completed = isAllLevelsComplete(progress);

  if (!completed) {
    return (
      <GameBackground theme={GAME_THEMES.draken} className="min-h-screen flex flex-col items-center justify-center p-6">
        <Glittra size={120} />
        <div className="bg-white/90 rounded-3xl p-6 shadow-xl max-w-sm text-center mt-4">
          <p className="text-lg font-black text-purple-800 mb-3">
            Klara alla 6 öar först! 🌟
          </p>
          <p className="text-sm font-bold text-purple-700/70 mb-4">
            Du har räddat {progress.completedLevels.length} av 6 öar.
          </p>
          <Link
            href="/draken"
            className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white font-black active:scale-95 transition-transform"
          >
            Tillbaka till kartan
          </Link>
        </div>
      </GameBackground>
    );
  }

  return (
    <GameBackground theme={GAME_THEMES.draken} className="pb-12">
      <div className="relative min-h-screen flex flex-col items-center px-4 pt-8" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}>
        {/* Floating sparkles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 12 }, (_, i) => (
            <span
              key={i}
              className="absolute text-2xl opacity-80 animate-balloon-float"
              style={{
                top: `${(i * 8 + 5) % 90}%`,
                left: `${(i * 17 + 7) % 95}%`,
                animationDelay: `${i * 0.18}s`,
              }}
            >
              {['✨', '⭐', '🌟', '💫'][i % 4]}
            </span>
          ))}
        </div>

        {/* Title */}
        <div className={`text-center ${revealed ? 'animate-rainbow-sweep' : ''}`}>
          <h1
            className="text-4xl md:text-5xl font-black text-white drop-shadow-lg mb-2"
            style={{
              background: 'linear-gradient(90deg, #f472b6, #facc15, #22d3ee, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.18))',
            }}
          >
            Du räddade de
            <br />
            magiska öarna!
          </h1>
          <p className="text-base font-black text-purple-900/80 mt-2">
            ⭐ {progress.totalStars} stjärnor totalt ⭐
          </p>
        </div>

        {/* Flying dragon */}
        <div className="my-6 relative animate-draken-victory">
          <Glittra size={160} reward={chosen} flying />
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            <span className="text-2xl animate-balloon-float">☁️</span>
          </div>
        </div>

        {/* Medal */}
        <div className="relative my-2">
          <div className="text-7xl animate-medal-glow select-none">🏅</div>
        </div>
        <p className="text-base font-black text-purple-800/90 mb-6">
          Drakhjältens medalj!
        </p>

        {/* Reward picker */}
        <div className="w-full max-w-sm bg-white/90 rounded-3xl p-5 shadow-xl ring-2 ring-purple-200">
          <p className="text-base font-black text-purple-800 text-center mb-1">
            Välj en belöning till Glittra 💜
          </p>
          <p className="text-xs font-bold text-purple-600/70 text-center mb-4">
            (du kan byta när du vill)
          </p>
          <div className="grid grid-cols-2 gap-3">
            {REWARDS.map(r => {
              const selected = chosen === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => pickReward(r.id)}
                  className={`p-3 rounded-2xl text-center active:scale-95 transition-all ring-4 ${
                    selected
                      ? 'bg-gradient-to-br from-fuchsia-400 to-purple-500 text-white ring-amber-200 shadow-lg scale-105'
                      : 'bg-gradient-to-br from-pink-50 to-violet-50 text-purple-800 ring-purple-100'
                  }`}
                >
                  <div className="text-4xl mb-1">{r.emoji}</div>
                  <div className="text-sm font-black">{r.label}</div>
                  <div className={`text-[10px] mt-0.5 ${selected ? 'text-white/85' : 'text-purple-500'}`}>
                    {r.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-6 w-full max-w-sm">
          <Link
            href="/draken/samlarbok"
            className="block w-full py-4 rounded-3xl bg-white/85 text-purple-800 font-black text-base text-center shadow-md ring-2 ring-violet-200 active:scale-95 transition-transform"
          >
            📖 Öppna samlarboken
          </Link>
          <Link
            href="/draken"
            className="block w-full py-4 rounded-3xl bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white font-black text-base text-center shadow-md active:scale-95 transition-transform"
          >
            🗺️ Tillbaka till kartan
          </Link>
        </div>
      </div>
    </GameBackground>
  );
}
