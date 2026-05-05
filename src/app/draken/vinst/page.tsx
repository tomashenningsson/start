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
  RAINBOW_DRAGON_REWARD,
  TOTAL_LEVELS,
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
  const [transforming, setTransforming] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = loadDraken();
    const before = new Set(initial.unlockedRewards);
    const synced = syncRewards(initial);
    saveDraken(synced);
    setProgress(synced);
    setNewlyUnlocked(synced.unlockedRewards.filter(id => !before.has(id)));
    setMounted(true);

    if (isAllLevelsComplete(synced)) {
      const t1 = setTimeout(() => setRevealed(true), 600);
      const t2 = setTimeout(() => setTransforming(true), 1500);
      const t3 = setTimeout(() => {
        speak('Du är Magimästare! Möt Regnbågsdraken!');
        hapticNotification('success');
      }, 2200);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [speak]);

  const handleToggle = (id: string) => {
    const updated = toggleEquip(id);
    setProgress(updated);
    hapticImpact('light');
    const def = id === RAINBOW_DRAGON_REWARD.id ? RAINBOW_DRAGON_REWARD : REWARD_BY_ID[id];
    if (def && updated.equipped[def.cat] === id) {
      speak('Vad fint!');
    }
  };

  if (!mounted) {
    return (
      <GameBackground theme={GAME_THEMES.draken} className="min-h-screen">
        <div />
      </GameBackground>
    );
  }

  const completed = isAllLevelsComplete(progress);
  const noProgress = progress.completedLevels.length === 0;

  if (noProgress) {
    return (
      <GameBackground theme={GAME_THEMES.draken} className="min-h-screen flex flex-col items-center justify-center p-6">
        <Glittra size={120} equipped={progress.equipped} />
        <div className="bg-white/90 rounded-3xl p-6 shadow-xl max-w-sm text-center mt-4">
          <p className="text-lg font-black text-purple-800 mb-3">Spela en ö först! 🌟</p>
          <p className="text-sm font-bold text-purple-700/70 mb-4">
            Klara öar för att låsa upp roliga föremål till Glittra.
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

  const showRainbow = completed && (transforming || progress.equipped.body === RAINBOW_DRAGON_REWARD.id);

  return (
    <GameBackground theme={GAME_THEMES.draken} className="pb-12">
      <div
        className="relative min-h-screen flex flex-col items-center px-4 pt-8"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}
      >
        {/* Floating sparkles only on full victory */}
        {completed && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 18 }, (_, i) => (
              <span
                key={i}
                className="absolute text-2xl opacity-80 animate-balloon-float"
                style={{
                  top: `${(i * 6 + 5) % 90}%`,
                  left: `${(i * 17 + 7) % 95}%`,
                  animationDelay: `${i * 0.18}s`,
                }}
              >
                {['✨', '⭐', '🌟', '💫', '🌈'][i % 5]}
              </span>
            ))}
          </div>
        )}

        {completed && transforming && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 26 }, (_, i) => (
              <span
                key={`c-${i}`}
                className="absolute text-3xl animate-confetti-fall"
                style={{
                  left: `${(i * 4 + 3) % 95}%`,
                  top: '-30px',
                  animationDelay: `${i * 0.07}s`,
                }}
              >
                {['🎉', '✨', '⭐', '💖', '🌈', '🏆'][i % 6]}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <div className={`text-center ${completed && revealed ? 'animate-rainbow-sweep' : ''}`}>
          {completed ? (
            <>
              <h1
                className="text-4xl md:text-5xl font-black drop-shadow-lg mb-2"
                style={{
                  background: 'linear-gradient(90deg, #f472b6, #facc15, #22d3ee, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.18))',
                }}
              >
                Du räddade alla
                <br />
                magiska öar!
              </h1>
              <div className="mt-3 inline-block bg-gradient-to-r from-amber-300 via-pink-400 to-violet-500 text-white px-5 py-2 rounded-full text-base font-black shadow-lg animate-medal-glow">
                🏆 Magimästare 🏆
              </div>
              <p className="text-base font-black text-purple-900/80 mt-2">
                ⭐ {progress.totalStars} stjärnor totalt ⭐
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black text-purple-800 drop-shadow-sm mb-2">
                👕 {progress.dragonName === 'Glittra' ? 'Glittras' : `${progress.dragonName}s`} Garderob
              </h1>
              <p className="text-sm font-bold text-purple-800/80">
                Du har räddat {progress.completedLevels.length} av {TOTAL_LEVELS} öar
              </p>
              <p className="text-xs font-bold text-purple-700/70 mt-1">
                ⭐ {progress.totalStars} stjärnor · Klara fler öar för att låsa upp mer!
              </p>
            </>
          )}
        </div>

        {/* Glittra */}
        <div className={`my-6 relative ${completed ? 'animate-draken-victory' : ''}`}>
          <Glittra
            size={completed ? 180 : 130}
            equipped={progress.equipped}
            flying={completed}
            rainbow={showRainbow}
          />
        </div>

        {completed && (
          <>
            <div className="text-7xl animate-medal-glow select-none">🏅</div>
            <p className="text-base font-black text-purple-800/90 mb-1 mt-1">Drakhjältens medalj!</p>
            <p className="text-xs font-bold text-purple-700/80 mb-4 text-center max-w-xs">
              Regnbågsdraken är nu upplåst — använd den i garderoben för att förvandla dig!
            </p>
          </>
        )}

        {/* New unlocks banner */}
        {newlyUnlocked.length > 0 && (
          <div className="w-full max-w-sm bg-gradient-to-r from-amber-200 via-pink-200 to-violet-200 rounded-3xl p-4 shadow-md ring-2 ring-amber-300 mb-4 text-center">
            <p className="text-sm font-black text-purple-800 mb-2">
              ✨ Nya föremål upplåsta! ✨
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              {newlyUnlocked.map(id => {
                const def = id === RAINBOW_DRAGON_REWARD.id ? RAINBOW_DRAGON_REWARD : REWARD_BY_ID[id];
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
            Klä {progress.dragonName} som du vill 💜
          </p>
          <p className="text-xs font-bold text-purple-600/70 text-center mb-4">
            Tryck för att ta på · tryck igen för att ta av
          </p>

          <div className="space-y-4">
            {CATEGORY_ORDER.map(cat => {
              const items = REWARDS_CATALOG.filter(r => r.cat === cat);
              const meta = CATEGORY_LABELS[cat];
              const includeRainbow = cat === 'body' && progress.unlockedRewards.includes(RAINBOW_DRAGON_REWARD.id);
              const allItems = includeRainbow ? [...items, RAINBOW_DRAGON_REWARD] : items;
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{meta.emoji}</span>
                    <span className="text-xs font-black text-purple-700/80 uppercase tracking-wide">
                      {meta.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {allItems.map(r => {
                      const unlocked = progress.unlockedRewards.includes(r.id);
                      const equipped = progress.equipped[r.cat] === r.id;
                      const justUnlocked = newlyUnlocked.includes(r.id);
                      const isLegendary = r.id === RAINBOW_DRAGON_REWARD.id;
                      return (
                        <button
                          key={r.id}
                          onClick={() => unlocked && handleToggle(r.id)}
                          disabled={!unlocked}
                          className={`relative p-2 rounded-2xl text-center active:scale-95 transition-all ring-2 min-h-[88px] ${
                            equipped
                              ? 'bg-gradient-to-br from-fuchsia-400 to-purple-500 text-white ring-amber-200 shadow-md scale-105'
                              : unlocked
                              ? isLegendary
                                ? 'bg-gradient-to-br from-amber-100 via-pink-100 to-violet-200 text-purple-800 ring-amber-300'
                                : 'bg-gradient-to-br from-pink-50 to-violet-50 text-purple-800 ring-purple-100'
                              : 'bg-gray-100 text-gray-400 ring-gray-200'
                          } ${justUnlocked ? 'animate-draken-pop' : ''} ${
                            isLegendary && unlocked ? 'animate-medal-glow' : ''
                          }`}
                        >
                          <div className="text-3xl mb-0.5">{unlocked ? r.emoji : '🔒'}</div>
                          <div className="text-[11px] font-black leading-tight">
                            {unlocked ? r.label : `Niva ${r.unlockedBy}`}
                          </div>
                          {equipped && (
                            <span className="absolute -top-1.5 -right-1.5 bg-amber-300 text-purple-900 text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-white">
                              ✓
                            </span>
                          )}
                          {isLegendary && unlocked && (
                            <span className="absolute -top-1.5 -left-1.5 bg-gradient-to-r from-amber-400 to-pink-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 shadow ring-2 ring-white">
                              MAGI
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
            Varje ö ger 2 nya föremål — klara alla {TOTAL_LEVELS} för Regnbågsdraken!
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
