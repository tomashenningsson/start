'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { profile, updateProfile } = useAuth();
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from profile or localStorage
  useEffect(() => {
    setMounted(true);

    if (profile?.theme_preference) {
      setThemeState(profile.theme_preference);
    } else {
      // Fallback to localStorage or system preference
      const stored = localStorage.getItem('theme') as Theme | null;
      if (stored) {
        setThemeState(stored);
      } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        setThemeState('light');
      }
    }
  }, [profile?.theme_preference]);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    // Store in localStorage as fallback
    localStorage.setItem('theme', theme);

    // Update mobile status bar color if Capacitor is available
    updateStatusBar(theme);
  }, [theme, mounted]);

  const setTheme = useCallback(
    async (newTheme: Theme) => {
      setThemeState(newTheme);

      // Persist to profile if logged in
      if (profile) {
        await updateProfile({ theme_preference: newTheme });
      }
    },
    [profile, updateProfile]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
  };

  // Prevent flash of wrong theme
  if (!mounted) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Update mobile status bar color
async function updateStatusBar(theme: Theme) {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;

    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({
      style: theme === 'dark' ? Style.Dark : Style.Light,
    });
    await StatusBar.setBackgroundColor({
      color: theme === 'dark' ? '#000000' : '#ffffff',
    });
  } catch {
    // Capacitor not available or not on native platform
  }
}
