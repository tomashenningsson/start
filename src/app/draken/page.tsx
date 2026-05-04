'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { GameBackground } from '@/components/GameBackground';
import { GAME_THEMES } from '@/lib/gameThemes';
import { Glittra } from '@/components/draken/Glittra';
import { StarRow } from '@/components/draken/StarRow';
import { useSound } from '@/contexts/SoundContext';
import { useSpeech } from '@/hooks/useSpeech';
import {
  loadDraken,
  isLevelUnlocked,
  isAllLevelsComplete,
  type DrakenProgress,
  DEFAULT_DRAKEN,
  TOTAL_LEVELS,
} from '@/lib/drakenStorage';

interface Island {
  level: number;
  name: string;
  emoji: string;
  desc: string;
  color: string;
  ring: string;
  position: { top: string; left: string };
}

const ISLANDS: Island[] = [
  { level: 1, name: 'Ballongängen', emoji: '🎈', desc: 'Poppa rätt antal!', color: 'from-pink-300 to-rose-400', ring: 'ring-pink-200', position: { top: '4%', left: '30%' } },
  { level: 2, name: 'Bokstavsskogen', emoji: '🌳', desc: 'Hitta bokstaven!', color: 'from-emerald-300 to-green-500', ring: 'ring-emerald-200', position: { top: '12%', left: '70%' } },
  { level: 3, name: 'Räknefloden', emoji: '🦆', desc: 'Räkna djuren!', color: 'from-sky-300 to-cyan-500', ring: 'ring-sky-200', position: { top: '20%', left: '30%' } },
  { level: 4, name: 'Formgrottan', emoji: '🔷', desc: 'Matcha former!', color: 'from-violet-300 to-purple-500', ring: 'ring-violet-200', position: { top: '28%', left: '70%' } },
  { level: 5, name: 'Bokstavsberget', emoji: '🏔️', desc: 'Första bokstaven!', color: 'from-amber-300 to-orange-500', ring: 'ring-amber-200', position: { top: '36%', left: '30%' } },
  { level: 6, name: 'Drakslottet', emoji: '🏰', desc: 'Mixad utmaning!', color: 'from-fuchsia-400 to-purple-600', ring: 'ring-fuchsia-200', position: { top: '44%', left: '70%' } },
  { level: 7, name: 'Färgön', emoji: '🎨', desc: 'Lär dig färger!', color: 'from-yellow-300 to-orange-400', ring: 'ring-yellow-200', position: { top: '52%', left: '30%' } },
  { level: 8, name: 'Mönstergården', emoji: '🌻', desc: 'Vad kommer härnäst?', color: 'from-lime-300 to-green-500', ring: 'ring-lime-200', position: { top: '60%', left: '70%' } },
  { level: 9, name: 'Stora-Lilla', emoji: '🐚', desc: 'Störst eller minst?', color: 'from-cyan-300 to-blue-500', ring: 'ring-cyan-200', position: { top: '68%', left: '30%' } },
  { level: 10, name: 'Memoryskogen', emoji: '🃏', desc: 'Hitta paren!', color: 'from-purple-300 to-indigo-500', ring: 'ring-purple-200', position: { top: '76%', left: '70%' } },
  { level: 11, name: 'Plus-Plutten', emoji: '➕', desc: 'Räkna ihop!', color: 'from-rose-300 to-pink-500', ring: 'ring-rose-200', position: { top: '84%', left: '30%' } },
  { level: 12, name: 'Motsatsbron', emoji: '⚖️', desc: 'Hitta motsatsen!', color: 'from-fuchsia-300 to-rose-600', ring: 'ring-fuchsia-200', position: { top: '92%', left: '70%' } },
];

