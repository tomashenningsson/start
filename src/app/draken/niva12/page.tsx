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

interface Pair {
  a: { emoji: string; word: string };
  b: { emoji: string; word: string };
}

const PAIRS: Pair[] = [
  { a: { emoji: '☀️', word: 'sol' }, b: { emoji: '🌙', word: 'måne' } },
  { a: { emoji: '🐘', word: 'stor' }, b: { emoji: '🐭', word: 'liten' } },
  { a: { emoji: '😄', word: 'glad' }, b: { emoji: '😢', word: 'ledsen' } },
  { a: { emoji: '⬆️', word: 'upp' }, b: { emoji: '⬇️', word: 'ner' } },
  { a: { emoji: '🐢', word: 'långsam' }, b: { emoji: '🐇', word: 'snabb' } },
  { a: { emoji: '🌳', word: 'hög' }, b: { emoji: '🌱', word: 'låg' } },
  { a: { emoji: '🔥', word: 'varm' }, b: { emoji: '🧊', word: 'kall' } },
  { a: { emoji: '🌧️', word: 'våt' }, b: { emoji: '🏜️', word: 'torr' } },
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

function buildRound() {
  const pair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
  // Show one side, ask for the opposite
  const showA = Math.random() < 0.5;
  const prompt = showA ? pair.a : pair.b;
  const correct = showA ? pair.b : pair.a;

  // Two distractors from other pairs (any side)
  const otherSides = shuffle(
    PAIRS.flatMap(p => [p.a, p.b]).filter(
      x => x.word !== prompt.word && x.word !== correct.word
    )
  ).slice(0, 2);

  const choices = shuffle([correct, ...otherSides]);
  return { prompt, correct, choices };
}

export default function Niva12() {
  const { speak } = useSpeech();
  const [round, setRound] = useState(0);
  const [data, setData] = useState(buildRound);
  const [picked, setPicked] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);
  const [hasIntro, setHasIntro] = useState(false);

  useEffect(() => {
    if (hasIntro) return;
    const t = setTimeout(() => {
      speak(`Vad är motsatsen till ${data.prompt.word}?`);
      setHasIntro(true);
    }, 350);
    return () => clearTimeout(t);
  }, [data, speak, hasIntro]);

  const next = () => {
    if (round + 1 >= ROUNDS) {
      const finalStars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      setStars(finalStars);
      completeLevel(12, finalStars);
      setDone(true);
      return;
    }
    setData(buildRound());
    setPicked(null);
    setRound(r => r + 1);
    setHasIntro(false);
  };

  const handleAnswer = (word: string) => {
    if (picked || done) return;
    if (word === data.correct.word) {
      setPicked(word);
      hapticNotification('success');
      speak(`Ja! ${data.prompt.word} och ${data.correct.word} är motsatser.`);
      setTimeout(() => next(), 1700);
    } else {
      setWrong(word);
      setMistakes(m => m + 1);
      hapticImpact('light');
      speak('Försök igen!');
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
      <DrakenHeader title="Motsatsbron" emoji="⚖️" />

      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-3 bg-white/70 rounded-3xl p-3 shadow-sm ring-2 ring-fuchsia-200">
          <Glittra size={64} />
          <div className="flex-1">
            <div className="text-sm font-bold text-purple-700/70">Nivå 12 · Runda {round + 1}/{ROUNDS}</div>
            <button
              onClick={() => speak(`Vad är motsatsen till ${data.prompt.word}?`)}
              className="text-left text-xl font-black text-fuchsia-700 active:scale-95 transition-transform"
            >
              Vad är motsatsen till{' '}
              <span className="text-rose-600">{data.prompt.word}</span>? 🔊
            </button>
          </div>
        </div>

        {/* Prompt display */}
        <div
          className="relative w-full rounded-[36px] bg-gradient-to-b from-fuchsia-100 via-rose-100 to-pink-200 ring-4 ring-white/70 shadow-xl overflow-hidden mb-4 flex flex-col items-center justify-center"
          style={{ height: 220 }}
        >
          <button
            onClick={() => speak(data.prompt.word)}
            className="text-9xl select-none animate-balloon-float active:scale-95 transition-transform"
            style={{ filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.18))' }}
          >
            {data.prompt.emoji}
          </button>
          <div className="bg-white/95 rounded-full px-5 py-1.5 shadow-md ring-2 ring-fuchsia-200 text-xl font-black text-purple-800 mt-2">
            {data.prompt.word}
          </div>
        </div>

        {/* Choices */}
        <div className="grid grid-cols-3 gap-3">
          {data.choices.map(c => {
            const isCorrect = picked === c.word;
            const isWrong = wrong === c.word;
            return (
              <button
                key={c.word}
                onClick={() => handleAnswer(c.word)}
                disabled={picked !== null}
                className={`p-3 rounded-3xl bg-white shadow-lg ring-4 active:scale-95 transition-all ${
                  isCorrect
                    ? 'ring-amber-200 scale-110'
                    : isWrong
                    ? 'ring-red-200 animate-shake'
                    : 'ring-fuchsia-200 hover:ring-fuchsia-300'
                }`}
              >
                <div className="text-5xl">{c.emoji}</div>
                <div className="text-xs font-black text-purple-800 mt-1">{c.word}</div>
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs font-bold text-purple-900/70 mt-3">
          Hitta motsatsen — sol/måne, stor/liten, varm/kall ⚖️
        </p>
      </div>

      {done && (
        <LevelComplete
          level={12}
          stars={stars}
          islandName="Motsatsbron"
          nextHref={null}
          onReplay={replay}
        />
      )}
    </GameBackground>
  );
}
