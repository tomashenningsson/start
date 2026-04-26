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
    emoji: '🎯',
    title: 'Bokstavsjakt',
    subtitle: 'Gissa bokstaven!',
    from: 'from-pink-400',
    to: 'to-rose-400',
    bg: 'bg-pink-50',
    ring: 'ring-pink-200',
  },
  {
    href: '/siffror',
    emoji: '🔢',
    title: 'Räknaren',
    subtitle: 'Räkna & svara!',
    from: 'from-sky-400',
    to: 'to-cyan-400',
    bg: 'bg-sky-50',
    ring: 'ring-sky-200',
  },
  {
    href: '/ord',
    emoji: '🧩',
    title: 'Ordpusslet',
    subtitle: 'Dra & Stava!',
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
    emoji: '🖊️',
    title: 'Spårskolan',
    subtitle: 'Spåra bokstäver!',
    from: 'from-orange-400',
    to: 'to-amber-400',
    bg: 'bg-orange-50',
    ring: 'ring-orange-200',
  },
  {
    href: '/godis',
    emoji: '🍬',
    title: 'Godisspelet',
    subtitle: 'Matcha siffror!',
    from: 'from-pink-400',
    to: 'to-purple-400',
    bg: 'bg-pink-50',
    ring: 'ring-pink-200',
  },
  {
    href: '/storst',
    emoji: '⚡',
    title: 'Störst!',
    subtitle: 'Vem är störst?',
    from: 'from-indigo-400',
    to: 'to-blue-400',
    bg: 'bg-indigo-50',
    ring: 'ring-indigo-200',
  },
  {
    href: '/zombie-math',
    emoji: '🧟',
    title: 'Zombie Matte',
    subtitle: 'Stoppa zombien!',
    from: 'from-green-700',
    to: 'to-red-700',
    bg: 'bg-gray-900',
    ring: 'ring-red-900',
  },
];

export default function Home() {
  const { progress } = useProgress();
  const { user, configured, signOut } = useKidsAuth();
  const { muted, toggleMute } = useSound();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 pb-8 relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #1e1b4b 0%, #3b0764 16%, #701a75 30%, #831843 46%, #7c2d12 58%, #14532d 73%, #0c4a6e 87%, #1e1b4b 100%)',
      }}
    >
      {/* Aurora glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-30 animate-aurora-1"
          style={{ top: '-15%', right: '-10%', background: 'radial-gradient(circle, #f472b6, transparent 70%)' }} />
        <div className="absolute w-[420px] h-[420px] rounded-full blur-3xl opacity-25 animate-aurora-2"
          style={{ bottom: '5%', left: '-12%', background: 'radial-gradient(circle, #22d3ee, transparent 70%)' }} />
        <div className="absolute w-[360px] h-[360px] rounded-full blur-3xl opacity-20 animate-aurora-3"
          style={{ top: '38%', right: '15%', background: 'radial-gradient(circle, #4ade80, transparent 70%)' }} />
        <div className="absolute w-[300px] h-[300px] rounded-full blur-3xl opacity-25 animate-aurora-1"
          style={{ top: '18%', left: '10%', background: 'radial-gradient(circle, #fb923c, transparent 70%)' }} />
        <div className="absolute w-[380px] h-[380px] rounded-full blur-3xl opacity-20 animate-aurora-2"
          style={{ bottom: '28%', right: '3%', background: 'radial-gradient(circle, #a78bfa, transparent 70%)' }} />
      </div>

      {/* Floating game emojis */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <span className="absolute text-3xl animate-float-1 opacity-50" style={{ top: '7%', left: '4%' }}>🎯</span>
        <span className="absolute text-2xl animate-float-2 opacity-45" style={{ top: '14%', right: '5%' }}>🔢</span>
        <span className="absolute text-2xl animate-float-3 opacity-40" style={{ top: '33%', left: '3%' }}>🧩</span>
        <span className="absolute text-3xl animate-float-1 opacity-45" style={{ top: '52%', right: '4%' }}>🌋</span>
        <span className="absolute text-2xl animate-float-2 opacity-40" style={{ bottom: '32%', left: '6%' }}>🍬</span>
        <span className="absolute text-2xl animate-float-3 opacity-50" style={{ bottom: '22%', right: '7%' }}>⚡</span>
        <span className="absolute text-2xl animate-float-1 opacity-40" style={{ bottom: '12%', left: '9%' }}>🧟</span>
        <span className="absolute text-xl animate-float-2 opacity-35" style={{ top: '68%', right: '12%' }}>🖊️</span>
        <span className="absolute text-lg animate-float-3 opacity-40" style={{ top: '26%', right: '18%' }}>⭐</span>
        <span className="absolute text-base animate-float-1 opacity-35" style={{ top: '44%', left: '14%' }}>✨</span>
        <span className="absolute text-lg animate-float-2 opacity-30" style={{ top: '80%', left: '25%' }}>🌟</span>
        <span className="absolute text-xl animate-float-3 opacity-35" style={{ top: '5%', left: '40%' }}>🎮</span>
      </div>

      {/* Top bar: sound toggle left, auth right — respects iPhone safe area */}
      <div
        className="w-full flex justify-between items-center py-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <button
          onClick={toggleMute}
          className="text-xl bg-white/15 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center ring-1 ring-white/30 shadow-sm hover:bg-white/25 transition-colors"
          title={muted ? 'Sätt på ljud' : 'Stäng av ljud'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
        <div>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white/60 hidden sm:inline truncate max-w-[120px]">
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="text-xs font-black text-white/70 hover:text-white bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 ring-1 ring-white/30 transition-colors"
              >
                Logga ut
              </button>
            </div>
          ) : configured ? (
            <button
              onClick={() => setAuthOpen(true)}
              className="text-sm font-black text-white/80 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 ring-1 ring-white/30 hover:bg-white/25 transition-colors shadow-sm"
            >
              Logga in
            </button>
          ) : <div />}
        </div>
      </div>

      {/* Hero */}
      <div className="text-center mb-10 mt-4">
        <div className="text-7xl mb-3 select-none">🌟</div>
        <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight drop-shadow-lg">
          Lär dig!
        </h1>
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-5 py-2.5 shadow-md ring-1 ring-white/30">
          <span className="text-2xl">⭐</span>
          <span className="text-xl font-black text-amber-300">{progress.totalStars}</span>
          <span className="text-base font-bold text-white/70">stjärnor</span>
          {user && (
            <span className="ml-1 text-xs font-bold text-green-300 bg-green-900/50 rounded-full px-2 py-0.5">
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
            className={`group relative flex flex-col items-center justify-center p-6 md:p-8 rounded-3xl ${a.bg} ring-2 ${a.ring} shadow-md hover:shadow-xl active:scale-95 transition-all duration-200 min-h-[160px] md:min-h-[200px] overflow-hidden outline-none focus:outline-none ${
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
          className="mt-6 text-sm font-bold text-white/50 hover:text-white/80 transition-colors underline underline-offset-2"
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
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center shadow-sm ring-1 ring-white/20">
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      <div className="text-xs font-bold text-white/60 mt-0.5">{label}</div>
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
