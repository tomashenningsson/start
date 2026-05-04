'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GameBackground } from '@/components/GameBackground';
import { GAME_THEMES } from '@/lib/gameThemes';
import { Glittra } from '@/components/draken/Glittra';
import { useSpeech } from '@/hooks/useSpeech';
import { hapticImpact, hapticNotification } from '@/utils/haptics';
import {
  loadDraken,
  saveDraken,
  syncRewards,
  toggleEquip,
  isAllLevelsComplete,
  REWARDS_CATALOG,
  REWARD_BY_ID,
  type RewardCategory,
  type DrakenProgress,
  DEFAULT_DRAKEN,
} from '@/lib/drakenStorage';

const CATEGORY_LABELS: Record<RewardCategory, { label: string; emoji: string }> = {
  hat: { label: 'Hattar', emoji: '🎩' },
  wings: { label: 'Vingar', emoji: '🪽' },
  body: { label: 'Färger', emoji: '🌈' },
  accessory: { label: 'Smycken', emoji: '⭐' },
};

const CATEGORY_ORDER: RewardCategory[] = ['hat', 'wings', 'body', 'accessory'];

export default function VinstPage() {
  const { speak } = useSpeech();
  const [progress, setProgress] = useState<DrakenProgress>(DEFAULT_DRAKEN);
  const [revealed, setRevealed] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);

  useEffect(() => {
    const initial = loadDraken();
    if (!isAllLevelsComplete(initial)) {
      setProgress(initial);
      return;
    }
    const before = new Set(initial.unlockedRewards);
    const synced = syncRewards(initial);
    saveDraken(synced);
    setProgress(synced);
    setNewlyUnlocked(synced.unlockedRewards.filter(id => !before.has(id)));

    const t1 = setTimeout(() => setRevealed(true), 600);
    const t2 = setTimeout(() => {
      speak('Du räddade de magiska öarna! Tack snälla!');
      hapticNotification('success');
    }, 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [speak]);

  const completed = isAllLevelsComplete(progress);

  const handleToggle = (id: string) => {
    const updated = toggleEquip(id);
    setProgress(updated);
    hapticImpact('light');
    const def = REWARD_BY_ID[id];
    if (def && updated.equipped[def.cat] === id) {
      speak('Vad fint!');
    }
  };

  if (!completed) {
    return (
      <GameBackground theme={GAME_THEMES.draken} className="min-h-screen flex flex-col items-center justify-center p-6">
        <Glittra size={120} equipped={progress.equipped} />
        <div className="bg-white/90 rounded-3xl p-6 shadow-xl max-w-sm text-center mt-4">
          <p className="text-lg font-black text-purple-800 mb-3">Klara alla 6 öar först! 🌟</p>
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
      <div
        className="relative min-h-screen flex flex-col items-center px-4 pt-8"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}
      >
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
            className="text-4xl md:text-5xl font-black drop-shadow-lg mb-2"
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

        {/* Flying dragon with everything equipped */}
        <div className="my-6 relative animate-draken-victory">
          <Glittra size={160} equipped={progress.equipped} flying />
        </div>

        {/* Medal */}
        <div className="relative my-2">
          <div className="text-7xl animate-medal-glow select-none">🏅</div>
        </div>
        <p className="text-base font-black text-purple-800/90 mb-6">Drakhjältens medalj!</p>

        {/* New unlocks banner */}
        {newlyUnlocked.length > 0 && (
          <div className="w-full max-w-sm bg-gradient-to-r from-amber-200 via-pink-200 to-violet-200 rounded-3xl p-4 shadow-md ring-2 ring-amber-300 mb-4 text-center">
            <p className="text-sm font-black text-purple-800 mb-2">
              ✨ Nya föremål upplåsta! ✨
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              {newlyUnlocked.map(id => {
                const def = REWARD_BY_ID[id];
                if (!def) return null;
                return (
                  <span
                    key={id}
                    className="bg-white/90 rounded-full px-3 py-1 text-xs font-black text-purple-700 shadow-sm"
                  >
                    {def.emoji} {def.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Wardrobe */}
        <div className="w-full max-w-sm bg-white/95 rounded-3xl p-5 shadow-xl ring-2 ring-purple-200">
          <p className="text-base font-black text-purple-800 text-center mb-1">
            Klä Glittra som du vill 💜
          </p>
          <p className="text-xs font-bold text-purple-600/70 text-center mb-4">
            Tryck för att ta på · tryck igen för att ta av
          </p>

          <div className="space-y-4">
            {CATEGORY_ORDER.map(cat => {
              const items = REWARDS_CATALOG.filter(r => r.cat === cat);
              const meta = CATEGORY_LABELS[cat];
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{meta.emoji}</span>
                    <span className="text-xs font-black text-purple-700/80 uppercase tracking-wide">
                      {meta.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {items.map(r => {
                      const unlocked = progress.unlockedRewards.includes(r.id);
                      const equipped = progress.equipped[r.cat] === r.id;
                      const justUnlocked = newlyUnlocked.includes(r.id);
                      return (
                        <button
                          key={r.id}
                          onClick={() => unlocked && handleToggle(r.id)}
                          disabled={!unlocked}
                          className={`relative p-2 rounded-2xl text-center active:scale-95 transition-all ring-2 min-h-[88px] ${
                            equipped
                              ? 'bg-gradient-to-br from-fuchsia-400 to-purple-500 text-white ring-amber-200 shadow-md scale-105'
                              : unlocked
                              ? 'bg-gradient-to-br from-pink-50 to-violet-50 text-purple-800 ring-purple-100'
                              : 'bg-gray-100 text-gray-400 ring-gray-200'
                          } ${justUnlocked ? 'animate-draken-pop' : ''}`}
                        >
                          <div className="text-3xl mb-0.5">{unlocked ? r.emoji : '🔒'}</div>
                          <div className="text-[11px] font-black leading-tight">
                            {unlocked ? r.label : `${r.cost} ⭐`}
                          </div>
                          {equipped && (
                            <span className="absolute -top-1.5 -right-1.5 bg-amber-300 text-purple-900 text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-white">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] font-bold text-purple-500/70 text-center mt-4">
            Samla fler stjärnor för att låsa upp fler föremål!
          </p>
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
