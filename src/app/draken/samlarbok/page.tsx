'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GameBackground } from '@/components/GameBackground';
import { GAME_THEMES } from '@/lib/gameThemes';
import { DrakenHeader } from '@/components/draken/DrakenHeader';
import { Glittra } from '@/components/draken/Glittra';
import { StarRow } from '@/components/draken/StarRow';
import { useSpeech } from '@/hooks/useSpeech';
import { letters as ALL_LETTERS } from '@/data/letters';
import { numbers as ALL_NUMBERS } from '@/data/numbers';
import {
  loadDraken,
  TOTAL_LEVELS,
  type DrakenProgress,
  DEFAULT_DRAKEN,
} from '@/lib/drakenStorage';

const ISLAND_NAMES = [
  'Ballongängen',
  'Bokstavsskogen',
  'Räknefloden',
  'Formgrottan',
  'Bokstavsberget',
  'Drakslottet',
  'Färgön',
  'Mönstergården',
  'Stora-Lilla',
  'Memoryskogen',
  'Plus-Plutten',
  'Motsatsbron',
];

export default function Samlarbok() {
  const [progress, setProgress] = useState<DrakenProgress>(DEFAULT_DRAKEN);
  const [tab, setTab] = useState<'siffror' | 'bokstaver' | 'oar'>('siffror');
  const { speak } = useSpeech();

  useEffect(() => {
    setProgress(loadDraken());
  }, []);

  const numberData = ALL_NUMBERS.filter(n => n.value >= 1 && n.value <= 10);

  return (
    <GameBackground theme={GAME_THEMES.draken} className="pb-12">
      <DrakenHeader title="Samlarbok" emoji="📖" />

      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-4 bg-white/80 rounded-3xl p-3 shadow-md ring-2 ring-violet-200">
          <Glittra size={64} />
          <div className="flex-1">
            <div className="text-base font-black text-purple-900">Din samlarbok</div>
            <div className="text-sm font-bold text-purple-700/70">
              ⭐ {progress.totalStars} stjärnor · {progress.completedLevels.length}/{TOTAL_LEVELS} öar räddade
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 bg-white/60 rounded-full p-1 ring-2 ring-violet-200 shadow-sm">
          {([
            ['siffror', '🔢 Siffror'],
            ['bokstaver', '🔤 Bokstäver'],
            ['oar', '🏝️ Öar'],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex-1 py-2 rounded-full text-sm font-black transition-all active:scale-95 ${
                tab === k
                  ? 'bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white shadow'
                  : 'text-purple-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'siffror' && (
          <div className="bg-white/90 rounded-3xl p-4 shadow-md ring-2 ring-sky-200">
            <p className="text-sm font-bold text-sky-700 mb-3">
              Du har låst upp {progress.unlockedNumbers.length} siffror
            </p>
            <div className="grid grid-cols-5 gap-2">
              {numberData.map(n => {
                const unlocked = progress.unlockedNumbers.includes(n.value);
                return (
                  <button
                    key={n.value}
                    onClick={() => unlocked && speak(n.word)}
                    disabled={!unlocked}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center font-black ring-2 active:scale-95 transition-transform ${
                      unlocked
                        ? 'bg-gradient-to-br from-sky-200 to-cyan-300 text-sky-800 ring-sky-300 shadow-md'
                        : 'bg-gray-200 text-gray-400 ring-gray-300'
                    }`}
                  >
                    <div className="text-3xl">{unlocked ? n.value : '🔒'}</div>
                    <div className="text-[10px] mt-0.5 opacity-70">
                      {unlocked ? n.word : '???'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'bokstaver' && (
          <div className="bg-white/90 rounded-3xl p-4 shadow-md ring-2 ring-rose-200">
            <p className="text-sm font-bold text-rose-700 mb-3">
              Du har låst upp {progress.unlockedLetters.length} bokstäver
            </p>
            <div className="grid grid-cols-5 gap-2">
              {ALL_LETTERS.map(l => {
                const unlocked = progress.unlockedLetters.includes(l.letter);
                return (
                  <button
                    key={l.letter}
                    onClick={() => unlocked && speak(`${l.letter} som i ${l.example}`)}
                    disabled={!unlocked}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center font-black ring-2 active:scale-95 transition-transform ${
                      unlocked
                        ? 'bg-gradient-to-br from-rose-200 to-pink-300 text-rose-800 ring-rose-300 shadow-md'
                        : 'bg-gray-200 text-gray-400 ring-gray-300'
                    }`}
                  >
                    <div className="text-2xl">{unlocked ? l.letter : '🔒'}</div>
                    <div className="text-base mt-0.5">{unlocked ? l.emoji : ''}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'oar' && (
          <div className="space-y-3">
            {ISLAND_NAMES.map((name, i) => {
              const lvl = i + 1;
              const stars = progress.stars[lvl] ?? 0;
              const completed = progress.completedLevels.includes(lvl);
              return (
                <Link
                  key={lvl}
                  href={`/draken/niva${lvl}`}
                  className="flex items-center gap-3 bg-white/90 rounded-3xl p-4 shadow-md ring-2 ring-violet-200 active:scale-[0.98] transition-transform"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black ring-2 ${
                      completed
                        ? 'bg-gradient-to-br from-amber-200 to-pink-300 text-purple-800 ring-amber-200'
                        : 'bg-gray-100 text-gray-400 ring-gray-200'
                    }`}
                  >
                    {completed ? '✓' : lvl}
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-black text-purple-900">
                      {lvl}. {name}
                    </div>
                    <div className="mt-1">
                      <StarRow count={stars} size="sm" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </GameBackground>
  );
}
