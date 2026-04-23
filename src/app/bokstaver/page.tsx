'use client';

import { useState } from 'react';
import { letters } from '@/data/letters';
import { useSpeech } from '@/hooks/useSpeech';
import { useProgress } from '@/hooks/useProgress';
import { PageHeader } from '@/components/PageHeader';

const CARD_GRADIENTS = [
  'from-pink-400 to-rose-400',
  'from-orange-400 to-amber-400',
  'from-yellow-400 to-lime-400',
  'from-green-400 to-emerald-400',
  'from-teal-400 to-cyan-400',
  'from-sky-400 to-blue-400',
  'from-violet-400 to-purple-400',
];

type LetterData = typeof letters[number];

export default function BokstaverPage() {
  const [selected, setSelected] = useState<LetterData | null>(null);
  const { speak } = useSpeech();
  const { progress, learnLetter } = useProgress();

  const open = (l: LetterData) => {
    setSelected(l);
    speak(`${l.letter} som i ${l.example}`);
  };

  const handleLearn = () => {
    if (!selected) return;
    learnLetter(selected.letter);
    speak(`Bra jobbat! Du lärde dig ${selected.letter} som i ${selected.example}!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50">
      <PageHeader
        title="Bokstäver"
        emoji="🔤"
        rightContent={
          <span className="text-sm font-black text-gray-500 bg-white/80 rounded-full px-3 py-1 ring-1 ring-gray-200">
            ⭐ {progress.learnedLetters.length}/29
          </span>
        }
      />

      <div className="p-4 grid grid-cols-5 md:grid-cols-7 gap-3 max-w-2xl mx-auto pb-10">
        {letters.map((l, i) => {
          const gradient = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
          const learned = progress.learnedLetters.includes(l.letter);
          return (
            <button
              key={l.letter}
              onClick={() => open(l)}
              className={`relative aspect-square rounded-2xl bg-gradient-to-br ${gradient} shadow-md hover:shadow-lg active:scale-90 transition-all flex items-center justify-center text-white font-black text-2xl md:text-3xl select-none`}
            >
              {l.letter}
              {learned && (
                <span className="absolute top-0.5 right-0.5 text-sm leading-none">⭐</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Detail overlay */}
      {selected && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-xs w-full shadow-2xl text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-[7rem] font-black text-gray-800 leading-none">{selected.letter}</div>
            <div className="text-4xl font-bold text-gray-300 mb-6">{selected.lower}</div>
            <div className="text-7xl mb-2 select-none">{selected.emoji}</div>
            <div className="text-2xl font-black text-gray-700 mb-7">{selected.example}</div>

            <div className="flex gap-3">
              <button
                onClick={() => speak(`${selected.letter} som i ${selected.example}`)}
                className="flex-1 py-3.5 rounded-2xl bg-sky-100 text-sky-700 font-black text-base hover:bg-sky-200 active:scale-95 transition-all"
              >
                🔊 Lyssna
              </button>
              <button
                onClick={handleLearn}
                className={`flex-1 py-3.5 rounded-2xl font-black text-base active:scale-95 transition-all ${
                  progress.learnedLetters.includes(selected.letter)
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                }`}
              >
                {progress.learnedLetters.includes(selected.letter) ? '⭐ Klar!' : '⭐ Lär mig'}
              </button>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="mt-5 text-gray-400 hover:text-gray-600 text-sm font-bold"
            >
              Stäng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
