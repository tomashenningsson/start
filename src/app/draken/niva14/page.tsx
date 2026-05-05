'use client';

import { useEffect, useRef, useState } from 'react';
import { GameBackground } from '@/components/GameBackground';
import { GAME_THEMES } from '@/lib/gameThemes';
import { DrakenHeader } from '@/components/draken/DrakenHeader';
import { Glittra } from '@/components/draken/Glittra';
import { LevelComplete } from '@/components/draken/LevelComplete';
import { useSpeech } from '@/hooks/useSpeech';
import { hapticImpact, hapticNotification } from '@/utils/haptics';
import { completeLevel } from '@/lib/drakenStorage';

interface Pad {
  id: number;
  emoji: string;
  label: string;
  color: string;
  freq: number;
  ring: string;
}

const PADS: Pad[] = [
  { id: 0, emoji: '🐶', label: 'Hund',  color: 'from-amber-300 to-orange-500',  freq: 261.63, ring: 'ring-amber-200' },
  { id: 1, emoji: '🐱', label: 'Katt',  color: 'from-pink-300 to-rose-500',     freq: 329.63, ring: 'ring-pink-200' },
  { id: 2, emoji: '🦁', label: 'Lejon', color: 'from-yellow-300 to-amber-600',  freq: 392.00, ring: 'ring-yellow-200' },
  { id: 3, emoji: '🐸', label: 'Groda', color: 'from-emerald-300 to-green-600', freq: 196.00, ring: 'ring-emerald-200' },
];

const ANIMAL_SOUND_TEXT: Record<number, string> = {
  0: 'voff voff',
  1: 'mjau',
  2: 'roar',
  3: 'kvack',
};

const ROUNDS_CONFIG = [2, 3, 3, 4, 4]; // sequence length per round
const ROUNDS = ROUNDS_CONFIG.length;

function makeSequence(len: number): number[] {
  const seq: number[] = [];
  for (let i = 0; i < len; i++) {
    seq.push(Math.floor(Math.random() * PADS.length));
  }
  return seq;
}

function playTone(freq: number) {
  if (typeof window === 'undefined') return;
  try {
    const Ctor = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    if (!Ctor) return;
    const ctx = new Ctor();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    o.start(now);
    o.stop(now + 0.5);
    setTimeout(() => ctx.close(), 600);
  } catch {}
}

export default function Niva14() {
  const { speak } = useSpeech();
  const [round, setRound] = useState(0);
  const [sequence, setSequence] = useState<number[]>(() => makeSequence(ROUNDS_CONFIG[0]));
  const [showing, setShowing] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [progressIdx, setProgressIdx] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'show' | 'play' | 'won'>('intro');
  const seqRef = useRef<number[]>(sequence);
  seqRef.current = sequence;

  useEffect(() => {
    const t = setTimeout(() => {
      speak('Lyssna på rytmen och härma! Tryck när det är din tur.');
      setTimeout(() => playSequence(seqRef.current), 1200);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const playSequence = async (seq: number[]) => {
    setShowing(true);
    setPhase('show');
    setActiveIdx(null);
    for (let i = 0; i < seq.length; i++) {
      await new Promise(r => setTimeout(r, 350));
      const id = seq[i];
      setActiveIdx(id);
      playTone(PADS[id].freq);
      speak(ANIMAL_SOUND_TEXT[id]);
      await new Promise(r => setTimeout(r, 600));
      setActiveIdx(null);
    }
    setShowing(false);
    setProgressIdx(0);
    setPhase('play');
  };

  const handleTap = (id: number) => {
    if (showing || phase !== 'play' || done) return;
    const expected = sequence[progressIdx];
    setActiveIdx(id);
    playTone(PADS[id].freq);
    setTimeout(() => setActiveIdx(null), 250);

    if (id === expected) {
      hapticImpact('light');
      const nextIdx = progressIdx + 1;
      setProgressIdx(nextIdx);
      if (nextIdx >= sequence.length) {
        setPhase('won');
        hapticNotification('success');
        speak('Bra härmat!');
        setTimeout(() => nextRound(), 1100);
      }
    } else {
      setWrong(id);
      setMistakes(m => m + 1);
      hapticImpact('medium');
      speak('Försök igen, lyssna noga!');
      setTimeout(() => {
        setWrong(null);
        setProgressIdx(0);
        playSequence(sequence);
      }, 800);
    }
  };

  const nextRound = () => {
    if (round + 1 >= ROUNDS) {
      const finalStars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      setStars(finalStars);
      completeLevel(14, finalStars);
      setDone(true);
      return;
    }
    const nextLen = ROUNDS_CONFIG[round + 1];
    const nextSeq = makeSequence(nextLen);
    setSequence(nextSeq);
    setRound(r => r + 1);
    setProgressIdx(0);
    setPhase('intro');
  };

  const replay = () => {
    setRound(0);
    setSequence(makeSequence(ROUNDS_CONFIG[0]));
    setProgressIdx(0);
    setMistakes(0);
    setStars(0);
    setDone(false);
    setPhase('intro');
  };

  return (
    <GameBackground theme={GAME_THEMES.draken} className="pb-12">
      <DrakenHeader title="Musikdjungeln" emoji="🎵" />

      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-3 bg-white/70 rounded-3xl p-3 shadow-sm ring-2 ring-emerald-200">
          <Glittra size={64} />
          <div className="flex-1">
            <div className="text-sm font-bold text-purple-700/70">
              Nivå 14 · Runda {round + 1}/{ROUNDS}
            </div>
            <button
              onClick={() => playSequence(sequence)}
              className="text-left text-xl font-black text-emerald-700 active:scale-95 transition-transform"
            >
              {phase === 'show' ? 'Lyssna...' : phase === 'play' ? 'Härma! 🔊' : 'Spela rytmen igen 🔊'}
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-3">
          {sequence.map((_, i) => (
            <span
              key={i}
              className={`inline-block w-3 h-3 rounded-full transition-all ${
                i < progressIdx ? 'bg-amber-400 scale-125' : 'bg-white/60'
              }`}
            />
          ))}
        </div>

        {/* Pads */}
        <div className="grid grid-cols-2 gap-4">
          {PADS.map(pad => {
            const isActive = activeIdx === pad.id;
            const isWrong = wrong === pad.id;
            return (
              <button
                key={pad.id}
                onClick={() => handleTap(pad.id)}
                disabled={showing}
                className={`relative p-6 rounded-3xl bg-gradient-to-br ${pad.color} shadow-xl ring-4 ${
                  pad.ring
                } active:scale-95 transition-all ${isActive ? 'scale-110 brightness-125' : ''} ${
                  isWrong ? 'animate-shake ring-red-300' : ''
                }`}
                aria-label={pad.label}
              >
                <div className="text-6xl">{pad.emoji}</div>
                <div className="text-sm font-black text-white mt-1 drop-shadow">{pad.label}</div>
                {isActive && (
                  <span className="absolute inset-0 rounded-3xl ring-4 ring-white/80 animate-soft-pulse pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs font-bold text-purple-900/70 mt-3">
          Lyssna på djurens ljud och härma rytmen 🎵
        </p>
      </div>

      {done && (
        <LevelComplete
          level={14}
          stars={stars}
          islandName="Musikdjungeln"
          nextHref="/draken/niva15"
          onReplay={replay}
        />
      )}
    </GameBackground>
  );
}
