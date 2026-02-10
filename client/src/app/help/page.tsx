'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Bot, X } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function HelpPage() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ollamaStatus, setOllamaStatus] = useState<{ connected: boolean; error?: string } | null>(null);

  useEffect(() => {
    api.ai.status().then(setOllamaStatus).catch(() => setOllamaStatus({ connected: false, error: 'Could not check status' }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setError('');
    setReply('');
    setLoading(true);
    try {
      const res = await api.ai.chat(message.trim());
      setReply(res.reply || 'No response.');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI is not available. Set OLLAMA_URL on the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-100 dark:from-violet-950/40 dark:via-slate-900 dark:to-amber-950/30">
      <header className="border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href={user ? '/auctions/' : '/'} className="flex items-center gap-2 text-xl font-bold text-amber-600 dark:text-amber-400">
            <Logo className="h-7 w-7" />
            BidNest
          </Link>
          <Link href="/auctions/">
            <Button variant="outline" size="sm">Back</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/60 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Bot className="h-5 w-5 text-amber-400" />
              AI Help & Support
              {ollamaStatus === null ? (
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" title="Checking..." />
              ) : ollamaStatus.connected ? (
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" title="Connected" />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center text-rose-500 shrink-0" title="Not connected">
                  <X className="h-4 w-4" />
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Ask a question about bidding, creating auctions, or how BidNest works.
            </p>
            {error && (
              <div className="rounded-lg bg-rose-500/20 p-3 text-sm text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                placeholder="Type your question..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                disabled={loading}
              />
              <Button type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600" disabled={loading || !message.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
            {reply && (
              <div className="rounded-lg bg-slate-100 dark:bg-slate-900/80 p-4 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {reply}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
