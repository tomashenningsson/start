'use client';

import { useEffect, useMemo, useState } from 'react';
import { GameBackground } from '@/components/GameBackground';
import { GAME_THEMES } from '@/lib/gameThemes';
import { DrakenHeader } from '@/components/draken/DrakenHeader';
import { Glittra } from '@/components/draken/Glittra';
import { LevelComplete } from '@/components/draken/LevelComplete';
import { useSpeech } from '@/hooks/useSpeech';
import { hapticImpact, hapticNotification } from '@/utils/haptics';
import { completeLevel, unlockNumber } from '@/lib/drakenStorage';

const BALLOON_COLORS = [
  'from-pink-300 to-rose-500',
  'from-sky-300 to-blue-500',
  'from-amber-200 to-yellow-500',
  'from-emerald-300 to-green-500',
  'from-violet-300 to-purple-500',
  'from-rose-300 to-red-500',
];

// "ballong" is an en-word, so 1 = "en ballong"
const NUMBER_WORDS_EN = ['noll', 'en', 'två', 'tre', 'fyra', 'fem'];

function ballongPhrase(n: number) {
  return n === 1 ? 'en ballong' : `${NUMBER_WORDS_EN[n]} ballonger`;
}

const ROUNDS = 4;

interface Balloon {
  id: number;
  color: string;
  x: number;
  y: number;
  size: number;
  popped: boolean;
}

function makeBalloons(count: number): Balloon[] {
  const balloons: Balloon[] = [];
  const total = count + Math.floor(Math.random() * 3) + 2;
  for (let i = 0; i < total; i++) {
    balloons.push({
      id: i,
      color: BALLOON_COLORS[i % BALLOON_COLORS.length],
      x: 8 + Math.random() * 80,
      y: 10 + Math.random() * 65,
      size: 56 + Math.random() * 20,
      popped: false,
    });
  }
  return balloons;
}

function pickTarget(): number {
  return 1 + Math.floor(Math.random() * 5);
}

export default function Niva1() {
  const { speak } = useSpeech();
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState(pickTarget());
  const [balloons, setBalloons] = useState<Balloon[]>(() => makeBalloons(5));
  const [popped, setPopped] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [shake, setShake] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);
  const [introSpoken, setIntroSpoken] = useState(false);

  const goal = target;

  useEffect(() => {
    if (introSpoken) return;
    const t = setTimeout(() => {
      speak(`Poppa ${ballongPhrase(goal)}!`);
      setIntroSpoken(true);
    }, 350);
    return () => clearTimeout(t);
  }, [goal, speak, introSpoken]);

  useEffect(() => {
    if (popped < goal || done) return;
    hapticNotification('success');
    speak('Bra jobbat!');
    setTimeout(() => nextRound(), 1100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popped, goal, done]);

  const nextRound = () => {
    if (round + 1 >= ROUNDS) {
      finish();
      return;
    }
    const next = pickTarget();
    setTarget(next);
    setBalloons(makeBalloons(next));
    setPopped(0);
    setRound(r => r + 1);
    setTimeout(() => speak(`Poppa ${ballongPhrase(next)}!`), 250);
  };

  const finish = () => {
    const finalStars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
    setStars(finalStars);
    setDone(true);
    for (let n = 1; n <= 5; n++) unlockNumber(n);
    completeLevel(1, finalStars);
  };

  const handlePop = (id: number) => {
    if (popped >= goal) {
      setShake(id);
      setMistakes(m => m + 1);
      hapticImpact('light');
      speak('Det räcker! Du har redan poppat tillräckligt.');
      setTimeout(() => setShake(null), 500);
      return;
    }
    setBalloons(prev => prev.map(b => (b.id === id ? { ...b, popped: true } : b)));
    setPopped(p => p + 1);
    hapticImpact('light');
    speak(String(popped + 1));
  };

  const replay = () => {
    const next = pickTarget();
    setTarget(next);
    setBalloons(makeBalloons(next));
    setPopped(0);
    setRound(0);
    setMistakes(0);
    setStars(0);
    setDone(false);
    setIntroSpoken(false);
  };

  const counterPills = useMemo(
    () =>
      Array.from({ length: goal }, (_, i) => (
        <span
          key={i}
          className={`inline-block w-7 h-7 rounded-full ring-2 ring-white shadow-sm transition-all ${
            i < popped ? 'bg-gradient-to-br from-amber-300 to-pink-500 scale-110' : 'bg-white/40'
          }`}
        />
      )),
    [goal, popped]
  );

  return (
    <GameBackground theme={GAME_THEMES.draken} className="pb-12">
      <DrakenHeader title="Ballongängen" emoji="🎈" />

      <div className="px-4 pt-4 max-w-md mx-auto">
        {/* Glittra and instructions */}
        <div className="flex items-center gap-3 mb-3 bg-white/70 rounded-3xl p-3 shadow-sm ring-2 ring-pink-200">
          <Glittra size={64} />
          <div className="flex-1">
            <div className="text-sm font-bold text-purple-700/70">Nivå 1 · Runda {round + 1}/{ROUNDS}</div>
            <button
              onClick={() => speak(`Poppa ${ballongPhrase(goal)}!`)}
              className="text-left text-xl font-black text-purple-900 active:scale-95 transition-transform"
            >
              Poppa {goal === 1 ? 'en ballong' : `${goal} ballonger`}! 🔊
            </button>
          </div>
        </div>

        {/* Counter */}
        <div className="flex items-center justify-center gap-2 mb-3">
          {counterPills}
        </div>

        {/* Balloon field */}
        <div
          className="relative w-full rounded-[36px] bg-gradient-to-b from-sky-200/70 via-cyan-100/60 to-emerald-200/70 ring-4 ring-white/60 shadow-xl overflow-hidden"
          style={{ height: 440 }}
        >
          {/* Grass at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-green-500 to-transparent opacity-70" />
          {balloons.map(b => (
            <button
              key={b.id}
              onClick={() => handlePop(b.id)}
              disabled={b.popped}
              className={`absolute select-none active:scale-90 transition-transform ${
                b.popped ? 'animate-balloon-pop pointer-events-none' : 'animate-balloon-float'
              } ${shake === b.id ? 'animate-shake' : ''}`}
              style={{
                left: `${b.x}%`,
                top: `${b.y}%`,
                width: b.size,
                height: b.size * 1.2,
                animationDelay: `${(b.id * 0.13) % 1.5}s`,
              }}
              aria-label="Ballong"
            >
              <div
                className={`w-full h-full rounded-[50%/55%] bg-gradient-to-br ${b.color} shadow-lg`}
                style={{
                  boxShadow: '0 10px 18px -6px rgba(168,85,247,0.45), 0 0 0 2px rgba(255,255,255,0.5) inset',
                }}
              >
                <div className="absolute top-2 left-3 w-3 h-4 bg-white/60 rounded-full blur-sm" />
              </div>
              <div
                className="absolute left-1/2 bottom-0 -translate-x-1/2 w-px bg-white/70"
                style={{ height: 16, transform: 'translate(-50%, 100%)' }}
              />
            </button>
          ))}
        </div>

        <p className="text-center text-xs font-bold text-purple-900/70 mt-3">
          Tryck på ballongerna för att poppa dem 🎯
        </p>
      </div>

      {done && (
        <LevelComplete
          level={1}
          stars={stars}
          islandName="Ballongängen"
          nextHref="/draken/niva2"
          onReplay={replay}
        />
      )}
    </GameBackground>
  );
}
