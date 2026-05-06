'use client';

import { useEffect, useState } from 'react';
import { GameBackground } from '@/components/GameBackground';
import { GAME_THEMES } from '@/lib/gameThemes';
import { DrakenHeader } from '@/components/draken/DrakenHeader';
import { Glittra } from '@/components/draken/Glittra';
import { LevelComplete } from '@/components/draken/LevelComplete';
import { useSpeech } from '@/hooks/useSpeech';
import { hapticImpact, hapticNotification } from '@/utils/haptics';
import { completeLevel, unlockLetter } from '@/lib/drakenStorage';

interface WordItem {
  word: string;
  emoji: string;
  letter: string;
}

const WORDS: WordItem[] = [
  { word: 'sol', emoji: '☀️', letter: 'S' },
  { word: 'måne', emoji: '🌙', letter: 'M' },
  { word: 'apa', emoji: '🐒', letter: 'A' },
  { word: 'björn', emoji: '🐻', letter: 'B' },
  { word: 'ko', emoji: '🐮', letter: 'K' },
  { word: 'fisk', emoji: '🐟', letter: 'F' },
  { word: 'tiger', emoji: '🐯', letter: 'T' },
  { word: 'ros', emoji: '🌹', letter: 'R' },
  { word: 'lejon', emoji: '🦁', letter: 'L' },
  { word: 'pingvin', emoji: '🐧', letter: 'P' },
  { word: 'gris', emoji: '🐷', letter: 'G' },
  { word: 'orm', emoji: '🐍', letter: 'O' },
  { word: 'näsa', emoji: '👃', letter: 'N' },
  { word: 'igelkott', emoji: '🦔', letter: 'I' },
];

const ROUNDS = 5;

function shuffle<T>(a: T[]): T[] {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

function buildRound(prevWord?: string) {
  const candidates = prevWord ? WORDS.filter(w => w.word !== prevWord) : WORDS;
  const pool = candidates.length > 0 ? candidates : WORDS;
  const target = pool[Math.floor(Math.random() * pool.length)];
  const otherLetters = shuffle(
    Array.from(new Set(WORDS.filter(w => w.letter !== target.letter).map(w => w.letter)))
  ).slice(0, 3);
  const choices = shuffle([target.letter, ...otherLetters]);
  return { target, choices };
}

export default function Niva5() {
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
      speak(`Vilken bokstav börjar ${data.target.word} på?`);
      setHasIntro(true);
    }, 350);
    return () => clearTimeout(t);
  }, [data.target.word, speak, hasIntro]);

  const next = () => {
    if (round + 1 >= ROUNDS) {
      const finalStars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      setStars(finalStars);
      completeLevel(5, finalStars);
      setDone(true);
      return;
    }
    setData(buildRound(data.target.word));
    setPicked(null);
    setRound(r => r + 1);
    setHasIntro(false);
  };

  const handleAnswer = (l: string) => {
    if (picked || done) return;
    if (l === data.target.letter) {
      setPicked(l);
      hapticNotification('success');
      unlockLetter(l);
      setTimeout(() => speak(`Ja! ${l} som i ${data.target.word}!`), 100);
      setTimeout(() => next(), 1700);
    } else {
      setWrong(l);
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
      <DrakenHeader title="Bokstavsberget" emoji="🏔️" />

      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-3 bg-white/70 rounded-3xl p-3 shadow-sm ring-2 ring-amber-200">
          <Glittra size={64} />
          <div className="flex-1">
            <div className="text-sm font-bold text-purple-700/70">Nivå 5 · Runda {round + 1}/{ROUNDS}</div>
            <button
              onClick={() => speak(`Vilken bokstav börjar ${data.target.word} på?`)}
              className="text-left text-xl font-black text-orange-700 active:scale-95 transition-transform"
            >
              Vilken bokstav börjar ordet på? 🔊
            </button>
          </div>
        </div>

        {/* Mountain scene with picture */}
        <div
          className="relative w-full rounded-[36px] bg-gradient-to-b from-amber-100 via-orange-200 to-rose-300 ring-4 ring-white/70 shadow-xl overflow-hidden mb-4"
          style={{ height: 280 }}
        >
          <span className="absolute text-7xl opacity-80 select-none" style={{ top: 0, left: '60%' }}>🏔️</span>
          <span className="absolute text-6xl opacity-70 select-none" style={{ top: 20, left: '5%' }}>⛰️</span>
          <span className="absolute text-3xl opacity-60 select-none animate-float-2" style={{ top: 24, right: 20 }}>☁️</span>

          <button
            onClick={() => speak(data.target.word)}
            className="absolute inset-0 flex flex-col items-center justify-center active:scale-95 transition-transform"
          >
            <div
              className="text-9xl select-none mb-1 animate-balloon-float"
              style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.25))' }}
            >
              {data.target.emoji}
            </div>
            <div className="bg-white/95 rounded-full px-5 py-2 shadow-md ring-2 ring-amber-200 text-2xl font-black text-purple-800">
              {data.target.word} 🔊
            </div>
          </button>
        </div>

        {/* Letter choices */}
        <div className="grid grid-cols-4 gap-3">
          {data.choices.map(l => {
            const isCorrect = picked === l;
            const isWrong = wrong === l;
            return (
              <button
                key={l}
                onClick={() => handleAnswer(l)}
                disabled={picked !== null}
                className={`py-5 rounded-3xl font-black shadow-lg active:scale-95 transition-all ring-4 text-4xl ${
                  isCorrect
                    ? 'bg-gradient-to-br from-amber-300 to-pink-400 text-white ring-amber-100 scale-110'
                    : isWrong
                    ? 'bg-red-300 text-red-900 ring-red-100 animate-shake'
                    : 'bg-white text-orange-700 ring-orange-200 hover:ring-orange-300'
                }`}
              >
                {l}
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs font-bold text-purple-900/70 mt-3">
          Tryck på första bokstaven i ordet ✨
        </p>
      </div>

      {done && (
        <LevelComplete
          level={5}
          stars={stars}
          islandName="Bokstavsberget"
          nextHref="/draken/niva6"
          onReplay={replay}
        />
      )}
    </GameBackground>
  );
}
