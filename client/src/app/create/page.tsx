'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, type UserProfile } from '@/lib/api';
import { normalizeTagsInput } from '@/lib/tags';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';

export default function CreateAuctionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [auctionType, setAuctionType] = useState('standard');
  const [scheduleStartEnabled, setScheduleStartEnabled] = useState(false);
  const [scheduledStartAt, setScheduledStartAt] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) api.users.me().then(setProfile).catch(() => setProfile(null));
  }, [user]);

  const minExpiry = () => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return d.toISOString().slice(0, 16);
  };

  const minSchedule = () => new Date().toISOString().slice(0, 16);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const tagList = normalizeTagsInput(tags);
      const auction = await api.auctions.create({
        title,
        description: description || undefined,
        startingPrice: Number(startingPrice),
        imageUrl: imageUrl || undefined,
        tags: tagList,
        type: auctionType,
        expiresAt: new Date(expiresAt).toISOString(),
        scheduledStartAt: scheduleStartEnabled && scheduledStartAt ? new Date(scheduledStartAt).toISOString() : undefined,
      });
      router.push(`/auction/?id=${auction.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create auction');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || (user && profile === null)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <p className="mb-4">You must be logged in to create an auction.</p>
            <Link href="/login/">
              <Button>Log in</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-100 dark:from-violet-950/40 dark:via-slate-900 dark:to-amber-950/30">
      <header className="border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-amber-600 dark:text-amber-400">
            <Logo className="h-7 w-7" />
            BidNest
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-8">
        <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/60 shadow-xl">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Create Auction</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-rose-500/20 p-3 text-sm text-rose-600 dark:text-rose-400">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-slate-600 dark:text-slate-300">Title *</Label>
                <Input
                  id="title"
                  placeholder="Vintage Camera"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600 dark:text-slate-300">Description (optional)</Label>
                <textarea
                  id="description"
                  className="flex min-h-[100px] w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  placeholder="Describe your item..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600 dark:text-slate-300">Starting Price (Rs. PKR) *</Label>
                <Input
                  id="startingPrice"
                  type="number"
                  step="1"
                  min="100"
                  placeholder="100"
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value)}
                  className="border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600 dark:text-slate-300">Image URL (optional)</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600 dark:text-slate-300">Tags (lowercase, hyphens: e.g. vintage-camera, art)</Label>
                <Input
                  id="tags"
                  placeholder="vintage-camera, collectible, art"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600 dark:text-slate-300">Auction type</Label>
                <select
                  value={auctionType}
                  onChange={(e) => setAuctionType(e.target.value)}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white"
                >
                  <option value="standard">Standard (highest bid wins)</option>
                  <option value="dutch">Dutch (price drops)</option>
                  <option value="reserve">Reserve (minimum hidden)</option>
                </select>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-slate-600 dark:text-slate-300">Schedule start time</Label>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={scheduleStartEnabled}
                    onClick={() => {
                      setScheduleStartEnabled((v) => !v);
                      if (scheduleStartEnabled) setScheduledStartAt('');
                    }}
                    className={`relative h-7 w-12 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${scheduleStartEnabled ? 'bg-amber-500' : 'bg-slate-600'}`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${scheduleStartEnabled ? 'left-7' : 'left-1'}`}
                    />
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {scheduleStartEnabled ? 'Auction will go live at the time you set below.' : 'Auction starts immediately when you create it.'}
                </p>
                {scheduleStartEnabled && (
                  <div className="space-y-2 pt-1">
                    <Label className="text-slate-600 dark:text-slate-300 text-sm">Start date & time</Label>
                    <Input
                      id="scheduledStartAt"
                      type="datetime-local"
                      min={minSchedule()}
                      value={scheduledStartAt}
                      onChange={(e) => setScheduledStartAt(e.target.value)}
                      className="border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      required={scheduleStartEnabled}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600 dark:text-slate-300">Ends at *</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  min={minExpiry()}
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600" disabled={submitting}>
                {submitting ? 'Creating...' : (<><span className="hidden sm:inline">Create Auction</span><span className="sm:hidden">Create</span></>)}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
