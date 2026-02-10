'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, type Auction, type Bid } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/contexts/auth-context';
import { formatPrice, type CurrencyCode } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/avatar';
import { Gavel, Trophy, Zap, Pencil, Trash2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { normalizeTagsInput } from '@/lib/tags';

function formatTimeLeft(expiresAt: string) {
  const d = new Date(expiresAt).getTime() - Date.now();
  if (d <= 0) return 'Ended';
  const h = Math.floor(d / 3600000);
  const m = Math.floor((d % 3600000) / 60000);
  const s = Math.floor((d % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
}

function formatBidTime(createdAt: string) {
  const d = new Date(createdAt);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

function AuctionDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { user } = useAuth();
  const currency = (user?.currencyFormat as CurrencyCode) || 'PKR';
  const [auction, setAuction] = useState<Auction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  const [liveBidId, setLiveBidId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editTags, setEditTags] = useState('');
  const [deletingBidId, setDeletingBidId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.auctions.get(id).then(setAuction).catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const socket = getSocket();
    if (!socket) return;
    const joinRoom = () => socket.emit('join:auction', id);
    if (socket.connected) joinRoom();
    socket.on('connect', joinRoom);
    const onBid = (payload: { bid: Bid; currentPrice: number }) => {
      setAuction((prev) => {
        if (!prev) return null;
        const existing = prev.bids ?? [];
        const merged = existing.filter((b) => b.id !== payload.bid.id);
        const newBids = [payload.bid, ...merged].sort((a, b) => b.amount - a.amount);
        setLiveBidId(payload.bid.id);
        setTimeout(() => setLiveBidId(null), 3000);
        return { ...prev, currentPrice: payload.currentPrice, bids: newBids };
      });
    };
    const onBidRemoved = (payload: { bidId: string; currentPrice: number }) => {
      setAuction((prev) => {
        if (!prev) return null;
        const newBids = (prev.bids ?? []).filter((b) => b.id !== payload.bidId);
        return { ...prev, currentPrice: payload.currentPrice, bids: newBids };
      });
    };
    socket.on('bid', onBid);
    socket.on('bid:removed', onBidRemoved);
    return () => {
      socket.off('connect', joinRoom);
      socket.emit('leave:auction', id);
      socket.off('bid', onBid);
      socket.off('bid:removed', onBidRemoved);
    };
  }, [id]);

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auction || !user) return;
    const amount = Number(bidAmount);
    if (isNaN(amount) || amount <= auction.currentPrice) {
      setError(`Bid must be higher than ${formatPrice(auction.currentPrice, currency)}`);
      return;
    }
    setError(null);
    setBidding(true);
    try {
      const bid = await api.bids.create({ auctionId: auction.id, amount });
      setAuction((prev) => {
        if (!prev) return null;
        const existing = prev.bids ?? [];
        const merged = existing.filter((b) => b.id !== bid.id);
        const newBids = [bid, ...merged].sort((a, b) => b.amount - a.amount);
        return { ...prev, currentPrice: amount, bids: newBids };
      });
      setBidAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bid failed');
    } finally {
      setBidding(false);
    }
  };

  const expired = auction && new Date(auction.expiresAt) <= new Date();
  const isOwner = auction && user && auction.user.id === user.id;
  const bids = auction?.bids ?? [];

  const openEdit = () => {
    if (!auction) return;
    setEditTitle(auction.title);
    setEditDescription(auction.description ?? '');
    setEditImageUrl(auction.imageUrl ?? '');
    setEditTags((auction.tags ?? []).join(', '));
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!auction || !id) return;
    try {
      const tagList = normalizeTagsInput(editTags);
      const updated = await api.auctions.update(auction.id, {
        title: editTitle,
        description: editDescription || undefined,
        imageUrl: editImageUrl || undefined,
        tags: tagList.length ? tagList : undefined,
      });
      setAuction(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const deleteBid = async (bidId: string) => {
    try {
      setDeletingBidId(bidId);
      await api.bids.delete(bidId);
      const remaining = (auction?.bids ?? []).filter((b) => b.id !== bidId);
      const nextPrice = remaining.length ? Math.max(...remaining.map((b) => b.amount)) : auction?.startingPrice ?? 0;
      setAuction((prev) => (prev ? { ...prev, bids: remaining, currentPrice: nextPrice } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bid');
    } finally {
      setDeletingBidId(null);
    }
  };

  if (!id) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-100 dark:from-violet-950/40 dark:via-slate-900 dark:to-amber-950/30 p-4">
        <Card className="max-w-md border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/60 shadow-xl">
          <CardContent className="py-8 text-center text-slate-600 dark:text-slate-300">
            <p className="mb-4">Select an auction from the dashboard.</p>
            <Link href="/auctions/">
              <Button className="bg-amber-500 hover:bg-amber-600">Back to Auctions</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !auction) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-100 dark:from-violet-950/40 dark:via-slate-900 dark:to-amber-950/30 p-4">
        <Card className="max-w-md border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/60 shadow-xl">
          <CardContent className="py-8 text-center text-rose-600 dark:text-rose-400">
            <p className="mb-4">{error}</p>
            <Link href="/auctions/">
              <Button className="bg-amber-500 hover:bg-amber-600">Back to Auctions</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-100 dark:from-violet-950/40 dark:via-slate-900 dark:to-amber-950/30">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-slate-100 dark:from-violet-950/40 dark:via-slate-900 dark:to-amber-950/30">
      <header className="sticky top-0 z-10 border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/auctions/" className="flex items-center gap-2 text-xl font-bold text-amber-600 dark:text-amber-400">
            <Logo className="h-7 w-7" />
            BidNest
          </Link>
          <div className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1.5 text-sm text-emerald-400">
            <Zap className="h-4 w-4 animate-pulse" />
            Live
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900/50 shadow-2xl">
            <div className="aspect-video bg-slate-200 dark:bg-slate-900 lg:aspect-square">
              {auction.imageUrl ? (
                <img src={auction.imageUrl} alt={auction.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500">
                  <Gavel className="h-24 w-24 opacity-50" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/60 shadow-xl">
              <CardHeader>
                <div className="mb-2 flex items-center gap-3">
                  <Avatar
                    src={auction.user.profileImageUrl}
                    name={auction.user.name}
                    email={auction.user.email}
                    size="md"
                  />
                  <div>
                    <CardTitle className="text-2xl text-slate-900 dark:text-white">{auction.title}</CardTitle>
                    <p className="text-sm text-slate-400">
                      by {auction.user.name || auction.user.email}
                    </p>
                  </div>
                </div>
                {auction.tags && auction.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {auction.tags.map((t) => (
                      <span key={t} className="rounded-full bg-slate-200 dark:bg-slate-700 px-3 py-1 text-xs text-slate-600 dark:text-slate-400">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {isOwner && !expired && (
                  <Button type="button" size="sm" variant="outline" className="mt-2 border-slate-600" onClick={openEdit}>
                    <Pencil className="mr-1 h-4 w-4" />
                    Edit auction
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {auction.description && (
                  <p className="text-slate-400">{auction.description}</p>
                )}

                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-4xl font-bold text-amber-400">
                    {formatPrice(auction.currentPrice, currency)}
                  </span>
                  <span className="rounded-full bg-slate-200 dark:bg-slate-700/80 px-3 py-1 text-sm text-slate-600 dark:text-slate-400">
                    {expired ? 'Auction ended' : `Ends in ${formatTimeLeft(auction.expiresAt)}`}
                  </span>
                </div>

                {!expired && !isOwner && user && (
                  <form onSubmit={handleBid} className="space-y-4">
                    {error && (
                      <div className="rounded-lg bg-rose-500/20 p-3 text-sm text-rose-400">
                        {error}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min={auction.currentPrice}
                        placeholder={`Min ${formatPrice(auction.currentPrice + 0.01, currency)}`}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="flex-1 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                      <Button
                        type="submit"
                        disabled={bidding}
                        className="bg-amber-500 hover:bg-amber-600"
                      >
                        {bidding ? 'Placing...' : 'Place Bid'}
                      </Button>
                    </div>
                  </form>
                )}

                {!user && !expired && (
                  <p className="text-sm text-slate-400">
                    <Link href="/login/" className="text-amber-400 hover:underline">
                      Log in
                    </Link>{' '}
                    to place a bid.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/60 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-white">
                  <Trophy className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                  Bid leaderboard
                </CardTitle>
                <p className="text-sm text-slate-400">Who bid and when — live updates</p>
              </CardHeader>
              <CardContent>
                {bids.length === 0 ? (
                  <p className="py-6 text-center text-slate-500">No bids yet. Be the first!</p>
                ) : (
                  <ul className="space-y-0">
                    {bids.map((b, index) => (
                      <li
                        key={b.id}
                        className={`flex items-center gap-4 border-b border-slate-700/80 py-4 last:border-0 ${liveBidId === b.id ? 'animate-pulse rounded-lg bg-amber-500/10' : ''
                          }`}
                      >
                        <span className="w-6 text-center text-lg font-bold text-slate-500">
                          #{index + 1}
                        </span>
                        <Avatar
                          src={b.user?.profileImageUrl}
                          name={b.user?.name}
                          email={b.user?.email}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-slate-900 dark:text-white">
                            {b.user?.name || b.user?.email || 'Anonymous'}
                          </p>
                          {b.user?.email && b.user?.name && (
                            <p className="truncate text-xs text-slate-500">{b.user.email}</p>
                          )}
                          {!b.user?.name && b.user?.email && (
                            <p className="truncate text-xs text-slate-500">{b.user.email}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="font-bold text-amber-600 dark:text-amber-400">{formatPrice(b.amount, currency)}</p>
                            <p className="text-xs text-slate-500">{formatBidTime(b.createdAt)}</p>
                          </div>
                          {user && b.user?.id === user.id && !expired && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/20"
                              onClick={() => deleteBid(b.id)}
                              disabled={deletingBidId === b.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditing(false)}>
          <Card className="w-full max-w-md border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-slate-900 dark:text-white">Edit auction</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Close</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400">Title</label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="mt-1 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400">Description</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white" rows={3} />
              </div>
              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400">Image URL</label>
                <Input value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} className="mt-1 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400">Tags (lowercase, hyphens)</label>
                <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="vintage-camera, art" className="mt-1 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
              </div>
              <Button className="w-full bg-amber-500 hover:bg-amber-600" onClick={saveEdit}>Save</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function AuctionDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-100 dark:from-violet-950/40 dark:via-slate-900 dark:to-amber-950/30">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      }
    >
      <AuctionDetailContent />
    </Suspense>
  );
}
