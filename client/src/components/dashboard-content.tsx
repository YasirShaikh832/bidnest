'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Auction } from '@/lib/api';
import { formatPrice, type CurrencyCode } from '@/lib/currency';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/avatar';
import { Gavel, Plus, LogIn, LogOut, Search, SlidersHorizontal, User } from 'lucide-react';
import { Logo } from '@/components/logo';

function formatTimeLeft(expiresAt: string) {
  const d = new Date(expiresAt).getTime() - Date.now();
  if (d <= 0) return 'Ended';
  const h = Math.floor(d / 3600000);
  const m = Math.floor((d % 3600000) / 60000);
  return `${h}h ${m}m`;
}

const SORT_OPTIONS = [
  { value: 'expires', label: 'Ending soon' },
  { value: 'price', label: 'Highest price' },
];

export function DashboardContent() {
  const { user, loading, logout } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);
  const [sort, setSort] = useState('expires');
  const [tagInput, setTagInput] = useState('');

  const allTags = Array.from(
    new Set(auctions.flatMap((a) => a.tags || []))
  ).sort();

  useEffect(() => {
    api.auctions
      .list({ search: search || undefined, tags: tagsFilter.length ? tagsFilter : undefined, sort })
      .then(setAuctions)
      .catch((err) => setError(err.message));
  }, [search, tagsFilter, sort]);

  const addTag = () => {
    const normalized = tagInput.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (normalized && !tagsFilter.includes(normalized)) setTagsFilter([...tagsFilter, normalized]);
    setTagInput('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-slate-100 dark:from-violet-950/40 dark:via-slate-900 dark:to-amber-950/30">
      <header className="sticky top-0 z-10 border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-amber-600 dark:text-amber-400">
            <Logo className="h-7 w-7" />
            BidNest
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/help/" className="rounded-lg px-2 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white">
              Help
            </Link>
            {user ? (
              <React.Fragment>
                <Link href="/dashboard/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white">
                  <Avatar src={user.profileImageUrl} name={user.name} email={user.email} size="sm" />
                  <span className="hidden sm:inline">{user.name || user.email}</span>
                  <User className="h-4 w-4" />
                </Link>
                <Link href="/create/">
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                    <Plus className="mr-1 h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Create Auction</span>
                    <span className="sm:hidden">Create</span>
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={logout} className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <LogOut className="mr-1 h-4 w-4" />
                  Logout
                </Button>
              </React.Fragment>
            ) : (
              <Link href="/login/">
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                  <LogIn className="mr-1 h-4 w-4" />
                  Login
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold text-slate-900 dark:text-white">Active Auctions</h1>

        <Card className="mb-8 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/60 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-200">
              <SlidersHorizontal className="h-5 w-5 text-amber-400" />
              Smart filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4 sm:flex-nowrap">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by title or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/80 pl-10 text-slate-900 dark:text-white placeholder:text-slate-500"
                />
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/80 px-4 py-2 text-slate-800 dark:text-slate-200"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">Tags (lowercase, hyphenated):</span>
              {allTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTagsFilter(tagsFilter.includes(t) ? tagsFilter.filter((x) => x !== t) : [...tagsFilter, t])}
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${tagsFilter.includes(t)
                    ? 'bg-amber-500 text-black'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                >
                  {t}
                </button>
              ))}
              <div className="flex gap-1">
                <Input
                  placeholder="e.g. vintage-camera"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="w-36 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-white"
                />
                <Button type="button" size="sm" variant="outline" onClick={addTag} className="border-slate-600">
                  Add
                </Button>
              </div>
              {tagsFilter.length > 0 && (
                <Button type="button" size="sm" variant="ghost" onClick={() => setTagsFilter([])} className="text-slate-400">
                  Clear tags
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/50 bg-rose-500/10 p-4 text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {auctions.length === 0 && !error ? (
          <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/60">
            <CardContent className="py-16 text-center text-slate-500 dark:text-slate-400">
              No auctions match your filters.
              {user && (
                <Link href="/create/">
                  <Button className="mt-4 bg-amber-500 hover:bg-amber-600">Create the first one</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {auctions.map((auction) => (
              <Link key={auction.id} href={`/auction/?id=${auction.id}`}>
                <Card className="h-full overflow-hidden border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/60 shadow-xl transition-all hover:scale-[1.02] hover:border-amber-500/30 hover:shadow-amber-500/10">
                  <div className="aspect-video overflow-hidden bg-slate-100 dark:bg-slate-900">
                    {auction.imageUrl ? (
                      <img
                        src={auction.imageUrl}
                        alt={auction.title}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400 dark:text-slate-500">
                        <Gavel className="h-12 w-12 opacity-50" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <div className="mb-1 flex items-center gap-2">
                      <Avatar
                        src={auction.user.profileImageUrl}
                        name={auction.user.name}
                        email={auction.user.email}
                        size="sm"
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400">{auction.user.name || auction.user.email}</span>
                    </div>
                    <CardTitle className="line-clamp-2 text-lg text-slate-900 dark:text-white">{auction.title}</CardTitle>
                    {auction.tags && auction.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {auction.tags.slice(0, 3).map((t) => (
                          <span key={t} className="rounded bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-400">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                      {formatPrice(auction.currentPrice, (user?.currencyFormat as CurrencyCode) || 'PKR')}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Ends in {formatTimeLeft(auction.expiresAt)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
