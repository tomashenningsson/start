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
import { hapticNotification } from '@/utils/haptics';
import {
  loadDraken,
  isLevelUnlocked,
  isAllLevelsComplete,
  canClaimDaily,
  claimDaily,
  nextDailyReward,
  type DrakenProgress,
  type DailyReward,
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
  { level: 1,  name: 'Ballongängen',     emoji: '🎈',  desc: 'Poppa rätt antal!',       color: 'from-pink-300 to-rose-400',     ring: 'ring-pink-200',     position: { top: '2.5%',  left: '30%' } },
  { level: 2,  name: 'Bokstavsskogen',   emoji: '🌳',  desc: 'Hitta bokstaven!',        color: 'from-emerald-300 to-green-500', ring: 'ring-emerald-200',  position: { top: '8.5%',  left: '70%' } },
  { level: 3,  name: 'Räknefloden',      emoji: '🦆',  desc: 'Räkna djuren!',           color: 'from-sky-300 to-cyan-500',      ring: 'ring-sky-200',      position: { top: '14%',   left: '30%' } },
  { level: 4,  name: 'Formgrottan',      emoji: '🔷',  desc: 'Matcha former!',          color: 'from-violet-300 to-purple-500', ring: 'ring-violet-200',   position: { top: '20%',   left: '70%' } },
  { level: 5,  name: 'Bokstavsberget',   emoji: '🏔️', desc: 'Första bokstaven!',       color: 'from-amber-300 to-orange-500',  ring: 'ring-amber-200',    position: { top: '25.5%', left: '30%' } },
  { level: 6,  name: 'Drakslottet',      emoji: '🏰',  desc: 'Mixad utmaning!',         color: 'from-fuchsia-400 to-purple-600',ring: 'ring-fuchsia-200',  position: { top: '31%',   left: '70%' } },
  { level: 7,  name: 'Färgön',           emoji: '🎨',  desc: 'Lär dig färger!',         color: 'from-yellow-300 to-orange-400', ring: 'ring-yellow-200',   position: { top: '37%',   left: '30%' } },
  { level: 8,  name: 'Mönstergården',    emoji: '🌻',  desc: 'Vad kommer härnäst?',     color: 'from-lime-300 to-green-500',    ring: 'ring-lime-200',     position: { top: '42.5%', left: '70%' } },
  { level: 9,  name: 'Stora-Lilla',      emoji: '🐚',  desc: 'Störst eller minst?',     color: 'from-cyan-300 to-blue-500',     ring: 'ring-cyan-200',     position: { top: '48%',   left: '30%' } },
  { level: 10, name: 'Memoryskogen',     emoji: '🃏',  desc: 'Hitta paren!',            color: 'from-purple-300 to-indigo-500', ring: 'ring-purple-200',   position: { top: '54%',   left: '70%' } },
  { level: 11, name: 'Plus-Plutten',     emoji: '➕',  desc: 'Räkna ihop!',             color: 'from-rose-300 to-pink-500',     ring: 'ring-rose-200',     position: { top: '59.5%', left: '30%' } },
  { level: 12, name: 'Motsatsbron',      emoji: '⚖️', desc: 'Hitta motsatsen!',        color: 'from-fuchsia-300 to-rose-600',  ring: 'ring-fuchsia-200',  position: { top: '65%',   left: '70%' } },
  { level: 13, name: 'Tidsstranden',     emoji: '🌅',  desc: 'Dag eller natt?',         color: 'from-orange-300 to-indigo-500', ring: 'ring-orange-200',   position: { top: '70.5%', left: '30%' } },
  { level: 14, name: 'Musikdjungeln',    emoji: '🎵',  desc: 'Härma rytmen!',           color: 'from-teal-300 to-emerald-500',  ring: 'ring-teal-200',     position: { top: '76%',   left: '70%' } },
  { level: 15, name: 'Mat- & Hälsobyn',  emoji: '🥗',  desc: 'Sortera maten!',          color: 'from-lime-300 to-emerald-500',  ring: 'ring-lime-200',     position: { top: '81.5%', left: '30%' } },
  { level: 16, name: 'Fordonsstaden',    emoji: '🚗',  desc: 'Vart kör fordonet?',      color: 'from-blue-300 to-indigo-500',   ring: 'ring-blue-200',     position: { top: '87%',   left: '70%' } },
  { level: 17, name: 'Mönsterpalatset',  emoji: '💠',  desc: 'Klura ut mönstret!',      color: 'from-pink-300 to-purple-500',   ring: 'ring-pink-200',     position: { top: '92.5%', left: '30%' } },
  { level: 18, name: 'Stjärnhimlen',     emoji: '🌌',  desc: 'Räkna stjärnorna!',       color: 'from-indigo-400 to-violet-700',  ring: 'ring-indigo-200',  position: { top: '97.5%', left: '70%' } },
];

