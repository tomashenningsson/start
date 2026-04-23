'use client';

import Link from 'next/link';
import { useProgress } from '@/hooks/useProgress';

const activities = [
  {
    href: '/bokstaver',
    emoji: '🔤',
    title: 'Bokstäver',
    subtitle: 'A · B · C',
    from: 'from-pink-400',
    to: 'to-rose-400',
    bg: 'bg-pink-50',
    ring: 'ring-pink-200',
  },
  {
    href: '/siffror',
    emoji: '🔢',
    title: 'Siffror',
    subtitle: '1 · 2 · 3',
    from: 'from-sky-400',
    to: 'to-cyan-400',
    bg: 'bg-sky-50',
    ring: 'ring-sky-200',
  },
  {
    href: '/ord',
    emoji: '📖',
    title: 'Ord',
    subtitle: 'Stava ord',
    from: 'from-green-400',
    to: 'to-emerald-400',
    bg: 'bg-green-50',
    ring: 'ring-green-200',
  },
  {
    href: '/matte',
    emoji: '➕',
    title: 'Matte',
    subtitle: '1 + 2 = ?',
    from: 'from-violet-400',
    to: 'to-purple-400',
    bg: 'bg-violet-50',
    ring: 'ring-violet-200',
  },
];

export default function Home() {
  const { progress } = useProgress();

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 flex flex-col items-center px-4 py-8 safe-top">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="text-7xl mb-3 select-none">🌟</div>
        <h1 className="text-5xl md:text-6xl font-black text-gray-800 mb-4 tracking-tight">
          Lär dig!
        </h1>
        <div className="inline-flex items-center gap-2 bg-white/80 rounded-full px-5 py-2.5 shadow-md ring-1 ring-amber-200">
          <span className="text-2xl">⭐</span>
          <span className="text-xl font-black text-amber-600">{progress.totalStars}</span>
          <span className="text-base font-bold text-gray-500">stjärnor</span>
        </div>
      </div>

      {/* Activity cards */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md md:max-w-2xl">
        {activities.map(a => (
          <Link
            key={a.href}
            href={a.href}
            className={`group relative flex flex-col items-center justify-center p-6 md:p-8 rounded-3xl ${a.bg} ring-2 ${a.ring} shadow-md hover:shadow-xl active:scale-95 transition-all duration-200 min-h-[160px] md:min-h-[200px] overflow-hidden`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${a.from} ${a.to} opacity-10 group-hover:opacity-20 transition-opacity`}
            />
            <div className="text-5xl md:text-6xl mb-3 select-none">{a.emoji}</div>
            <div className="text-2xl md:text-3xl font-black text-gray-800">{a.title}</div>
            <div className="text-sm md:text-base font-semibold text-gray-400 mt-1">{a.subtitle}</div>
          </Link>
        ))}
      </div>

      {/* Progress stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-md md:max-w-2xl">
        <Stat label="Bokstäver" value={`${progress.learnedLetters.length}/29`} color="text-rose-500" />
        <Stat label="Siffror" value={`${progress.learnedNumbers.length}/21`} color="text-sky-500" />
        <Stat label="Ord klara" value={String(progress.completedWords.length)} color="text-green-500" />
        <Stat label="Matte rekord" value={String(progress.mathHighScore)} color="text-violet-500" />
      </div>
    </main>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white/80 rounded-2xl p-3 text-center shadow-sm ring-1 ring-gray-100">
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      <div className="text-xs font-bold text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}
