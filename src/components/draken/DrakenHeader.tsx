'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useSound } from '@/contexts/SoundContext';

interface Props {
  title: string;
  emoji?: string;
  backHref?: string;
  rightContent?: ReactNode;
}

export function DrakenHeader({ title, emoji, backHref = '/draken', rightContent }: Props) {
  const { muted, toggleMute } = useSound();
  return (
    <header
      className="sticky top-0 z-40 flex items-center gap-3 px-4 pb-3 bg-white/40 backdrop-blur-md border-b border-white/40 shadow-sm"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
    >
      <Link
        href={backHref}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-white/80 hover:bg-white active:scale-90 transition-all shadow-sm ring-2 ring-purple-200"
      >
        <ChevronLeft className="w-7 h-7 text-purple-600" />
      </Link>
      <h1 className="flex-1 text-xl font-black text-purple-800 drop-shadow-sm">
        {emoji && <span className="mr-2">{emoji}</span>}
        {title}
      </h1>
      <button
        onClick={toggleMute}
        className="flex items-center justify-center w-11 h-11 rounded-full bg-white/80 hover:bg-white active:scale-90 transition-all text-xl shadow-sm ring-2 ring-purple-200"
        title={muted ? 'Sätt på ljud' : 'Stäng av ljud'}
      >
        {muted ? '🔇' : '🔊'}
      </button>
      {rightContent}
    </header>
  );
}
