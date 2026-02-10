'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type ThemeContextType = {
  dark: boolean;
  setDark: (v: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDarkState] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('bidnest_dark');
    if (stored !== null) {
      setDarkState(stored === '1');
    } else {
      const defaultTheme = (process.env.NEXT_PUBLIC_DEFAULT_THEME || '').toLowerCase();
      if (defaultTheme === 'dark') setDarkState(true);
      else if (defaultTheme === 'light') setDarkState(false);
      else if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) setDarkState(true);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('bidnest_dark', '1');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('bidnest_dark', '0');
    }
  }, [dark, mounted]);

  const setDark = (v: boolean) => {
    setDarkState(v);
    const token = typeof window !== 'undefined' ? localStorage.getItem('bidnest_token') : null;
    if (token) api.users.updateMe({ darkMode: v }).catch(() => { });
  };

  return (
    <ThemeContext.Provider value={{ dark, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
