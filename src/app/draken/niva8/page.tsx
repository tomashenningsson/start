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

const ITEM_SETS = [
  ['🌸', '🌻'],
  ['🐝', '🦋'],
  ['🌷', '🌹'],
  ['⭐', '🌙'],
  ['🍎', '🍌'],
  ['🐞', '🐌'],
  ['🌳', '🌴'],
];

const PATTERNS: ('AB' | 'AAB' | 'ABC')[] = ['AB', 'AAB', 'ABC'];
const ROUNDS = 5;

function shuffle<T>(a: T[]): T[] {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

interface Round {
  shown: string[];
  correct: string;
  choices: string[];
  key: string;
}

function makeRound(): Round {
  const pat = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
  let items = ITEM_SETS[Math.floor(Math.random() * ITEM_SETS.length)];
  if (pat === 'ABC') {
    const pool = ['🌸', '🌻', '🌷', '🐝', '🦋', '⭐', '🌙', '🍎', '🍌', '🐞'];
    items = shuffle(pool).slice(0, 3);
  } else {
    items = shuffle(items);
  }

  let shown: string[];
  let correct: string;

  if (pat === 'AB') {
    shown = [items[0], items[1], items[0], items[1], items[0]];
    correct = items[1];
  } else if (pat === 'AAB') {
    shown = [items[0], items[0], items[1], items[0], items[0]];
    correct = items[1];
  } else {
    shown = [items[0], items[1], items[2], items[0], items[1]];
    correct = items[2];
  }

  const allItems = Array.from(new Set([...items, '🌸', '🌻', '🐝', '🦋', '⭐']));
  const distractors = shuffle(allItems.filter(i => i !== correct)).slice(0, 2);
  const choices = shuffle([correct, ...distractors]);

  return { shown, correct, choices, key: `${pat}:${shown.join('')}` };
}

function buildRound(prevKey?: string): Round {
  let r = makeRound();
  for (let i = 0; i < 8 && prevKey && r.key === prevKey; i++) {
    r = makeRound();
  }
  return r;
}

export default function Niva8() {
  const { speak } = useSpeech();
  const [round, setRound] = useState(0);
  const [data, setData] = useState<Round>(buildRound);
  const [picked, setPicked] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);
  const [hasIntro, setHasIntro] = useState(false);

  useEffect(() => {
    if (hasIntro) return;
    const t = setTimeout(() => {
      speak('Vad kommer härnäst i mönstret?');
      setHasIntro(true);
    }, 350);
    return () => clearTimeout(t);
  }, [data, speak, hasIntro]);

  const next = () => {
    if (round + 1 >= ROUNDS) {
      const finalStars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      setStars(finalStars);
      completeLevel(8, finalStars);
      setDone(true);
      return;
    }
    setData(buildRound(data.key));
    setPicked(null);
    setRound(r => r + 1);
    setHasIntro(false);
  };

  const handleAnswer = (item: string) => {
    if (picked || done) return;
    if (item === data.correct) {
      setPicked(item);
      hapticNotification('success');
      speak('Bra jobbat! Det stämmer!');
      setTimeout(() => next(), 1500);
    } else {
      setWrong(item);
      setMistakes(m => m + 1);
      hapticImpact('light');
      speak('Försök igen! Titta på mönstret.');
      setTimeout(() => setWrong(null), 600);
    }
  };

  const replay = () => {
    setData(buildRound());
    setRound(0);
    setMistakes(0);
    setStars(0);
    setDone(false);
    setPicked(null);
    setHasIntro(false);
  };

  return (
    <GameBackground theme={GAME_THEMES.draken} className="pb-12">
      <DrakenHeader title="Mönstergården" emoji="🌻" />

      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-3 bg-white/70 rounded-3xl p-3 shadow-sm ring-2 ring-lime-200">
          <Glittra size={64} />
          <div className="flex-1">
            <div className="text-sm font-bold text-purple-700/70">Nivå 8 · Runda {round + 1}/{ROUNDS}</div>
            <button
              onClick={() => speak('Vad kommer härnäst i mönstret?')}
              className="text-left text-xl font-black text-green-700 active:scale-95 transition-transform"
            >
              Vad kommer härnäst? 🔊
            </button>
          </div>
        </div>

        {/* Pattern row */}
        <div
          className="relative w-full rounded-[36px] bg-gradient-to-b from-lime-100 via-green-100 to-emerald-200 ring-4 ring-white/70 shadow-xl overflow-hidden mb-4 p-4"
          style={{ minHeight: 140 }}
        >
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {data.shown.map((s, i) => (
              <span
                key={i}
                className="text-5xl select-none animate-balloon-float"
                style={{
                  animationDelay: `${i * 0.13}s`,
                  filter: 'drop-shadow(0 4px 8px rgba(34,197,94,0.35))',
                }}
              >
                {s}
              </span>
            ))}
            <div className="w-14 h-14 rounded-2xl bg-white/80 ring-4 ring-dashed ring-purple-300 flex items-center justify-center">
              <span className="text-3xl font-black text-purple-500 animate-wiggle">?</span>
            </div>
          </div>
        </div>

        {/* Choices */}
        <div className="grid grid-cols-3 gap-3">
          {data.choices.map(c => {
            const isCorrect = picked === c;
            const isWrong = wrong === c;
            return (
              <button
                key={c}
                onClick={() => handleAnswer(c)}
                disabled={picked !== null}
                className={`py-5 rounded-3xl bg-white shadow-lg ring-4 active:scale-95 transition-all ${
                  isCorrect
                    ? 'ring-amber-200 scale-110'
                    : isWrong
                    ? 'ring-red-200 animate-shake'
                    : 'ring-green-200 hover:ring-green-300'
                }`}
              >
                <div className="text-5xl">{c}</div>
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs font-bold text-purple-900/70 mt-3">
          Vilket föremål passar i mönstret? 🌸🌻🌸🌻
        </p>
      </div>

      {done && (
        <LevelComplete
          level={8}
          stars={stars}
          islandName="Mönstergården"
          nextHref="/draken/niva9"
          onReplay={replay}
        />
      )}
    </GameBackground>
  );
}