export default function DrakenMapPage() {
  const [progress, setProgress] = useState<DrakenProgress>(DEFAULT_DRAKEN);
  const [mounted, setMounted] = useState(false);
  const { muted, toggleMute } = useSound();
  const { speak } = useSpeech();

  useEffect(() => {
    setProgress(loadDraken());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(
      () => speak('Hej! Jag heter Glittra. Hjälp mig rädda de magiska öarna!'),
      400
    );
    return () => clearTimeout(t);
  }, [mounted, speak]);

  const allDone = isAllLevelsComplete(progress);

  return (
    <GameBackground theme={GAME_THEMES.draken} className="pb-20">
      {/* Top bar */}
      <header
        className="sticky top-0 z-40 flex items-center gap-3 px-4 pb-3 bg-white/30 backdrop-blur-md border-b border-white/40"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <Link
          href="/"
          className="flex items-center justify-center w-12 h-12 rounded-full bg-white/80 active:scale-90 transition-all shadow-sm ring-2 ring-purple-200"
        >
          <ChevronLeft className="w-7 h-7 text-purple-600" />
        </Link>
        <h1 className="flex-1 text-xl font-black text-purple-800 drop-shadow-sm">
          🐉 Sifferdrakens Magiska Öar
        </h1>
        <button
          onClick={toggleMute}
          className="flex items-center justify-center w-11 h-11 rounded-full bg-white/80 active:scale-90 transition-all text-xl shadow-sm ring-2 ring-purple-200"
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </header>

      {/* Hero */}
      <div className="relative px-4 pt-4 pb-2 text-center">
        <div className="flex justify-center mb-2">
          <Glittra size={110} equipped={progress.equipped} />
        </div>
        <p className="text-base font-black text-purple-900/90 drop-shadow-sm max-w-xs mx-auto">
          Hej! Jag är Glittra 💜
        </p>
        <p className="text-sm font-bold text-purple-800/80 max-w-xs mx-auto mt-1">
          Hjälp mig rädda öarna och samla stjärnor!
        </p>

        {/* Stars + progress */}
        <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur rounded-full px-4 py-2 shadow-sm ring-2 ring-amber-200">
            <span className="text-xl">⭐</span>
            <span className="text-lg font-black text-amber-600">{progress.totalStars}</span>
            <span className="text-xs font-bold text-purple-700/70">stjärnor</span>
          </div>
          <Link
            href="/draken/samlarbok"
            className="inline-flex items-center gap-2 bg-white/80 backdrop-blur rounded-full px-4 py-2 shadow-sm ring-2 ring-violet-200 active:scale-95 transition-transform"
          >
            <span className="text-xl">📖</span>
            <span className="text-sm font-black text-violet-700">Samlarbok</span>
          </Link>
          {progress.unlockedRewards.length > 0 && (
            <Link
              href="/draken/vinst"
              className="inline-flex items-center gap-2 bg-white/80 backdrop-blur rounded-full px-4 py-2 shadow-sm ring-2 ring-pink-200 active:scale-95 transition-transform"
            >
              <span className="text-xl">👕</span>
              <span className="text-sm font-black text-pink-700">Garderob</span>
            </Link>
          )}
        </div>

        {allDone && (
          <Link
            href="/draken/vinst"
            className="mt-3 inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-pink-500 text-white rounded-full px-5 py-2.5 shadow-md font-black text-sm active:scale-95 transition-transform animate-medal-glow"
          >
            🏆 Se vinstscenen
          </Link>
        )}
      </div>

      {/* Island map */}
      <div className="relative mx-auto mt-4 w-full max-w-md px-2">
        <div
          className="relative w-full"
          style={{
            paddingBottom: '320%',
          }}
        >
          {/* Decorative clouds */}
          <span className="absolute text-4xl opacity-80 select-none animate-float-2" style={{ top: '3%', right: '5%' }}>☁️</span>
          <span className="absolute text-3xl opacity-70 select-none animate-float-1" style={{ top: '17%', left: '5%' }}>☁️</span>
          <span className="absolute text-3xl opacity-60 select-none animate-float-3" style={{ top: '34%', right: '3%' }}>☁️</span>
          <span className="absolute text-2xl opacity-70 select-none animate-float-2" style={{ top: '50%', left: '8%' }}>☁️</span>
          <span className="absolute text-3xl opacity-70 select-none animate-float-1" style={{ top: '66%', right: '6%' }}>☁️</span>
          <span className="absolute text-2xl opacity-60 select-none animate-float-3" style={{ top: '82%', left: '6%' }}>☁️</span>

          {/* Connecting dotted path that zig-zags through all 12 islands */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 320"
            preserveAspectRatio="none"
          >
            <path
              d="M 30,13 Q 50,17 70,38 Q 78,52 30,64 Q 22,76 70,90 Q 78,108 30,115 Q 22,128 70,141 Q 78,156 30,166 Q 22,180 70,192 Q 78,210 30,218 Q 22,232 70,243 Q 78,260 30,269 Q 22,284 70,294"
              stroke="#fff"
              strokeWidth="0.8"
              strokeDasharray="2,2"
              fill="none"
              opacity="0.65"
            />
          </svg>

          {ISLANDS.map(island => {
            const unlocked = isLevelUnlocked(island.level, progress);
            const stars = progress.stars[island.level] ?? 0;
            const completed = progress.completedLevels.includes(island.level);

            return (
              <div
                key={island.level}
                className="absolute"
                style={{ top: island.position.top, left: island.position.left, transform: 'translate(-50%, -50%)' }}
              >
                {unlocked ? (
                  <Link
                    href={`/draken/niva${island.level}`}
                    className={`relative flex flex-col items-center justify-center w-28 h-28 rounded-[40%_60%_55%_45%/55%_45%_60%_40%] bg-gradient-to-br ${island.color} shadow-xl ring-4 ${island.ring} active:scale-95 transition-transform`}
                    style={{
                      boxShadow: `0 12px 32px -8px rgba(168,85,247,0.45), 0 1px 0 rgba(255,255,255,0.4) inset`,
                    }}
                  >
                    <div className="absolute -top-3 -left-2 bg-white text-purple-700 font-black text-sm w-9 h-9 rounded-full flex items-center justify-center shadow-md ring-2 ring-purple-200">
                      {island.level}
                    </div>
                    {completed && (
                      <div className="absolute -top-3 -right-2 bg-amber-300 text-white font-black text-base w-9 h-9 rounded-full flex items-center justify-center shadow-md ring-2 ring-amber-100">
                        ✓
                      </div>
                    )}
                    <div className="text-5xl mb-1 select-none drop-shadow">{island.emoji}</div>
                    <div className="text-xs font-black text-white text-center px-2 drop-shadow">
                      {island.name}
                    </div>
                    {completed && (
                      <div className="mt-1">
                        <StarRow count={stars} size="sm" />
                      </div>
                    )}
                  </Link>
                ) : (
                  <div
                    className="relative flex flex-col items-center justify-center w-28 h-28 rounded-[40%_60%_55%_45%/55%_45%_60%_40%] bg-gradient-to-br from-gray-300 to-gray-500 shadow-md opacity-70"
                  >
                    <div className="absolute -top-3 -left-2 bg-white text-gray-500 font-black text-sm w-9 h-9 rounded-full flex items-center justify-center shadow-md ring-2 ring-gray-200">
                      {island.level}
                    </div>
                    <div className="text-5xl mb-1 select-none opacity-60">🔒</div>
                    <div className="text-xs font-black text-white/90 text-center px-2">
                      {island.name}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Helper text */}
      <p className="text-center text-xs font-bold text-purple-900/60 mt-4 px-6">
        Tryck på en ö för att börja äventyret 💫
      </p>
    </GameBackground>
  );
}
