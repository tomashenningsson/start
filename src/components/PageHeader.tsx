'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  emoji?: string;
  backHref?: string;
  rightContent?: ReactNode;
}

export function PageHeader({ title, emoji, backHref = '/', rightContent }: Props) {
  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 px-4 pb-3 bg-white/90 backdrop-blur-sm border-b border-white/60 shadow-sm" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}>
      <Link
        href={backHref}
        className="flex items-center justify-center w-11 h-11 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-90 transition-all"
      >
        <ChevronLeft className="w-6 h-6 text-gray-600" />
      </Link>
      <h1 className="flex-1 text-xl font-black text-gray-800">
        {emoji && <span className="mr-2">{emoji}</span>}
        {title}
      </h1>
      {rightContent}
    </header>
  );
}
