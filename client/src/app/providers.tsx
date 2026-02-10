'use client';

import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/contexts/theme-context';
import { VerifiedGuard } from '@/components/verified-guard';
import { ThemeColorSync } from '@/components/theme-color-sync';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemeColorSync />
        <VerifiedGuard>{children}</VerifiedGuard>
      </AuthProvider>
    </ThemeProvider>
  );
}
