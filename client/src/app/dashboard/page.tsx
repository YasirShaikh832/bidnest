'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { api, type UserProfile } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { formatPrice, type CurrencyCode } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar } from '@/components/avatar';
import { TrendingUp, Award, Megaphone, Moon, Sun, Save, Upload } from 'lucide-react';
import { Logo } from '@/components/logo';

const THEME_COLORS = ['amber', 'blue', 'green', 'violet', 'rose'] as const;
const CURRENCIES: { value: CurrencyCode; label: string }[] = [
  { value: 'PKR', label: 'PKR' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
];

export default function DashboardPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { dark, setDark } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    api.users
      .me()
      .then((p) => {
        setProfile(p);
        setEditName(p.name ?? '');
      })
      .catch(() => setLoading(false))
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await api.users.updateMe({ name: editName || undefined });
      setProfile((p) => (p ? { ...p, name: editName || null } : null));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarLoading(true);
    try {
      const updated = await api.users.uploadAvatar(file);
      setProfile((p) => (p ? { ...p, profileImageUrl: updated.profileImageUrl ?? null } : null));
      await refreshUser();
    } finally {
      setAvatarLoading(false);
      e.target.value = '';
    }
  };

  const handleThemeColor = async (themeColor: string) => {
    if (!user) return;
    try {
      await api.users.updateMe({ themeColor });
      setProfile((p) => (p ? { ...p, themeColor } : null));
      await refreshUser();
    } catch {
      // ignore
    }
  };

  const handleCurrencyFormat = async (currencyFormat: CurrencyCode) => {
    if (!user) return;
    try {
      await api.users.updateMe({ currencyFormat });
      setProfile((p) => (p ? { ...p, currencyFormat } : null));
      await refreshUser();
    } catch {
      // ignore
    }
  };

  const handleEmailAlertsToggle = async (enabled: boolean) => {
    try {
      await api.users.updateMe({ emailAlerts: enabled });
      setProfile((p) => (p ? { ...p, emailAlerts: enabled } : null));
    } catch {
      // ignore
    }
  };

  if (authLoading || !user) {
    if (!user && !authLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <Card className="border-amber-500/30 bg-white dark:bg-slate-900/90 shadow-xl">
            <CardContent className="py-8 text-center">
              <p className="mb-4 text-slate-600 dark:text-slate-300">You must be logged in to view your dashboard.</p>
              <Link href="/login/">
                <Button className="bg-amber-500 hover:bg-amber-600">Log in</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      );
    }
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  const stats = profile?.stats;
  const currency = (profile?.currencyFormat || 'PKR') as CurrencyCode;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-amber-600 dark:text-amber-400">
            <Logo className="h-7 w-7" />
            BidNest
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/auctions/">
              <Button variant="outline" size="sm" className="border-slate-600 text-slate-200 hover:bg-slate-800">
                Browse
              </Button>
            </Link>
            <Link href="/dashboard/">
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600">Dashboard</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-slate-900 dark:text-white">Account Dashboard</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-xl">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                <CardTitle className="flex flex-wrap items-center gap-4 text-slate-900 dark:text-slate-100">
                  <div className="relative">
                    <Avatar
                      src={profile?.profileImageUrl ?? null}
                      name={profile?.name ?? undefined}
                      email={profile?.email}
                      size="lg"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      onChange={handleAvatarChange}
                      disabled={avatarLoading}
                    />
                    {avatarLoading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg text-slate-900 dark:text-white">{profile?.name || 'No name set'}</p>
                    <p className="text-sm font-normal text-slate-500 dark:text-slate-400">{profile?.email}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 border-slate-400 text-slate-600 dark:text-slate-300"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarLoading}
                    >
                      <Upload className="mr-1 h-4 w-4" />
                      {avatarLoading ? 'Uploading...' : 'Upload photo'}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Display name</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    placeholder="Your name"
                  />
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save profile'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Megaphone className="h-5 w-5 text-amber-400" />
                  Your stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-slate-100 dark:bg-slate-900/80 p-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Bids placed</p>
                    <p className="text-2xl font-bold text-amber-400">{stats?.bidsPlaced ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-slate-100 dark:bg-slate-900/80 p-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Highest bid ever</p>
                    <p className="text-2xl font-bold text-emerald-400">{formatPrice(stats?.highestBidEver ?? 0, currency)}</p>
                  </div>
                  <div className="rounded-lg bg-slate-100 dark:bg-slate-900/80 p-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Auctions created</p>
                    <p className="text-2xl font-bold text-violet-400">{stats?.auctionsCreated ?? 0}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-6">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-400" />
                    <span className="text-slate-300">Buyer rating</span>
                    <span className="font-bold text-amber-400">{profile?.ratingBuyer?.toFixed(1) ?? '0.0'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    <span className="text-slate-300">Seller rating</span>
                    <span className="font-bold text-emerald-400">{profile?.ratingSeller?.toFixed(1) ?? '0.0'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card id="notifications" className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-xl scroll-mt-24">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-slate-100 dark:bg-slate-900/80 p-4">
                  <div className="flex items-center gap-3">
                    {dark ? <Moon className="h-5 w-5 text-amber-400" /> : <Sun className="h-5 w-5 text-amber-400" />}
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-200">Dark mode</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Use dark theme</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDark(!dark)}
                    className={`relative h-7 w-12 rounded-full transition-colors ${dark ? 'bg-amber-500' : 'bg-slate-600'}`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${dark ? 'left-7' : 'left-1'}`}
                    />
                  </button>
                </div>
                <div className="rounded-lg bg-slate-100 dark:bg-slate-900/80 p-4">
                  <p className="mb-2 font-medium text-slate-700 dark:text-slate-200">Theme color</p>
                  <div className="flex flex-wrap gap-2">
                    {THEME_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleThemeColor(c)}
                        className={`h-8 w-8 rounded-full border-2 transition-all ${(profile?.themeColor || 'amber') === c
                          ? 'border-slate-900 dark:border-white scale-110'
                          : 'border-transparent hover:scale-105'
                          } ${c === 'amber' ? 'bg-amber-500' : ''} ${c === 'blue' ? 'bg-blue-500' : ''} ${c === 'green' ? 'bg-emerald-500' : ''} ${c === 'violet' ? 'bg-violet-500' : ''} ${c === 'rose' ? 'bg-rose-500' : ''}`}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-100 dark:bg-slate-900/80 p-4">
                  <p className="mb-2 font-medium text-slate-700 dark:text-slate-200">Currency format</p>
                  <select
                    value={profile?.currencyFormat || 'PKR'}
                    onChange={(e) => handleCurrencyFormat(e.target.value as CurrencyCode)}
                    className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white"
                  >
                    {CURRENCIES.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-100 dark:bg-slate-900/80 p-4">
                  <div className="flex items-center gap-3">
                    <Megaphone className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-200">Email alerts</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Outbid, won, highest bidder to your email</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEmailAlertsToggle(!profile?.emailAlerts)}
                    disabled={false}
                    className={`relative h-7 w-12 rounded-full transition-colors ${profile?.emailAlerts ? 'bg-emerald-500' : 'bg-slate-600'}`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${profile?.emailAlerts ? 'left-7' : 'left-1'}`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
