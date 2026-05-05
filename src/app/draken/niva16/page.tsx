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

type EnvKey = 'vag' | 'vatten' | 'luft' | 'spar';

interface Vehicle {
  emoji: string;
  name: string;
  env: EnvKey;
  purpose: string;
}

const VEHICLES: Vehicle[] = [
  { emoji: '🚗', name: 'bil',         env: 'vag',    purpose: 'kör på vägen' },
  { emoji: '🚌', name: 'buss',        env: 'vag',    purpose: 'tar många till skolan' },
  { emoji: '🚒', name: 'brandbil',    env: 'vag',    purpose: 'släcker bränder' },
  { emoji: '🚑', name: 'ambulans',    env: 'vag',    purpose: 'hjälper sjuka' },
  { emoji: '🚓', name: 'polisbil',    env: 'vag',    purpose: 'hjälper polisen' },
  { emoji: '🚲', name: 'cykel',       env: 'vag',    purpose: 'cyklar man på' },
  { emoji: '🚂', name: 'tåg',         env: 'spar',   purpose: 'rullar på spår' },
  { emoji: '🚇', name: 'tunnelbana',  env: 'spar',   purpose: 'kör under jord' },
  { emoji: '🚤', name: 'motorbåt',    env: 'vatten', purpose: 'glider på vattnet' },
  { emoji: '⛵', name: 'segelbåt',    env: 'vatten', purpose: 'seglar med vinden' },
  { emoji: '🚢', name: 'fartyg',      env: 'vatten', purpose: 'fraktar saker över havet' },
  { emoji: '✈️', name: 'flygplan',   env: 'luft',   purpose: 'flyger högt på himlen' },
  { emoji: '🚁', name: 'helikopter',  env: 'luft',   purpose: 'svävar i luften' },
  { emoji: '🚀', name: 'raket',       env: 'luft',   purpose: 'flyger till rymden' },
];

const ENVIRONMENTS: Record<EnvKey, { emoji: string; label: string; color: string; ring: string }> = {
  vag:    { emoji: '🛣️', label: 'Väg',    color: 'from-slate-400 to-slate-600',     ring: 'ring-slate-200' },
  vatten: { emoji: '🌊',  label: 'Vatten', color: 'from-sky-300 to-blue-500',        ring: 'ring-sky-200' },
  luft:   { emoji: '☁️',  label: 'Luft',   color: 'from-cyan-200 to-indigo-300',     ring: 'ring-cyan-200' },
  spar:   { emoji: '🛤️', label: 'Spår',   color: 'from-amber-300 to-orange-500',    ring: 'ring-amber-200' },
};

const ENV_ORDER: EnvKey[] = ['vag', 'vatten', 'luft', 'spar'];
const ROUNDS = 7;

function shuffle<T>(a: T[]): T[] {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

function buildQueue(): Vehicle[] {
  return shuffle(VEHICLES).slice(0, ROUNDS);
}

export default function Niva16() {
  const { speak } = useSpeech();
  const [queue, setQueue] = useState<Vehicle[]>(() => buildQueue());
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<EnvKey | null>(null);
  const [wrong, setWrong] = useState<EnvKey | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);
  const [hasIntro, setHasIntro] = useState(false);

  const current = queue[round];

  useEffect(() => {
    if (hasIntro) return;
    const t = setTimeout(() => {
      speak(`En ${current.name} ${current.purpose}. Var hör den hemma?`);
      setHasIntro(true);
    }, 350);
    return () => clearTimeout(t);
  }, [current, speak, hasIntro]);

  const next = () => {
    if (round + 1 >= queue.length) {
      const finalStars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      setStars(finalStars);
      completeLevel(16, finalStars);
      setDone(true);
      return;
    }
    setRound(r => r + 1);
    setPicked(null);
    setHasIntro(false);
  };

  const handleAnswer = (env: EnvKey) => {
    if (picked || done) return;
    if (env === current.env) {
      setPicked(env);
      hapticNotification('success');
      speak(`Rätt! En ${current.name} ${current.purpose}.`);
      setTimeout(() => next(), 1500);
    } else {
      setWrong(env);
      setMistakes(m => m + 1);
      hapticImpact('light');
      speak('Försök igen!');
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
  };

  return (
    <GameBackground theme={GAME_THEMES.draken} className="pb-12">
      <DrakenHeader title="Fordonsstaden" emoji="🚗" />

      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-3 bg-white/70 rounded-3xl p-3 shadow-sm ring-2 ring-blue-200">
          <Glittra size={64} />
          <div className="flex-1">
            <div className="text-sm font-bold text-purple-700/70">
              Nivå 16 · Runda {round + 1}/{queue.length}
            </div>
            <button
              onClick={() => speak(`En ${current.name} ${current.purpose}. Var hör den hemma?`)}
              className="text-left text-xl font-black text-blue-700 active:scale-95 transition-transform"
            >
              Var kör fordonet? 🔊
            </button>
          </div>
        </div>

        {/* Vehicle showcase */}
        <div
          className="relative w-full rounded-[36px] bg-gradient-to-b from-sky-100 via-cyan-50 to-blue-100 ring-4 ring-white/70 shadow-xl overflow-hidden mb-4 flex flex-col items-center justify-center"
          style={{ height: 220 }}
        >
          <button
            onClick={() => speak(current.name)}
            className="text-9xl select-none animate-balloon-float active:scale-95 transition-transform"
            style={{ filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.18))' }}
            aria-label={current.name}
          >
            {current.emoji}
          </button>
          <div className="bg-white/95 rounded-full px-5 py-1.5 shadow-md ring-2 ring-blue-200 text-xl font-black text-purple-800 mt-2 capitalize">
            {current.name}
          </div>
          <p className="text-xs font-bold text-purple-700/70 mt-1">{current.purpose}</p>
        </div>

        {/* Environment options */}
        <div className="grid grid-cols-2 gap-3">
          {ENV_ORDER.map(key => {
            const env = ENVIRONMENTS[key];
            const isCorrect = picked === key;
            const isWrong = wrong === key;
            return (
              <button
                key={key}
                onClick={() => handleAnswer(key)}
                disabled={picked !== null}
                className={`p-4 rounded-3xl bg-gradient-to-br ${env.color} text-white shadow-lg ring-4 active:scale-95 transition-all ${
                  isCorrect
                    ? 'ring-amber-300 scale-105'
                    : isWrong
                    ? 'ring-red-300 animate-shake'
                    : env.ring
                }`}
              >
                <div className="text-5xl">{env.emoji}</div>
                <div className="text-base font-black mt-1 drop-shadow">{env.label}</div>
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs font-bold text-purple-900/70 mt-3">
          Matcha fordon till miljö och syfte 🚗🚤✈️
        </p>
      </div>

      {done && (
        <LevelComplete
          level={16}
          stars={stars}
          islandName="Fordonsstaden"
          nextHref="/draken/niva17"
          onReplay={replay}
        />
      )}
    </GameBackground>
  );
}
