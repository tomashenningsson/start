'use client';

import { useState, useEffect, useRef } from 'react';
import { numbers } from '@/data/numbers';
import { useSpeech } from '@/hooks/useSpeech';
import { useProgress } from '@/hooks/useProgress';
import { Celebration } from '@/components/Celebration';
import { PageHeader } from '@/components/PageHeader';

const COUNTING_EMOJIS = ['🍎', '⭐', '🐶', '🦋', '🎈', '🌸', '🏀', '🐱', '🐸', '🍪'];
const MAX_VALUE = numbers[numbers.length - 1].value; // 20
const INITIAL_MAX = 4;    // start with 0–4
const UNLOCK_EVERY = 3;   // correct answers needed to unlock next number

function buildChoices(correct: number): number[] {
  const candidates = new Set<number>([correct]);
  for (let offset = 1; candidates.size < 4; offset++) {
    if (correct - offset >= 0) candidates.add(correct - offset);
    if (correct + offset <= MAX_VALUE) candidates.add(correct + offset);
    if (offset > MAX_VALUE) break;
  }
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

// Pick a random number from 0..max, avoiding `exclude` if possible.
function pickRandom(max: number, exclude: number): number {
  if (max === 0) return 0;
  const candidates = Array.from({ length: max + 1 }, (_, i) => i).filter(n => n !== exclude);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// Derive a sensible starting pool ceiling from saved progress.
function initialMax(learnedNumbers: number[]): number {
  return Math.min(MAX_VALUE, Math.max(INITIAL_MAX, learnedNumbers.length));
}

export default function SiffrorPage() {
  const { speak } = useSpeech();
  const { progress, learnNumber } = useProgress();

  const [unlockedMax, setUnlockedMax] = useState(INITIAL_MAX);
  const [correctSinceUnlock, setCorrectSinceUnlock] = useState(0);
  const [currentValue, setCurrentValue] = useState(() =>
    Math.floor(Math.random() * (INITIAL_MAX + 1))
  );
  const [choices, setChoices] = useState(() => buildChoices(0));
  const [emoji, setEmoji] = useState(randomEmoji);
  const [wrong, setWrong] = useState<number | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  // Adjust starting pool once saved progress has loaded (run once only).
  const initialisedRef = useRef(false);
  useEffect(() => {
    if (initialisedRef.current || progress.learnedNumbers.length === 0) return;
    initialisedRef.current = true;
    const max = initialMax(progress.learnedNumbers);
    const start = pickRandom(max, -1);
    setUnlockedMax(max);
    setCurrentValue(start);
    setChoices(buildChoices(start));
  }, [progress.learnedNumbers]);

  const current = numbers.find(n => n.value === currentValue) ?? numbers[0];

  const handleAnswer = (num: number) => {
    if (celebrating || wrong !== null) return;
    if (num === current.value) {
      setCelebrating(true);
      learnNumber(current.value);
      setScore(s => s + 1);
      setStreak(s => s + 1);
      speak('Bra jobbat!');
      // Unlock next number after UNLOCK_EVERY correct answers.
      setCorrectSinceUnlock(prev => {
        const next = prev + 1;
        if (next >= UNLOCK_EVERY && unlockedMax < MAX_VALUE) {
          setUnlockedMax(m => m + 1);
          return 0;
        }
        return next;
      });
    } else {
      setWrong(num);
      setStreak(0);
      speak('Försök igen!');
      setTimeout(() => setWrong(null), 700);
    }
  };

  const nextQuestion = () => {
    setCelebrating(false);
    // unlockedMax is already updated (re-render happened between correct click and Nästa click)
    const next = pickRandom(unlockedMax, currentValue);
    setCurrentValue(next);
    setChoices(buildChoices(next));
    setEmoji(randomEmoji());
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
