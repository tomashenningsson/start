'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { StarRow } from './StarRow';
import { Glittra } from './Glittra';
import { useSpeech } from '@/hooks/useSpeech';

interface Props {
  level: number;
  stars: number;
  islandName: string;
  nextHref?: string | null;
  onReplay: () => void;
}

export function LevelComplete({ level, stars, islandName, nextHref, onReplay }: Props) {
  const { speak } = useSpeech();

  useEffect(() => {
    const phrases = [
      'Jättebra! Du räddade ön!',
      'Fantastiskt jobbat!',
      'Wow, du klarade det!',
    ];
    speak(phrases[Math.floor(Math.random() * phrases.length)]);
  }, [speak]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(circle at 50% 35%, rgba(168,85,247,0.55), rgba(15,3,40,0.85))',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="relative w-full max-w-sm rounded-[36px] p-7 text-center shadow-2xl"
        style={{
          background: 'linear-gradient(160deg, #fdf4ff 0%, #fce7f3 50%, #ede9fe 100%)',
          boxShadow: '0 20px 60px -10px rgba(168,85,247,0.6), 0 0 0 4px rgba(255,255,255,0.6) inset',
        }}
      >
        <div className="absolute -top-10 left-1/2 -translate-x-1/2">
          <Glittra size={96} />
        </div>

        <div className="pt-12">
          <div className="text-3xl font-black text-purple-700 mb-1">Nivå {level} klar!</div>
          <div className="text-base font-bold text-pink-500 mb-4">{islandName} är räddad! ✨</div>

          <div className="my-4">
            <StarRow count={stars} size="xl" />
          </div>

          <p className="text-sm font-semibold text-purple-600/80 mb-6">
            {stars === 3 ? 'Perfekt! Glittra dansar av glädje! 💜' : stars === 2 ? 'Toppen jobbat! 🌟' : 'Bra! Du klarade det! 🎉'}
          </p>

          <div className="space-y-3">
            {nextHref ? (
              <Link
                href={nextHref}
                className="block w-full py-4 rounded-3xl bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white font-black text-lg shadow-md active:scale-95 transition-transform"
              >
                Nästa ö ➡️
              </Link>
            ) : (
              <Link
                href="/draken/vinst"
                className="block w-full py-4 rounded-3xl bg-gradient-to-r from-amber-400 to-pink-500 text-white font-black text-lg shadow-md active:scale-95 transition-transform"
              >
                🏆 Slutscen!
              </Link>
            )}
            <button
              onClick={onReplay}
              className="block w-full py-3 rounded-3xl bg-white/80 text-purple-700 font-black text-base ring-2 ring-purple-200 active:scale-95 transition-transform"
            >
              Spela igen 🔁
            </button>
            <Link
              href="/draken"
              className="block w-full py-3 rounded-3xl bg-white/60 text-purple-600 font-bold text-sm active:scale-95 transition-transform"
            >
              Till kartan 🗺️
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
