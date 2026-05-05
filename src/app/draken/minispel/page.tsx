'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { GameBackground } from '@/components/GameBackground';
import { GAME_THEMES } from '@/lib/gameThemes';
import { DrakenHeader } from '@/components/draken/DrakenHeader';
import { Glittra } from '@/components/draken/Glittra';
import { useSpeech } from '@/hooks/useSpeech';
import {
  loadDraken,
  type DrakenProgress,
  DEFAULT_DRAKEN,
} from '@/lib/drakenStorage';

interface MiniGame {
  id: string;
  href: string;
  emoji: string;
  title: string;
  desc: string;
  color: string;
  ring: string;
}

const GAMES: MiniGame[] = [
  {
    id: 'ballonger',
    href: '/draken/minispel/ballonger',
    emoji: '🎈',
    title: 'Ballongpoppning',
    desc: 'Poppa ballonger för siffror',
    color: 'from-pink-300 to-rose-500',
    ring: 'ring-pink-200',
  },
  {
    id: 'bokstavsjakt',
    href: '/draken/minispel/bokstavsjakt',
    emoji: '🔍',
    title: 'Bokstavsjakt',
    desc: 'Hitta rätt bokstav',
    color: 'from-amber-300 to-orange-500',
    ring: 'ring-amber-200',
  },
  {
    id: 'memory',
    href: '/draken/minispel/memory',
    emoji: '🃏',
    title: 'Memory',
    desc: 'Hitta paren',
    color: 'from-purple-300 to-indigo-500',
    ring: 'ring-purple-200',
  },
  {
    id: 'farglagg',
    href: '/draken/minispel/farglagg',
    emoji: '🎨',
    title: 'Färgläggning',
    desc: 'Måla draken!',
    color: 'from-emerald-300 to-teal-500',
    ring: 'ring-emerald-200',
  },
];

export default function MinispelHub() {
  const [progress, setProgress] = useState<DrakenProgress>(DEFAULT_DRAKEN);
  const { speak } = useSpeech();

  useEffect(() => {
    setProgress(loadDraken());
    const t = setTimeout(() => speak('Välj ett minispel!'), 350);
    return () => clearTimeout(t);
  }, [speak]);

  return (
    <GameBackground theme={GAME_THEMES.draken} className="pb-12">
      <DrakenHeader title="Minispel" emoji="🎮" />

      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-4 bg-white/80 rounded-3xl p-3 shadow-md ring-2 ring-teal-200">
          <Glittra size={64} equipped={progress.equipped} rainbow={progress.isMagimastare} />
          <div className="flex-1">
            <div className="text-base font-black text-purple-900">Minispel</div>
            <div className="text-sm font-bold text-purple-700/70">
              Spela hur länge du vill — inga stjärnor men hur kul som helst!
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {GAMES.map(game => {
            const best = progress.miniGameScores[game.id] ?? 0;
            return (
              <Link
                key={game.id}
                href={game.href}
                className={`relative p-5 rounded-3xl bg-gradient-to-br ${game.color} text-white shadow-xl ring-4 ${game.ring} active:scale-95 transition-all`}
              >
                <div className="text-5xl mb-2">{game.emoji}</div>
                <div className="text-base font-black drop-shadow">{game.title}</div>
                <div className="text-xs font-bold opacity-90 mt-0.5">{game.desc}</div>
                {best > 0 && (
                  <div className="absolute -top-2 -right-2 bg-amber-300 text-amber-900 text-xs font-black px-2 py-0.5 rounded-full shadow-md ring-2 ring-white">
                    🏆 {best}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        <p className="text-center text-xs font-bold text-purple-900/70 mt-4">
          Slappna av och ha kul i minispelens värld 🎮
        </p>
      </div>
    </GameBackground>
  );
}
