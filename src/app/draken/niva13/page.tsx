'use client';

import { useEffect, useState } from 'react';
import { GameBackground } from '@/components/GameBackground';
import { GAME_THEMES } from '@/lib/gameThemes';
import { DrakenHeader } from '@/components/draken/DrakenHeader';
import { Glittra } from '@/components/draken/Glittra';
import { LevelComplete } from '@/components/draken/LevelComplete';
import { useSpeech } from '@/hooks/useSpeech';
import { hapticImpact, hapticNotification } from '@/utils/haptics';
import { completeLevel } from '@/lib/drakenStorage';

interface Routine {
  emoji: string;
  text: string;
  time: 'dag' | 'natt';
}

const ROUTINES: Routine[] = [
  { emoji: '🥣', text: 'Äta frukost',     time: 'dag' },
  { emoji: '🦷', text: 'Borsta tänderna', time: 'natt' },
  { emoji: '🌞', text: 'Leka ute',         time: 'dag' },
  { emoji: '🛏️', text: 'Sova i sängen',   time: 'natt' },
  { emoji: '🚿', text: 'Duscha på morgonen', time: 'dag' },
  { emoji: '📚', text: 'Läsa godnattsaga', time: 'natt' },
  { emoji: '🎒', text: 'Gå till förskolan', time: 'dag' },
  { emoji: '🌙', text: 'Säga godnatt',    time: 'natt' },
  { emoji: '🍎', text: 'Äta lunch',       time: 'dag' },
  { emoji: '🦉', text: 'Ugglan tjuter',   time: 'natt' },
];

const ROUNDS = 6;

