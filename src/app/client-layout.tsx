'use client';

import type { ReactNode } from 'react';
import { KidsAuthProvider } from '@/contexts/KidsAuthContext';
import { ProgressProvider } from '@/contexts/ProgressContext';

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <KidsAuthProvider>
      <ProgressProvider>{children}</ProgressProvider>
    </KidsAuthProvider>
  );
}
