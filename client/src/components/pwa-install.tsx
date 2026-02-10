'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Share } from 'lucide-react';

function useInstallable() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isSecure, setIsSecure] = useState(true);
  const [swRegistered, setSwRegistered] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
    setIsIOS(!!ios);
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true
    );
    setIsSecure(window.isSecureContext);

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(() => setSwRegistered(true))
        .catch(() => { });
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  return { installPrompt, setInstallPrompt, isIOS, isStandalone, isSecure, swRegistered };
}

export function PWAInstall() {
  const { installPrompt, setInstallPrompt, isIOS, isStandalone, isSecure } = useInstallable();
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const wasDismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) setDismissed(true);
  }, []);

  // Auto-show when we have a prompt or when iOS and not standalone (once per session unless dismissed)
  useEffect(() => {
    if (dismissed) return;
    if (isStandalone) return;
    if (installPrompt) setShowBanner(true);
    else if (isIOS) setShowBanner(true);
  }, [installPrompt, isIOS, isStandalone, dismissed]);

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') setShowBanner(false);
      setInstallPrompt(null);
    }
  };

  const dismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    sessionStorage.setItem('pwa-install-dismissed', '1');
  };

  if (!showBanner) return null;

  const showIOSInstructions = isIOS && !installPrompt;
  const showHTTPSNotice = !isSecure && !showIOSInstructions;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
          {showIOSInstructions ? <Share className="h-5 w-5" /> : <Download className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-slate-900 dark:text-white truncate">
            {showHTTPSNotice
              ? 'Install requires HTTPS'
              : showIOSInstructions
                ? 'Add BidNest to Home Screen'
                : 'Install BidNest'}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
            {showHTTPSNotice
              ? 'Open this site over HTTPS (or localhost) to install the app.'
              : showIOSInstructions
                ? 'Safari: tap the Share button (square with arrow) then “Add to Home Screen”.'
                : 'Add to home screen for quick access'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" variant="ghost" onClick={dismiss} className="text-slate-500">
          <X className="h-4 w-4" />
        </Button>
        {!showHTTPSNotice && !showIOSInstructions && (
          <Button size="sm" className="bg-amber-500 hover:bg-amber-600" onClick={handleInstall}>
            Install
          </Button>
        )}
      </div>
    </div>
  );
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
