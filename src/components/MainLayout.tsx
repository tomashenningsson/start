'use client';

import { useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppBar } from './AppBar';
import { SidebarMenu } from './SidebarMenu';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppBar onMenuClick={() => setSidebarOpen(true)} />

      {user && (
        <SidebarMenu open={sidebarOpen} onOpenChange={setSidebarOpen} />
      )}

      <main
        className={`pt-14 min-h-screen ${user ? 'md:pl-64' : ''}`}
      >
        {loading ? (
          <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
            <div className="h-8 w-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
