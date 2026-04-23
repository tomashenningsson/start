'use client';

import { type ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';

interface ClientLayoutProps {
  children: ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <AuthProvider>
      <ThemeProvider>{children}</ThemeProvider>
      <ServiceWorkerRegister />
    </AuthProvider>
  );
}
