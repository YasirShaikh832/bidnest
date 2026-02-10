'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function VerifyEmailPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login/');
      return;
    }
    if (user?.emailVerifiedAt) {
      router.replace('/dashboard/');
    }
  }, [user, authLoading, router]);

  const handleSendCode = async () => {
    setError('');
    setSendLoading(true);
    try {
      await api.users.sendEmailOtp();
      setOtpSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send code');
    } finally {
      setSendLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerifyLoading(true);
    try {
      const updated = await api.users.verifyEmail(otpCode);
      if (updated.emailVerifiedAt) {
        await refreshUser();
        router.replace('/dashboard/');
        return;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid or expired code');
    } finally {
      setVerifyLoading(false);
    }
  };

  if (authLoading || (user && user.emailVerifiedAt)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-100 dark:from-violet-950/40 dark:via-slate-900 dark:to-amber-950/30 p-4">
      <Link href="/" className="mb-6 flex items-center gap-2 text-xl font-bold text-amber-600 dark:text-amber-400">
        <Logo className="h-7 w-7" />
        BidNest
      </Link>
      <Card className="w-full max-w-md border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/60 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Mail className="h-5 w-5 text-amber-400" />
            Verify your email
          </CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            We need to verify your email before you can use BidNest. We&apos;ll send a 6-digit code to <strong>{user.email}</strong>.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-500/20 p-3 text-sm text-rose-400">{error}</div>
          )}
          {!otpSent ? (
            <Button onClick={handleSendCode} disabled={sendLoading} className="w-full bg-amber-500 hover:bg-amber-600">
              {sendLoading ? 'Sending...' : 'Send verification code'}
            </Button>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <Input
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center text-lg tracking-widest"
                maxLength={6}
                autoFocus
              />
              <Button type="submit" disabled={verifyLoading || otpCode.length < 6} className="w-full bg-amber-500 hover:bg-amber-600">
                {verifyLoading ? 'Verifying...' : 'Verify'}
              </Button>
              <button type="button" onClick={handleSendCode} disabled={sendLoading} className="w-full text-sm text-slate-500 hover:text-amber-500">
                Resend code
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
