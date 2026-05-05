'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { GameBackground } from '@/components/GameBackground';
import { GAME_THEMES } from '@/lib/gameThemes';
import { DrakenHeader } from '@/components/draken/DrakenHeader';
import { Glittra } from '@/components/draken/Glittra';
import { useSpeech } from '@/hooks/useSpeech';
import { hapticImpact, hapticNotification } from '@/utils/haptics';
import {
  loadDraken,
  setPlayerName,
  setDragonName,
  resetDraken,
  TOTAL_LEVELS,
  type DrakenProgress,
  DEFAULT_DRAKEN,
} from '@/lib/drakenStorage';

export default function ProfilPage() {
  const { speak } = useSpeech();
  const [progress, setProgress] = useState<DrakenProgress>(DEFAULT_DRAKEN);
  const [player, setPlayer] = useState('');
  const [dragon, setDragon] = useState('Glittra');
  const [savedFlash, setSavedFlash] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    const p = loadDraken();
    setProgress(p);
    setPlayer(p.playerName || '');
    setDragon(p.dragonName || 'Glittra');
  }, []);

  const handleSave = () => {
    let updated = setPlayerName(player.trim());
    updated = setDragonName(dragon);
    setProgress(updated);
    setSavedFlash(true);
    hapticNotification('success');
    speak(
      updated.playerName
        ? `Sparat! Hej ${updated.playerName}, ${updated.dragonName} är glad att se dig!`
        : `Sparat! ${updated.dragonName} är glad att träffa dig!`
    );
    setTimeout(() => setSavedFlash(false), 1800);
  };

  const handleReset = () => {
    resetDraken();
    const p = loadDraken();
    setProgress(p);
    setPlayer('');
    setDragon('Glittra');
    setConfirmReset(false);
    hapticImpact('medium');
    speak('Allt har börjat om!');
  };

  return (
    <GameBackground theme={GAME_THEMES.draken} className="pb-12">
      <DrakenHeader title="Min profil" emoji="🪪" />

      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className="flex flex-col items-center bg-white/85 rounded-3xl p-5 shadow-md ring-2 ring-sky-200 mb-4">
          <Glittra size={120} equipped={progress.equipped} rainbow={progress.isMagimastare} />
          {progress.isMagimastare && (
            <div className="mt-2 inline-block bg-gradient-to-r from-amber-300 via-pink-400 to-violet-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-md animate-medal-glow">
              🏆 Magimästare
            </div>
          )}
          <div className="mt-3 text-center">
            <div className="text-base font-black text-purple-800">
              {progress.playerName || 'Hjälte'} & {progress.dragonName}
            </div>
            <div className="text-xs font-bold text-purple-700/70 mt-1">
              ⭐ {progress.totalStars} stjärnor · {progress.completedLevels.length}/{TOTAL_LEVELS} öar
            </div>
            {progress.dailyStreak > 0 && (
              <div className="text-xs font-bold text-amber-700/80 mt-1">
                🔥 {progress.dailyStreak} dag{progress.dailyStreak === 1 ? '' : 'ar'} i rad
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/95 rounded-3xl p-5 shadow-md ring-2 ring-violet-200 mb-4 space-y-4">
          <div>
            <label className="text-xs font-black text-purple-700/80 uppercase tracking-wide">
              Ditt namn
            </label>
            <input
              type="text"
              value={player}
              onChange={e => setPlayer(e.target.value.slice(0, 20))}
              maxLength={20}
              placeholder="Skriv ditt namn"
              className="mt-1 w-full px-4 py-3 rounded-2xl bg-pink-50 ring-2 ring-pink-200 text-base font-bold text-purple-900 placeholder:text-purple-400 focus:outline-none focus:ring-pink-400 transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-black text-purple-700/80 uppercase tracking-wide">
              Drakens namn
            </label>
            <input
              type="text"
              value={dragon}
              onChange={e => setDragon(e.target.value.slice(0, 20))}
              maxLength={20}
              placeholder="Glittra"
              className="mt-1 w-full px-4 py-3 rounded-2xl bg-violet-50 ring-2 ring-violet-200 text-base font-bold text-purple-900 placeholder:text-purple-400 focus:outline-none focus:ring-violet-400 transition-all"
            />
          </div>

          <button
            onClick={handleSave}
            className={`w-full py-4 rounded-3xl font-black text-base shadow-md active:scale-95 transition-all ${
              savedFlash
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white'
                : 'bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white'
            }`}
          >
            {savedFlash ? '✓ Sparat!' : '💾 Spara'}
          </button>
        </div>

        <div className="bg-white/85 rounded-3xl p-4 shadow-md ring-2 ring-pink-200 mb-4">
          <p className="text-sm font-black text-purple-800 mb-2">Klä din drake</p>
          <p className="text-xs font-bold text-purple-700/70 mb-3">
            Lås upp föremål genom att klara öar — sen kan du blanda och matcha!
          </p>
          <Link
            href="/draken/vinst"
            className="block w-full py-3 rounded-3xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black text-center shadow active:scale-95 transition-transform"
          >
            👕 Öppna garderoben
          </Link>
        </div>

        <div className="bg-white/85 rounded-3xl p-4 shadow-md ring-2 ring-rose-200">
          <p className="text-sm font-black text-rose-700 mb-2">Börja om från början</p>
          <p className="text-xs font-bold text-purple-700/70 mb-3">
            Det här tar bort alla stjärnor, föremål och framsteg. Det kan inte ångras!
          </p>
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="w-full py-3 rounded-3xl bg-rose-100 text-rose-700 font-black ring-2 ring-rose-300 active:scale-95 transition-transform"
            >
              🗑️ Återställ allt
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-black text-rose-700 text-center">
                Är du säker?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfirmReset(false)}
                  className="py-3 rounded-3xl bg-white text-purple-800 font-black ring-2 ring-purple-200 active:scale-95 transition-transform"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleReset}
                  className="py-3 rounded-3xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-black shadow active:scale-95 transition-transform"
                >
                  Ja, återställ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </GameBackground>
  );
}
