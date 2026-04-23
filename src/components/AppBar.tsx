'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { AuthDialog } from './AuthDialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, Sun, Moon } from 'lucide-react';
import { getInitials } from '@/utils';

interface AppBarProps {
  onMenuClick?: () => void;
}

export function AppBar({ onMenuClick }: AppBarProps) {
  const { user, profile, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border safe-top">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={onMenuClick}
                className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <span className="text-lg font-semibold tracking-tight">App</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {!loading && (
              <>
                {user ? (
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs font-medium bg-secondary">
                      {getInitials(profile)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Button
                    onClick={() => setAuthDialogOpen(true)}
                    className="h-9 rounded-full px-4 text-sm"
                  >
                    Sign in
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </>
  );
}
