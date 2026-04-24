'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useProgress } from '@/hooks/useProgress';
import { useKidsAuth } from '@/contexts/KidsAuthContext';
import { useSound } from '@/contexts/SoundContext';
import { X, Loader2 } from 'lucide-react';

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
    emoji: '🌋',
    title: 'Lavamonstret',
    subtitle: 'Rädda talen!',
    from: 'from-violet-400',
    to: 'to-purple-400',
    bg: 'bg-violet-50',
    ring: 'ring-violet-200',
  },
  {
    href: '/skriv',
    emoji: '✏️',
    title: 'Skriv',
    subtitle: 'Rita bokstäver',
    from: 'from-orange-400',
    to: 'to-amber-400',
    bg: 'bg-orange-50',
    ring: 'ring-orange-200',
  },
];

export default function Home() {
  const { progress } = useProgress();
  const { user, configured, signOut } = useKidsAuth();
  const { muted, toggleMute } = useSound();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 flex flex-col items-center px-4 py-8 safe-top">
      {/* Top bar: sound toggle left, auth right */}
      <div className="absolute top-4 left-4">
        <button
          onClick={toggleMute}
          className="text-xl bg-white/80 rounded-full w-10 h-10 flex items-center justify-center ring-1 ring-gray-200 shadow-sm hover:bg-white transition-colors"
          title={muted ? 'Sätt på ljud' : 'Stäng av ljud'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
      <div className="absolute top-4 right-4">
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 hidden sm:inline truncate max-w-[120px]">
              {user.email}
            </span>
            <button
              onClick={signOut}
              className="text-xs font-black text-gray-400 hover:text-gray-600 bg-white/80 rounded-full px-3 py-1.5 ring-1 ring-gray-200 transition-colors"
            >
              Logga ut
            </button>
          </div>
        ) : configured ? (
          <button
            onClick={() => setAuthOpen(true)}
            className="text-sm font-black text-gray-500 bg-white/80 rounded-full px-4 py-1.5 ring-1 ring-gray-200 hover:bg-white transition-colors shadow-sm"
          >
            Logga in
          </button>
        ) : null}
      </div>

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
          {user && (
            <span className="ml-1 text-xs font-bold text-green-500 bg-green-50 rounded-full px-2 py-0.5">
              ☁️ synkad
            </span>
          )}
        </div>
      </div>

      {/* Activity cards */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md md:max-w-2xl">
        {activities.map((a, idx) => (
          <Link
            key={a.href}
            href={a.href}
            className={`group relative flex flex-col items-center justify-center p-6 md:p-8 rounded-3xl ${a.bg} ring-2 ${a.ring} shadow-md hover:shadow-xl active:scale-95 transition-all duration-200 min-h-[160px] md:min-h-[200px] overflow-hidden ${
              // Last card spans full width when count is odd
              idx === activities.length - 1 && activities.length % 2 !== 0 ? 'col-span-2' : ''
            }`}
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

      {/* Save progress prompt for guests */}
      {!user && configured && (
        <button
          onClick={() => setAuthOpen(true)}
          className="mt-6 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
        >
          Spara din progress — logga in eller skapa konto
        </button>
      )}

      {/* Auth modal */}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
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

function AuthModal({ onClose }: { onClose: () => void }) {
  const { signIn, signUp } = useKidsAuth();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handle = async () => {
    if (!email || !password) { setError('Fyll i e-post och lösenord'); return; }
    setLoading(true);
    setError('');
    setSuccess('');
    const fn = tab === 'login' ? signIn : signUp;
    const err = await fn(email, password);
    setLoading(false);
    if (err) {
      setError(translateError(err));
    } else if (tab === 'signup') {
      setSuccess('Konto skapat! Kolla din e-post för att bekräfta.');
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-7 max-w-xs w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-gray-800">
            {tab === 'login' ? '👋 Logga in' : '🌟 Skapa konto'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl bg-gray-100 p-1 mb-5">
          {(['login', 'signup'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 rounded-xl text-sm font-black transition-all ${
                tab === t ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'
              }`}
            >
              {t === 'login' ? 'Logga in' : 'Skapa konto'}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className="space-y-3 mb-5">
          <input
            type="email"
            placeholder="E-post"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handle()}
            className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 text-base font-semibold outline-none focus:border-violet-400 transition-colors"
          />
          <input
            type="password"
            placeholder="Lösenord (minst 6 tecken)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handle()}
            className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 text-base font-semibold outline-none focus:border-violet-400 transition-colors"
          />
        </div>

        {error && <p className="text-sm font-bold text-red-500 mb-4 text-center">{error}</p>}
        {success && <p className="text-sm font-bold text-green-500 mb-4 text-center">{success}</p>}

        <button
          onClick={handle}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-black text-base shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {tab === 'login' ? 'Logga in' : 'Skapa konto'}
        </button>

        <p className="mt-4 text-center text-xs font-semibold text-gray-400">
          Din progress sparas automatiskt och följer med på alla enheter.
        </p>
      </div>
    </div>
  );
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Fel e-post eller lösenord';
  if (msg.includes('Email not confirmed')) return 'Bekräfta din e-post först';
  if (msg.includes('User already registered')) return 'Det finns redan ett konto med den e-posten';
  if (msg.includes('Password should be')) return 'Lösenordet måste vara minst 6 tecken';
  if (msg.includes('Unable to validate')) return 'Ogiltig e-postadress';
  return msg;
}
