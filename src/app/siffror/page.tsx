'use client';

import { useState } from 'react';
import { numbers } from '@/data/numbers';
import { useSpeech } from '@/hooks/useSpeech';
import { useProgress } from '@/hooks/useProgress';
import { PageHeader } from '@/components/PageHeader';

const CARD_GRADIENTS = [
  'from-sky-400 to-blue-400',
  'from-cyan-400 to-teal-400',
  'from-blue-400 to-indigo-400',
  'from-indigo-400 to-violet-400',
];

const DOT_COLORS = ['bg-sky-400', 'bg-blue-400', 'bg-cyan-400', 'bg-indigo-400', 'bg-violet-400'];

type NumberData = typeof numbers[number];

export default function SiffrorPage() {
  const [selected, setSelected] = useState<NumberData | null>(null);
  const { speak } = useSpeech();
  const { progress, learnNumber } = useProgress();

  const open = (n: NumberData) => {
    setSelected(n);
    speak(n.word);
  };

  const handleLearn = () => {
    if (!selected) return;
    learnNumber(selected.value);
    speak(`Bra jobbat! Du lärde dig ${selected.word}!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-cyan-50">
      <PageHeader
        title="Siffror"
        emoji="🔢"
        rightContent={
          <span className="text-sm font-black text-gray-500 bg-white/80 rounded-full px-3 py-1 ring-1 ring-gray-200">
            ⭐ {progress.learnedNumbers.length}/21
          </span>
        }
      />

      <div className="p-4 grid grid-cols-4 md:grid-cols-7 gap-3 max-w-2xl mx-auto pb-10">
        {numbers.map((n, i) => {
          const gradient = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
          const learned = progress.learnedNumbers.includes(n.value);
          return (
            <button
              key={n.value}
              onClick={() => open(n)}
              className={`relative aspect-square rounded-2xl bg-gradient-to-br ${gradient} shadow-md hover:shadow-lg active:scale-90 transition-all flex flex-col items-center justify-center text-white select-none`}
            >
              <span className="text-3xl md:text-4xl font-black">{n.value}</span>
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
            <div className="text-[7rem] font-black text-sky-600 leading-none mb-2">
              {selected.value}
            </div>
            <div className="text-3xl font-black text-gray-700 capitalize mb-6">{selected.word}</div>

            {/* Visual dot count */}
            {selected.value > 0 ? (
              <div className="flex flex-wrap justify-center gap-2 mb-7 min-h-[48px]">
                {Array.from({ length: selected.value }, (_, i) => (
                  <div
                    key={i}
                    className={`w-6 h-6 rounded-full ${DOT_COLORS[i % DOT_COLORS.length]}`}
                  />
                ))}
              </div>
            ) : (
              <div className="text-5xl mb-7 select-none">∅</div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => speak(selected.word)}
                className="flex-1 py-3.5 rounded-2xl bg-sky-100 text-sky-700 font-black text-base hover:bg-sky-200 active:scale-95 transition-all"
              >
                🔊 Lyssna
              </button>
              <button
                onClick={handleLearn}
                className={`flex-1 py-3.5 rounded-2xl font-black text-base active:scale-95 transition-all ${
                  progress.learnedNumbers.includes(selected.value)
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                }`}
              >
                {progress.learnedNumbers.includes(selected.value) ? '⭐ Klar!' : '⭐ Lär mig'}
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
