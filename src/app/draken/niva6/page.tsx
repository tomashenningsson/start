'use client';

import { useEffect, useMemo, useState } from 'react';
import { GameBackground } from '@/components/GameBackground';
import { GAME_THEMES } from '@/lib/gameThemes';
import { DrakenHeader } from '@/components/draken/DrakenHeader';
import { Glittra } from '@/components/draken/Glittra';
import { LevelComplete } from '@/components/draken/LevelComplete';
import { useSpeech } from '@/hooks/useSpeech';
import { hapticImpact, hapticNotification } from '@/utils/haptics';
import { completeLevel, unlockLetter, unlockNumber } from '@/lib/drakenStorage';

type Challenge =
  | { kind: 'siffra'; question: string; choices: string[]; answer: string; spoken: string; emoji: string; count?: number }
  | { kind: 'bokstav'; question: string; choices: string[]; answer: string; spoken: string; emoji: string }
  | { kind: 'rakna'; question: string; choices: string[]; answer: string; spoken: string; emoji: string; count: number }
  | { kind: 'form'; question: string; choices: string[]; answer: string; spoken: string };

const NUMBER_WORDS = ['noll', 'ett', 'två', 'tre', 'fyra', 'fem'];

function shuffle<T>(a: T[]): T[] {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

function buildChallenges(): Challenge[] {
  const list: Challenge[] = [];

  // Siffra: identify a number
  {
    const correct = 1 + Math.floor(Math.random() * 5);
    const set = new Set<number>([correct]);
    for (let off = 1; set.size < 3 && off < 6; off++) {
      if (correct - off >= 1) set.add(correct - off);
      if (correct + off <= 5) set.add(correct + off);
    }
    const choices = shuffle(Array.from(set).slice(0, 3)).map(String);
    list.push({
      kind: 'siffra',
      question: `Vilken siffra är ${NUMBER_WORDS[correct]}?`,
      spoken: `Vilken siffra är ${NUMBER_WORDS[correct]}?`,
      choices,
      answer: String(correct),
      emoji: '🔢',
    });
  }

  // Bokstav: tap the letter
  {
    const opts = [
      { l: 'A', word: 'apa' },
      { l: 'B', word: 'björn' },
      { l: 'S', word: 'sol' },
      { l: 'M', word: 'måne' },
      { l: 'K', word: 'katt' },
    ];
    const target = opts[Math.floor(Math.random() * opts.length)];
    const others = shuffle(opts.filter(o => o.l !== target.l)).slice(0, 2);
    list.push({
      kind: 'bokstav',
      question: `Hitta bokstaven ${target.l}!`,
      spoken: `Hitta bokstaven ${target.l}, som i ${target.word}!`,
      choices: shuffle([target.l, ...others.map(o => o.l)]),
      answer: target.l,
      emoji: '🔤',
    });
  }

  // Räkna: count emoji
  {
    const animals = ['🐉', '⭐', '💎', '🎈', '🌟'];
    const e = animals[Math.floor(Math.random() * animals.length)];
    const correct = 1 + Math.floor(Math.random() * 5);
    const set = new Set<number>([correct]);
    for (let off = 1; set.size < 3 && off < 6; off++) {
      if (correct - off >= 1) set.add(correct - off);
      if (correct + off <= 5) set.add(correct + off);
    }
    const choices = shuffle(Array.from(set).slice(0, 3)).map(String);
    list.push({
      kind: 'rakna',
      question: `Hur många ${e} ser du?`,
      spoken: `Räkna! Hur många ${e} ser du?`,
      choices,
      answer: String(correct),
      emoji: e,
      count: correct,
    });
  }

  // Form: identify shape — "hjärta" is an ett-word, the rest are en-words.
  {
    const opts: { name: string; gender: 'en' | 'ett' }[] = [
      { name: 'cirkel', gender: 'en' },
      { name: 'kvadrat', gender: 'en' },
      { name: 'triangel', gender: 'en' },
      { name: 'stjärna', gender: 'en' },
      { name: 'hjärta', gender: 'ett' },
    ];
    const target = opts[Math.floor(Math.random() * opts.length)];
    const others = shuffle(opts.filter(o => o.name !== target.name)).slice(0, 2);
    const article = target.gender === 'en' ? 'en' : 'ett';
    const which = target.gender === 'en' ? 'Vilken' : 'Vilket';
    list.push({
      kind: 'form',
      question: `${which} är ${article} ${target.name}?`,
      spoken: `${which} är ${article} ${target.name}?`,
      choices: shuffle([target.name, ...others.map(o => o.name)]),
      answer: target.name,
    });
  }

  return list;
}

function ShapeIcon({ name, size = 56 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      {name === 'cirkel' && <circle cx="50" cy="50" r="42" fill="#a855f7" />}
      {name === 'kvadrat' && <rect x="10" y="10" width="80" height="80" rx="14" fill="#3b82f6" />}
      {name === 'triangel' && <polygon points="50,8 92,88 8,88" fill="#22c55e" />}
      {name === 'stjärna' && <polygon points="50,8 61,38 93,38 67,57 77,88 50,70 23,88 33,57 7,38 39,38" fill="#facc15" />}
      {name === 'hjärta' && <path d="M50 88 C 18 66, 6 44, 22 28 C 35 16, 50 26, 50 38 C 50 26, 65 16, 78 28 C 94 44, 82 66, 50 88 Z" fill="#ec4899" />}
    </svg>
  );
}

export default function Niva6() {
  const { speak } = useSpeech();
  const [challenges, setChallenges] = useState<Challenge[]>(buildChallenges);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);
  const [crystalCharge, setCrystalCharge] = useState(0);
  const [hasIntro, setHasIntro] = useState(false);

  const current = challenges[idx];
  const total = challenges.length;

  useEffect(() => {
    if (hasIntro) return;
    const t = setTimeout(() => {
      speak(current.spoken);
      setHasIntro(true);
    }, 350);
    return () => clearTimeout(t);
  }, [current, speak, hasIntro]);

  const next = () => {
    if (idx + 1 >= total) {
      const finalStars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      setStars(finalStars);
      completeLevel(6, finalStars);
      setDone(true);
      return;
    }
    setIdx(i => i + 1);
    setPicked(null);
    setHasIntro(false);
  };

  const handleAnswer = (val: string) => {
    if (picked || done) return;
    if (val === current.answer) {
      setPicked(val);
      hapticNotification('success');
      setCrystalCharge(c => c + 1);
      if (current.kind === 'bokstav') unlockLetter(current.answer);
      if (current.kind === 'siffra') unlockNumber(parseInt(current.answer, 10));
      if (current.kind === 'rakna') unlockNumber(parseInt(current.answer, 10));
      speak('Bra jobbat!');
      setTimeout(() => next(), 1300);
    } else {
      setWrong(val);
      setMistakes(m => m + 1);
      hapticImpact('light');
      speak('Försök igen!');
      setTimeout(() => setWrong(null), 600);
    }
  };

  const replay = () => {
    setChallenges(buildChallenges());
    setIdx(0);
    setMistakes(0);
    setStars(0);
    setDone(false);
    setPicked(null);
    setCrystalCharge(0);
    setHasIntro(false);
  };

  const countingItems = useMemo(() => {
    if (current.kind !== 'rakna') return [];
    return Array.from({ length: current.count }, (_, i) => ({
      id: i,
      x: 8 + ((i * 22) % 80),
      y: 8 + Math.floor(i / 3) * 30 + (Math.random() * 6 - 3),
      delay: i * 0.13,
    }));
  }, [current]);

  const ringColor =
    current.kind === 'siffra' ? 'ring-sky-200' :
    current.kind === 'bokstav' ? 'ring-rose-200' :
    current.kind === 'rakna' ? 'ring-emerald-200' :
    'ring-violet-200';

  return (
    <GameBackground theme={GAME_THEMES.draken} className="pb-12">
      <DrakenHeader title="Drakslottet" emoji="🏰" />

      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className={`flex items-center gap-3 mb-3 bg-white/80 rounded-3xl p-3 shadow-md ring-2 ${ringColor}`}>
          <Glittra size={64} />
          <div className="flex-1">
            <div className="text-sm font-bold text-purple-700/70">
              Nivå 6 · Utmaning {idx + 1}/{total}
            </div>
            <button
              onClick={() => speak(current.spoken)}
              className="text-left text-lg font-black text-purple-900 leading-tight active:scale-95 transition-transform"
            >
              {current.question} 🔊
            </button>
          </div>
        </div>

        {/* Crystal energy bar */}
        <div className="flex items-center justify-center gap-3 mb-4 bg-gradient-to-r from-indigo-100 via-purple-100 to-fuchsia-100 rounded-2xl p-3 ring-2 ring-purple-200">
          <span className="text-3xl">💎</span>
          <div className="flex-1 h-3 rounded-full bg-white/70 overflow-hidden ring-1 ring-purple-200">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 transition-all duration-500"
              style={{ width: `${(crystalCharge / total) * 100}%` }}
            />
          </div>
          <span className="text-xs font-black text-purple-700">{crystalCharge}/{total}</span>
        </div>

        {/* Display area - swap based on challenge type */}
        <div
          className="relative w-full rounded-[36px] bg-gradient-to-b from-fuchsia-200 via-violet-200 to-indigo-300 ring-4 ring-white/70 shadow-xl overflow-hidden mb-4"
          style={{ height: 240 }}
        >
          <span className="absolute text-6xl opacity-30 select-none" style={{ top: 4, left: '50%', transform: 'translateX(-50%)' }}>🏰</span>

          {current.kind === 'rakna' && (
            <div className="absolute inset-0 flex flex-wrap content-start justify-center items-start p-4 gap-3">
              {countingItems.map(it => (
                <span
                  key={it.id}
                  className="text-5xl select-none animate-balloon-float"
                  style={{ animationDelay: `${it.delay}s`, filter: 'drop-shadow(0 4px 8px rgba(168,85,247,0.4))' }}
                >
                  {current.emoji}
                </span>
              ))}
            </div>
          )}
          {current.kind === 'siffra' && (
            <div className="absolute inset-0 flex items-center justify-center text-8xl">{current.emoji}</div>
          )}
          {current.kind === 'bokstav' && (
            <div className="absolute inset-0 flex items-center justify-center text-8xl">🔤</div>
          )}
          {current.kind === 'form' && (
            <div className="absolute inset-0 flex items-center justify-center text-8xl">💎</div>
          )}
        </div>

        {/* Choices */}
        <div className={`grid gap-3 ${current.choices.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
          {current.choices.map(c => {
            const isCorrect = picked === c;
            const isWrong = wrong === c;
            return (
              <button
                key={c}
                onClick={() => handleAnswer(c)}
                disabled={picked !== null}
                className={`py-5 rounded-3xl font-black shadow-lg active:scale-95 transition-all ring-4 ${
                  isCorrect
                    ? 'bg-gradient-to-br from-amber-300 to-pink-400 text-white ring-amber-100 scale-110'
                    : isWrong
                    ? 'bg-red-300 text-red-900 ring-red-100 animate-shake'
                    : 'bg-white text-purple-800 ring-purple-200 hover:ring-purple-300'
                }`}
              >
                {current.kind === 'form' ? (
                  <div className="flex flex-col items-center gap-1">
                    <ShapeIcon name={c} size={42} />
                  </div>
                ) : (
                  <div className="text-4xl">{c}</div>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs font-bold text-purple-900/70 mt-3">
          Klara alla utmaningar och ladda kristallen 💎
        </p>
      </div>

      {done && (
        <LevelComplete
          level={6}
          stars={stars}
          islandName="Drakslottet"
          nextHref={null}
          onReplay={replay}
        />
      )}
    </GameBackground>
  );
}
