'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Gavel, Zap, Shield, Smartphone } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function LandingPage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="flex items-center gap-2 text-xl font-bold text-amber-600 dark:text-amber-400">
            <Logo className="h-7 w-7" />
            BidNest
          </span>
          <nav className="flex items-center gap-3">
            {!loading && (
              user ? (
                <>
                  <Link href="/auctions/">
                    <Button variant="outline" size="sm">Browse Auctions</Button>
                  </Link>
                  <Link href="/dashboard/">
                    <Button size="sm" className="bg-amber-500 hover:bg-amber-600">Dashboard</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login/">
                    <Button variant="outline" size="sm">Log in</Button>
                  </Link>
                  <Link href="/signup/">
                    <Button size="sm" className="bg-amber-500 hover:bg-amber-600">Get started</Button>
                  </Link>
                </>
              )
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl">
          Real-time auctions.
          <br />
          <span className="text-amber-600 dark:text-amber-400">Bid live.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          Create listings, place bids, and see updates instantly. No refresh. No hassle.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href={user ? '/auctions/' : '/signup/'}>
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-lg px-8">
              {user ? 'Browse Auctions' : 'Create free account'}
            </Button>
          </Link>
          {!user && (
            <Link href="/auctions/">
              <Button size="lg" variant="outline">View auctions</Button>
            </Link>
          )}
        </div>

        <div className="mt-24 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 text-left shadow-sm">
            <Zap className="h-10 w-10 text-amber-500 dark:text-amber-400" />
            <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">Live updates</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Bids appear instantly for everyone. No refresh needed.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 text-left shadow-sm">
            <Shield className="h-10 w-10 text-amber-500 dark:text-amber-400" />
            <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">Secure</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">JWT auth and validated bids. Only higher bids win.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 text-left shadow-sm">
            <Smartphone className="h-10 w-10 text-amber-500 dark:text-amber-400" />
            <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">PWA ready</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Install on phone or desktop. Works offline-capable.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 text-left shadow-sm">
            <Gavel className="h-10 w-10 text-amber-500 dark:text-amber-400" />
            <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">Simple</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Create an auction in seconds. Tags and filters to find what you want.</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 py-6">
        <div className="mx-auto max-w-6xl px-4 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
          <Link href="/terms/" className="hover:text-amber-600 dark:hover:text-amber-400 underline">Terms and Conditions</Link>
        </div>
      </footer>
    </div>
  );
}
