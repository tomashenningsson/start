'use client';

import { useState, useEffect, useRef } from 'react';
import { numbers } from '@/data/numbers';
import { useSpeech } from '@/hooks/useSpeech';
import { useProgress } from '@/hooks/useProgress';
import { Celebration } from '@/components/Celebration';
import { PageHeader } from '@/components/PageHeader';

const COUNTING_EMOJIS = ['🍎', '⭐', '🐶', '🦋', '🎈', '🌸', '🏀', '🐱', '🐸', '🍪'];
const MAX_VALUE = numbers[numbers.length - 1].value; // 20

function buildChoices(correct: number): number[] {
  const candidates = new Set<number>([correct]);
  for (let offset = 1; candidates.size < 4; offset++) {
    if (correct - offset >= 0) candidates.add(correct - offset);
    if (correct + offset <= MAX_VALUE) candidates.add(correct + offset);
    if (offset > MAX_VALUE) break;
  }
  // Shuffle
  const arr = Array.from(candidates).slice(0, 4);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomEmoji(): string {
  return COUNTING_EMOJIS[Math.floor(Math.random() * COUNTING_EMOJIS.length)];
}

// Returns the first unlearned value in 0..MAX_VALUE, or 0 if all learned.
function firstUnlearned(learnedNumbers: number[]): number {
  const learned = new Set(learnedNumbers);
  for (let i = 0; i <= MAX_VALUE; i++) {
    if (!learned.has(i)) return i;
  }
  return 0;
}

export default function SiffrorPage() {
  const { speak } = useSpeech();
  const { progress, learnNumber } = useProgress();

  const [currentValue, setCurrentValue] = useState(0);
  const [choices, setChoices] = useState(() => buildChoices(0));
  const [emoji, setEmoji] = useState(randomEmoji);
  const [wrong, setWrong] = useState<number | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  // Jump to first unlearned number once progress has loaded (only on mount).
  const initialisedRef = useRef(false);
  useEffect(() => {
    if (initialisedRef.current) return;
    // progress.learnedNumbers is non-empty once real data is present
    if (progress.learnedNumbers.length === 0) return;
    initialisedRef.current = true;
    const start = firstUnlearned(progress.learnedNumbers);
    setCurrentValue(start);
    setChoices(buildChoices(start));
  }, [progress.learnedNumbers]);

  const current = numbers.find(n => n.value === currentValue) ?? numbers[0];

  const goToNext = (fromValue: number) => {
    const next = (fromValue + 1) % (MAX_VALUE + 1);
    setCurrentValue(next);
    setChoices(buildChoices(next));
    setEmoji(randomEmoji());
  };

  const handleAnswer = (num: number) => {
    if (celebrating || wrong !== null) return;
    if (num === current.value) {
      setCelebrating(true);
      learnNumber(current.value);
      setScore(s => s + 1);
      setStreak(s => s + 1);
      speak('Bra jobbat!');
    } else {
      setWrong(num);
      setStreak(0);
      speak('Försök igen!');
      setTimeout(() => setWrong(null), 700);
    }
  };

  const nextQuestion = () => {
    setCelebrating(false);
    goToNext(currentValue);
  };

  const emojiTextSize =
    currentValue > 15 ? 'text-2xl' : currentValue > 10 ? 'text-3xl' : 'text-4xl';
  const emojiGap =
    currentValue > 15 ? 'gap-1' : currentValue > 10 ? 'gap-1.5' : 'gap-2';

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-cyan-50 pb-12">
      <PageHeader
        title="Räknaren"
        emoji="🔢"
        rightContent={
          <span className="text-sm font-black text-gray-500 bg-white/80 rounded-full px-3 py-1 ring-1 ring-gray-200">
            ⭐ {progress.learnedNumbers.length}/21
          </span>
        }
      />

      <div className="flex flex-col items-center px-6 pt-4 gap-5 max-w-sm mx-auto">
        {/* Score row */}
        <div className="flex gap-3">
          <div className="bg-white/80 rounded-2xl px-5 py-2 text-center shadow-sm ring-1 ring-sky-200">
            <div className="text-2xl font-black text-sky-500">{score}</div>
            <div className="text-xs font-bold text-gray-400">poäng</div>
          </div>
          {streak >= 3 && (
            <div className="bg-amber-50 rounded-2xl px-5 py-2 text-center shadow-sm ring-1 ring-amber-200 animate-pulse">
              <div className="text-2xl font-black text-amber-500">{streak} 🔥</div>
              <div className="text-xs font-bold text-gray-400">i rad</div>
            </div>
          )}
        </div>

        {/* Counting display — tappable for audio */}
        <button
          onClick={() => speak(current.word)}
          className="w-full bg-white/80 rounded-3xl p-5 shadow-md ring-2 ring-sky-200 min-h-[150px] flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          {currentValue === 0 ? (
            <div className="flex flex-col items-center gap-1">
              <div className="text-5xl text-gray-300 select-none">∅</div>
              <div className="text-lg font-black text-gray-400">ingenting</div>
            </div>
          ) : (
            <div className={`flex flex-wrap justify-center ${emojiGap}`}>
              {Array.from({ length: currentValue }, (_, i) => (
                <span key={i} className={`${emojiTextSize} select-none leading-tight`}>
                  {emoji}
                </span>
              ))}
            </div>
          )}
          <div className="text-sm font-bold text-sky-400 mt-1">🔊 Lyssna</div>
        </button>

        {/* Question */}
        <p className="text-xl font-black text-gray-600 text-center">
          Hur många {emoji} ser du?
        </p>

        {/* 4 choice buttons */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {choices.map(num => {
            const isWrong = wrong === num;
            const isCorrect = celebrating && num === current.value;
            const numData = numbers.find(n => n.value === num);
            return (
              <button
                key={num}
                onClick={() => handleAnswer(num)}
                className={`py-3.5 rounded-3xl font-black shadow-md transition-all active:scale-95 ${
                  isCorrect
                    ? 'bg-green-400 text-white scale-105 shadow-lg shadow-green-200'
                    : isWrong
                    ? 'bg-red-400 text-white animate-shake'
                    : 'bg-white text-gray-700 ring-2 ring-sky-200 hover:ring-sky-400 hover:shadow-lg'
                }`}
              >
                <div className="text-3xl">{num}</div>
                <div className="text-xs font-bold opacity-50 mt-0.5">{numData?.word}</div>
              </button>
            );
          })}
        </div>

        {/* Next button */}
        {celebrating && (
          <button
            onClick={nextQuestion}
            className="w-full py-4 rounded-3xl bg-gradient-to-r from-sky-400 to-cyan-400 text-white font-black text-xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
          >
            Nästa siffra ➡️
          </button>
        )}
      </div>

      <Celebration active={celebrating} onComplete={() => {}} />
    </div>
  );
}
