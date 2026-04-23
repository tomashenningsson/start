'use client';

import { useState, useEffect, useCallback } from 'react';
import { wordList } from '@/data/words';
import { useSpeech } from '@/hooks/useSpeech';
import { useProgress } from '@/hooks/useProgress';
import { Celebration } from '@/components/Celebration';
import { PageHeader } from '@/components/PageHeader';

const SWEDISH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildAvailable(word: string, level: 1 | 2 | 3) {
  const extraCount = level === 1 ? 0 : level === 2 ? 2 : 4;
  const wordChars = word.split('');
  const extras = shuffle(SWEDISH.split('').filter(c => !wordChars.includes(c))).slice(0, extraCount);
  return shuffle([...wordChars, ...extras]).map((char, id) => ({ char, id, placed: false }));
}

type Level = 1 | 2 | 3;
type AvailLetter = { char: string; id: number; placed: boolean };

export default function OrdPage() {
  const [level, setLevel] = useState<Level>(1);
  const [wordIdx, setWordIdx] = useState(0);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [avail, setAvail] = useState<AvailLetter[]>([]);
  const [celebrating, setCelebrating] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [wrongMsg, setWrongMsg] = useState(false);

  const { speak } = useSpeech();
  const { progress, completeWord } = useProgress();

  const levelWords = wordList.filter(w => w.level === level);
  const current = levelWords[wordIdx % levelWords.length];

  const initWord = useCallback((word: typeof current, lvl: Level) => {
    setSlots(Array(word.word.length).fill(null));
    setAvail(buildAvailable(word.word, lvl));
    setCelebrating(false);
    setShaking(false);
    setWrongMsg(false);
    speak(word.hint);
  }, [speak]);

  useEffect(() => {
    initWord(current, level);
  }, [current, level, initWord]);

  const handleAvailClick = (letter: AvailLetter) => {
    if (letter.placed || celebrating) return;
    const nextEmpty = slots.findIndex(s => s === null);
    if (nextEmpty === -1) return;

    const newSlots = [...slots];
    newSlots[nextEmpty] = `${letter.char}:${letter.id}`;
    setSlots(newSlots);
    setAvail(prev => prev.map(l => l.id === letter.id ? { ...l, placed: true } : l));

    const filled = newSlots.filter(Boolean);
    if (filled.length === current.word.length) {
      const formed = newSlots.map(s => s!.split(':')[0]).join('');
      if (formed === current.word) {
        setCelebrating(true);
        completeWord(current.word);
        speak(`Bra jobbat! ${current.hint}!`);
      } else {
        setShaking(true);
        setWrongMsg(true);
        setTimeout(() => {
          setShaking(false);
          setWrongMsg(false);
          setSlots(Array(current.word.length).fill(null));
          setAvail(prev => prev.map(l => ({ ...l, placed: false })));
        }, 900);
      }
    }
  };

  const handleSlotClick = (idx: number) => {
    const content = slots[idx];
    if (!content || celebrating) return;
    const letterId = parseInt(content.split(':')[1]);
    const newSlots = [...slots];
    newSlots[idx] = null;
    setSlots(newSlots);
    setAvail(prev => prev.map(l => l.id === letterId ? { ...l, placed: false } : l));
  };

  const nextWord = () => {
    setWordIdx(i => i + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 pb-12">
      <PageHeader
        title="Ord"
        emoji="📖"
        rightContent={
          <span className="text-sm font-black text-gray-500 bg-white/80 rounded-full px-3 py-1 ring-1 ring-gray-200">
            ⭐ {progress.completedWords.length} ord
          </span>
        }
      />

      {/* Level tabs */}
      <div className="flex gap-2 justify-center px-4 pt-5">
        {([1, 2, 3] as Level[]).map(l => (
          <button
            key={l}
            onClick={() => { setLevel(l); setWordIdx(0); }}
            className={`px-5 py-2.5 rounded-full font-black text-sm transition-all ${
              level === l
                ? 'bg-green-500 text-white shadow-md scale-105'
                : 'bg-white/80 text-gray-600 hover:bg-white ring-1 ring-gray-200'
            }`}
          >
            {'⭐'.repeat(l)} Nivå {l}
          </button>
        ))}
      </div>

      {/* Word hint */}
      <div className="flex flex-col items-center mt-7 mb-5 px-4 text-center">
        <div className="text-8xl md:text-9xl mb-4 select-none">{current.emoji}</div>
        <p className="text-lg font-bold text-gray-400">Vad heter detta?</p>
        <button
          onClick={() => speak(current.hint)}
          className="mt-1 text-sky-500 font-bold text-sm hover:text-sky-700 transition-colors"
        >
          🔊 Lyssna
        </button>
      </div>

      {/* Letter slots */}
      <div className={`flex justify-center gap-2 px-4 mb-8 ${shaking ? 'animate-shake' : ''}`}>
        {slots.map((slot, i) => {
          const letter = slot ? slot.split(':')[0] : null;
          return (
            <button
              key={i}
              onClick={() => handleSlotClick(i)}
              className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all ${
                letter
                  ? shaking
                    ? 'bg-red-100 border-red-400 text-red-600'
                    : 'bg-green-100 border-green-400 text-green-700 hover:bg-green-200 active:scale-90'
                  : 'bg-white/60 border-dashed border-gray-300 text-gray-300'
              }`}
            >
              {letter ?? ''}
            </button>
          );
        })}
      </div>

      {wrongMsg && (
        <p className="text-center text-red-500 font-black text-lg mb-4 animate-bounce">
          Försök igen! 💪
        </p>
      )}

      {/* Available letters */}
      <div className="flex flex-wrap justify-center gap-3 px-6 max-w-sm md:max-w-md mx-auto">
        {avail.map(letter => (
          <button
            key={letter.id}
            onClick={() => handleAvailClick(letter)}
            disabled={letter.placed}
            className={`w-13 h-13 w-[52px] h-[52px] md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-md transition-all ${
              letter.placed
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed opacity-30 scale-90'
                : 'bg-gradient-to-br from-amber-300 to-orange-400 text-white hover:shadow-lg active:scale-90'
            }`}
          >
            {letter.char}
          </button>
        ))}
      </div>

      {/* Next word button */}
      {celebrating && (
        <div className="flex justify-center mt-10">
          <button
            onClick={nextWord}
            className="px-10 py-4 rounded-3xl bg-green-500 text-white font-black text-xl shadow-lg hover:bg-green-600 active:scale-95 transition-all"
          >
            Nästa ord ➡️
          </button>
        </div>
      )}

      <Celebration active={celebrating} onComplete={() => {}} />
    </div>
  );
}
