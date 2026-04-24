'use client';

import { useState } from 'react';
import { letters } from '@/data/letters';
import { useSpeech } from '@/hooks/useSpeech';
import { useProgress } from '@/hooks/useProgress';
import { Celebration } from '@/components/Celebration';
import { PageHeader } from '@/components/PageHeader';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ALL_LETTERS = letters.map(l => l.letter);

function buildChoices(correct: string): string[] {
  const others = shuffle(ALL_LETTERS.filter(l => l !== correct)).slice(0, 3);
  return shuffle([correct, ...others]);
}

function initState() {
  const queue = shuffle([...letters]);
  return { queue, idx: 0, choices: buildChoices(queue[0].letter) };
}

export default function BokstaverPage() {
  const { speak } = useSpeech();
  const { progress, learnLetter } = useProgress();

  const [{ queue, idx, choices }, setState] = useState(initState);
  const [wrong, setWrong] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const current = queue[idx];

  const handleAnswer = (letter: string) => {
    if (celebrating || wrong !== null) return;
    if (letter === current.letter) {
      setCelebrating(true);
      learnLetter(current.letter);
      setScore(s => s + 1);
      setStreak(s => s + 1);
      speak('Bra jobbat!');
    } else {
      setWrong(letter);
      setStreak(0);
      speak('Försök igen!');
      setTimeout(() => setWrong(null), 700);
    }
  };

  const nextQuestion = () => {
    setCelebrating(false);
    setState(prev => {
      const nextIdx = prev.idx + 1;
      if (nextIdx >= prev.queue.length) {
        const newQueue = shuffle([...letters]);
        return { queue: newQueue, idx: 0, choices: buildChoices(newQueue[0].letter) };
      }
      return { ...prev, idx: nextIdx, choices: buildChoices(prev.queue[nextIdx].letter) };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 pb-12">
      <PageHeader
        title="Bokstavsjakt"
        emoji="🎯"
        rightContent={
          <span className="text-sm font-black text-gray-500 bg-white/80 rounded-full px-3 py-1 ring-1 ring-gray-200">
            ⭐ {progress.learnedLetters.length}/29
          </span>
        }
      />

      <div className="flex flex-col items-center px-6 pt-4 gap-5 max-w-sm mx-auto">
        {/* Score row */}
        <div className="flex gap-3">
          <div className="bg-white/80 rounded-2xl px-5 py-2 text-center shadow-sm ring-1 ring-pink-200">
            <div className="text-2xl font-black text-pink-500">{score}</div>
            <div className="text-xs font-bold text-gray-400">poäng</div>
          </div>
          {streak >= 3 && (
            <div className="bg-amber-50 rounded-2xl px-5 py-2 text-center shadow-sm ring-1 ring-amber-200 animate-pulse">
              <div className="text-2xl font-black text-amber-500">{streak} 🔥</div>
              <div className="text-xs font-bold text-gray-400">i rad</div>
            </div>
          )}
        </div>

        {/* Emoji + word — tappable for audio */}
        <button
          onClick={() => speak(`${current.letter} som i ${current.example}`)}
          className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
        >
          <div className="text-[8rem] select-none leading-none">{current.emoji}</div>
          <div className="text-3xl font-black text-gray-700 mt-2">{current.example}</div>
          <div className="text-sm font-bold text-sky-400 mt-0.5">🔊 Tryck för att lyssna</div>
        </button>

        {/* Question */}
        <p className="text-xl font-black text-gray-600 text-center">
          Vilken bokstav börjar{' '}
          <span className="text-pink-500">{current.example}</span> med?
        </p>

        {/* 4 choice buttons */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {choices.map(letter => {
            const isWrong = wrong === letter;
            const isCorrect = celebrating && letter === current.letter;
            return (
              <button
                key={letter}
                onClick={() => handleAnswer(letter)}
                className={`py-5 rounded-3xl font-black shadow-md transition-all active:scale-95 ${
                  isCorrect
                    ? 'bg-green-400 text-white scale-105 shadow-lg shadow-green-200'
                    : isWrong
                    ? 'bg-red-400 text-white animate-shake'
                    : 'bg-white text-gray-700 ring-2 ring-pink-200 hover:ring-pink-400 hover:shadow-lg'
                }`}
              >
                <div className="text-4xl">{letter}</div>
                <div className="text-sm font-bold opacity-50 mt-1">
                  {letters.find(l => l.letter === letter)?.lower}
                </div>
              </button>
            );
          })}
        </div>

        {/* Next button */}
        {celebrating && (
          <button
            onClick={nextQuestion}
            className="w-full py-4 rounded-3xl bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black text-xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
          >
            Nästa bokstav ➡️
          </button>
        )}
      </div>

      <Celebration active={celebrating} onComplete={() => {}} />
    </div>
  );
}
