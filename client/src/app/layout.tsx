import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { PWAInstall } from '@/components/pwa-install';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'BidNest';

export const metadata: Metadata = {
  title: `${siteName} | Real-Time Auctions`,
  description: 'Place and track real-time bids on live auctions.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: siteName },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#f59e0b' }, { media: '(prefers-color-scheme: dark)', color: '#0f172a' }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen font-sans">
        <Providers>{children}</Providers>
        <PWAInstall />
      </body>
    </html>
  );
}
