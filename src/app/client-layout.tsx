'use client';

import type { ReactNode } from 'react';
import { KidsAuthProvider } from '@/contexts/KidsAuthContext';
import { ProgressProvider } from '@/contexts/ProgressContext';
import { SoundProvider } from '@/contexts/SoundContext';

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <SoundProvider>
      <KidsAuthProvider>
        <ProgressProvider>{children}</ProgressProvider>
      </KidsAuthProvider>
    </SoundProvider>
  );
}
