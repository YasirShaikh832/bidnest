'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

const PROTECTED_PREFIXES = ['/dashboard', '/create', '/help'];

export function VerifiedGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    if (user.emailVerifiedAt) return;
    const isProtected = PROTECTED_PREFIXES.some((p) => pathname?.startsWith(p));
    if (isProtected) router.replace('/verify-email/');
  }, [user, loading, pathname, router]);

  return <>{children}</>;
}