function shuffle<T>(a: T[]): T[] {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

function buildQueue(): Routine[] {
  return shuffle(ROUTINES).slice(0, ROUNDS);
}

export default function Niva13() {
  const { speak } = useSpeech();
  const [queue, setQueue] = useState<Routine[]>(() => buildQueue());
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<'dag' | 'natt' | null>(null);
  const [wrong, setWrong] = useState<'dag' | 'natt' | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);
  const [hasIntro, setHasIntro] = useState(false);
  const [skyMode, setSkyMode] = useState<'dag' | 'natt'>('dag');

  const current = queue[round];

  useEffect(() => {
    if (hasIntro) return;
    const t = setTimeout(() => {
      speak(`${current.text}. Är det dag eller natt?`);
      setHasIntro(true);
    }, 350);
    return () => clearTimeout(t);
  }, [current, speak, hasIntro]);

  const next = () => {
    if (round + 1 >= queue.length) {
      const finalStars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      setStars(finalStars);
      completeLevel(13, finalStars);
      setDone(true);
      return;
    }
    setRound(r => r + 1);
    setPicked(null);
    setHasIntro(false);
  };

  const handleAnswer = (choice: 'dag' | 'natt') => {
    if (picked || done) return;
    if (choice === current.time) {
      setPicked(choice);
      setSkyMode(choice);
      hapticNotification('success');
      speak(choice === 'dag' ? 'Ja, det gör vi på dagen!' : 'Ja, det gör vi på natten!');
      setTimeout(() => next(), 1300);
    } else {
      setWrong(choice);
      setMistakes(m => m + 1);
      hapticImpact('light');
      speak('Nej, försök igen!');
      setTimeout(() => setWrong(null), 600);
    }
  };

  const replay = () => {
    setQueue(buildQueue());
    setRound(0);
    setPicked(null);
    setMistakes(0);
    setStars(0);
    setDone(false);
    setHasIntro(false);
    setSkyMode('dag');
  };

  const skyGradient =
    skyMode === 'dag'
      ? 'from-sky-300 via-amber-100 to-orange-200'
      : 'from-indigo-900 via-purple-900 to-slate-900';

  return (
    <GameBackground theme={GAME_THEMES.draken} className="pb-12">
      <DrakenHeader title="Tidsstranden" emoji="🌅" />

      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-3 bg-white/70 rounded-3xl p-3 shadow-sm ring-2 ring-orange-200">
          <Glittra size={64} />
          <div className="flex-1">
            <div className="text-sm font-bold text-purple-700/70">
              Nivå 13 · Runda {round + 1}/{queue.length}
            </div>
            <button
              onClick={() => speak(`${current.text}. Är det dag eller natt?`)}
              className="text-left text-xl font-black text-orange-700 active:scale-95 transition-transform"
            >
              Dag eller natt? 🔊
            </button>
          </div>
        </div>

        {/* Sky scene */}
        <div
          className={`relative w-full rounded-[36px] bg-gradient-to-b ${skyGradient} ring-4 ring-white/70 shadow-xl overflow-hidden mb-4 transition-all duration-700`}
          style={{ height: 240 }}
        >
          {/* Sun */}
          <button
            onClick={() => {
              setSkyMode('dag');
              hapticImpact('light');
              speak('Solen är uppe — det är dag!');
            }}
            className={`absolute select-none active:scale-90 transition-all duration-700`}
            style={{
              top: skyMode === 'dag' ? '14%' : '110%',
              left: '20%',
              fontSize: 80,
              filter: 'drop-shadow(0 4px 14px rgba(250,204,21,0.7))',
            }}
            aria-label="Sol"
          >
            ☀️
          </button>
          {/* Moon */}
          <button
            onClick={() => {
              setSkyMode('natt');
              hapticImpact('light');
              speak('Månen lyser — det är natt!');
            }}
            className={`absolute select-none active:scale-90 transition-all duration-700`}
            style={{
              top: skyMode === 'natt' ? '14%' : '110%',
              right: '20%',
              fontSize: 70,
              filter: 'drop-shadow(0 4px 14px rgba(168,85,247,0.7))',
            }}
            aria-label="Måne"
          >
            🌙
          </button>
          {/* Stars only at night */}
          {skyMode === 'natt' &&
            Array.from({ length: 12 }, (_, i) => (
              <span
                key={i}
                className="absolute text-xs animate-soft-pulse text-white"
                style={{
                  top: `${(i * 11 + 5) % 60}%`,
                  left: `${(i * 17 + 9) % 95}%`,
                  animationDelay: `${i * 0.18}s`,
                }}
              >
                ✨
              </span>
            ))}
          {/* Beach */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-amber-300 to-transparent opacity-90" />

          {/* Routine card */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 rounded-2xl px-5 py-3 shadow-lg ring-2 ring-orange-200 flex items-center gap-3">
            <span className="text-4xl">{current.emoji}</span>
            <span className="text-base font-black text-purple-800">{current.text}</span>
          </div>
        </div>

        {/* Choice buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleAnswer('dag')}
            disabled={picked !== null}
            className={`p-5 rounded-3xl bg-gradient-to-br from-amber-200 to-orange-300 shadow-lg ring-4 active:scale-95 transition-all ${
              picked === 'dag'
                ? 'ring-amber-400 scale-105'
                : wrong === 'dag'
                ? 'ring-red-300 animate-shake'
                : 'ring-amber-100'
            }`}
          >
            <div className="text-5xl">☀️</div>
            <div className="text-base font-black text-orange-700 mt-1">Dag</div>
          </button>
          <button
            onClick={() => handleAnswer('natt')}
            disabled={picked !== null}
            className={`p-5 rounded-3xl bg-gradient-to-br from-indigo-300 to-purple-500 text-white shadow-lg ring-4 active:scale-95 transition-all ${
              picked === 'natt'
                ? 'ring-amber-300 scale-105'
                : wrong === 'natt'
                ? 'ring-red-300 animate-shake'
                : 'ring-indigo-200'
            }`}
          >
            <div className="text-5xl">🌙</div>
            <div className="text-base font-black mt-1">Natt</div>
          </button>
        </div>

        <p className="text-center text-xs font-bold text-purple-900/70 mt-3">
          Tryck också på solen och månen för att byta scen ☀️🌙
        </p>
      </div>

      {done && (
        <LevelComplete
          level={13}
          stars={stars}
          islandName="Tidsstranden"
          nextHref="/draken/niva14"
          onReplay={replay}
        />
      )}
    </GameBackground>
  );
}