export default function DrakenMapPage() {
  const [progress, setProgress] = useState<DrakenProgress>(DEFAULT_DRAKEN);
  const [mounted, setMounted] = useState(false);
  const [showDaily, setShowDaily] = useState(false);
  const [dailyAwarded, setDailyAwarded] = useState<DailyReward | null>(null);
  const { muted, toggleMute } = useSound();
  const { speak } = useSpeech();

  useEffect(() => {
    const p = loadDraken();
    setProgress(p);
    setMounted(true);
    if (canClaimDaily(p)) {
      setShowDaily(true);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => {
      const name = progress.dragonName || 'Glittra';
      const greeting = progress.playerName
        ? `Hej ${progress.playerName}! Jag heter ${name}. Hjälp mig rädda öarna!`
        : `Hej! Jag heter ${name}. Hjälp mig rädda de magiska öarna!`;
      speak(greeting);
    }, 400);
    return () => clearTimeout(t);
  }, [mounted, speak, progress.playerName, progress.dragonName]);

  const allDone = isAllLevelsComplete(progress);
  const pendingDaily = mounted ? nextDailyReward(progress) : null;

  const handleClaimDaily = () => {
    const result = claimDaily(progress);
    if (result.reward) {
      setProgress(result.progress);
      setDailyAwarded(result.reward);
      hapticNotification('success');
      speak(`Daglig belöning! Du fick ${result.reward.stars} stjärnor!`);
    }
  };

  const closeDaily = () => {
    setShowDaily(false);
    setDailyAwarded(null);
  };

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
          <Glittra size={110} equipped={progress.equipped} rainbow={progress.isMagimastare} />
        </div>
        {progress.isMagimastare && (
          <div className="inline-block bg-gradient-to-r from-amber-300 via-pink-400 to-violet-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-md mb-1 animate-medal-glow">
            🏆 Magimästare
          </div>
        )}
        <p className="text-base font-black text-purple-900/90 drop-shadow-sm max-w-xs mx-auto">
          {progress.playerName
            ? `Hej ${progress.playerName}! Jag är ${progress.dragonName} 💜`
            : `Hej! Jag är ${progress.dragonName} 💜`}
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

        {/* Mini-games + customization row */}
        <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
          <Link
            href="/draken/minispel"
            className="inline-flex items-center gap-2 bg-white/80 backdrop-blur rounded-full px-4 py-2 shadow-sm ring-2 ring-teal-200 active:scale-95 transition-transform"
          >
            <span className="text-xl">🎮</span>
            <span className="text-sm font-black text-teal-700">Minispel</span>
          </Link>
          <Link
            href="/draken/profil"
            className="inline-flex items-center gap-2 bg-white/80 backdrop-blur rounded-full px-4 py-2 shadow-sm ring-2 ring-sky-200 active:scale-95 transition-transform"
          >
            <span className="text-xl">🪪</span>
            <span className="text-sm font-black text-sky-700">Min profil</span>
          </Link>
        </div>

        {/* Daily reward badge */}
        {mounted && canClaimDaily(progress) && pendingDaily && (
          <button
            onClick={() => setShowDaily(true)}
            className="mt-3 inline-flex items-center gap-2 bg-gradient-to-r from-amber-300 to-pink-400 text-white rounded-full px-5 py-2.5 shadow-md font-black text-sm active:scale-95 transition-transform animate-soft-pulse"
          >
            🎁 Daglig belöning väntar!
          </button>
        )}

        {/* Progress bar */}
        <div className="mt-3 max-w-xs mx-auto">
          <div className="h-3 rounded-full bg-white/60 overflow-hidden ring-2 ring-white/70 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-fuchsia-500 via-amber-400 to-emerald-400 transition-all"
              style={{ width: `${(progress.completedLevels.length / TOTAL_LEVELS) * 100}%` }}
            />
          </div>
          <div className="text-[11px] font-bold text-purple-800/70 mt-1">
            {progress.completedLevels.length}/{TOTAL_LEVELS} öar räddade
          </div>
        </div>

        {allDone && (
          <Link
            href="/draken/vinst"
            className="mt-3 inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-pink-500 text-white rounded-full px-5 py-2.5 shadow-md font-black text-sm active:scale-95 transition-transform animate-medal-glow"
          >
            🏆 Se Magimästar-scenen
          </Link>
        )}
      </div>

      {/* Island map */}
      <div className="relative mx-auto mt-4 w-full max-w-md px-2">
        <div
          className="relative w-full"
          style={{
            paddingBottom: '480%',
          }}
        >
          {/* Decorative clouds */}
          <span className="absolute text-4xl opacity-80 select-none animate-float-2" style={{ top: '3%',  right: '5%' }}>☁️</span>
          <span className="absolute text-3xl opacity-70 select-none animate-float-1" style={{ top: '12%', left: '5%' }}>☁️</span>
          <span className="absolute text-3xl opacity-60 select-none animate-float-3" style={{ top: '24%', right: '3%' }}>☁️</span>
          <span className="absolute text-2xl opacity-70 select-none animate-float-2" style={{ top: '36%', left: '8%' }}>☁️</span>
          <span className="absolute text-3xl opacity-70 select-none animate-float-1" style={{ top: '48%', right: '6%' }}>☁️</span>
          <span className="absolute text-2xl opacity-60 select-none animate-float-3" style={{ top: '60%', left: '6%' }}>☁️</span>
          <span className="absolute text-3xl opacity-70 select-none animate-float-2" style={{ top: '72%', right: '5%' }}>☁️</span>
          <span className="absolute text-2xl opacity-60 select-none animate-float-1" style={{ top: '84%', left: '6%' }}>☁️</span>
          <span className="absolute text-2xl opacity-70 select-none animate-float-3" style={{ top: '95%', right: '8%' }}>✨</span>

          {/* Connecting dotted path */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 480"
            preserveAspectRatio="none"
          >
            <path
              d="M 30,12 Q 50,18 70,40 Q 78,52 30,68 Q 22,82 70,98 Q 78,116 30,123 Q 22,138 70,153 Q 78,170 30,184 Q 22,198 70,214 Q 78,230 30,246 Q 22,262 70,278 Q 78,294 30,309 Q 22,325 70,340 Q 78,356 30,372 Q 22,388 70,403 Q 78,418 30,434 Q 22,450 70,465"
              stroke="#fff"
              strokeWidth="0.6"
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

      {/* Daily reward modal */}
      {showDaily && pendingDaily && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: 'radial-gradient(circle at 50% 35%, rgba(168,85,247,0.55), rgba(15,3,40,0.85))',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="relative w-full max-w-sm rounded-[36px] p-7 text-center shadow-2xl bg-gradient-to-br from-amber-100 via-pink-100 to-violet-100 ring-4 ring-white/70">
            <div className="text-6xl mb-2">{dailyAwarded ? dailyAwarded.emoji : '🎁'}</div>
            <h2 className="text-2xl font-black text-purple-800 mb-1">
              {dailyAwarded ? 'Du fick en belöning!' : 'Daglig belöning'}
            </h2>
            <p className="text-sm font-bold text-purple-700/80 mb-1">
              {dailyAwarded
                ? `${dailyAwarded.label} · +${dailyAwarded.stars} ⭐`
                : `Dag ${pendingDaily.day} · ${pendingDaily.label}`}
            </p>
            <p className="text-xs font-bold text-purple-600/70 mb-4">
              {dailyAwarded
                ? `Streak: ${progress.dailyStreak} dag${progress.dailyStreak === 1 ? '' : 'ar'}!`
                : 'Kom tillbaka varje dag för fler belöningar!'}
            </p>
            {!dailyAwarded ? (
              <button
                onClick={handleClaimDaily}
                className="w-full py-4 rounded-3xl bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white font-black text-lg shadow-md active:scale-95 transition-transform"
              >
                Hämta {pendingDaily.stars} ⭐
              </button>
            ) : (
              <button
                onClick={closeDaily}
                className="w-full py-4 rounded-3xl bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white font-black text-lg shadow-md active:scale-95 transition-transform"
              >
                Tack! ✨
              </button>
            )}
            <button
              onClick={closeDaily}
              className="block w-full py-2 mt-2 rounded-full text-purple-700 font-bold text-sm active:scale-95 transition-transform"
            >
              Stäng
            </button>
          </div>
        </div>
      )}
    </GameBackground>
  );
}
