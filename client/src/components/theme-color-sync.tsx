'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

const VALID_THEMES = ['amber', 'blue', 'green', 'violet', 'rose'];

export function ThemeColorSync() {
  const { user } = useAuth();
  const theme = user?.themeColor && VALID_THEMES.includes(user.themeColor) ? user.themeColor : 'amber';
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  return null;
}
