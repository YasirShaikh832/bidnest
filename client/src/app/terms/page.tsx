'use client';

import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-100 dark:from-violet-950/40 dark:via-slate-900 dark:to-amber-950/30">
      <header className="border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-amber-600 dark:text-amber-400">
            <Logo className="h-7 w-7" />
            BidNest
          </Link>
          <Link href="/">
            <Button variant="outline" size="sm">Back to home</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Terms and Conditions</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Last updated: {new Date().toLocaleDateString('en-GB')}</p>

        <div className="mt-8 space-y-6 text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">1. Binding commitment to sell</h2>
            <p>
              Once you have placed an item for auction on BidNest and the auction has completed (i.e. the auction has ended with a winning bid), you are legally obliged to sell the item to the highest bidder. You cannot cancel the sale or refuse to complete the transaction after the auction has ended. Failure to honour this commitment may result in account suspension and may expose you to liability.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">2. Binding commitment to buy</h2>
            <p>
              If you place the winning bid on an auction, you are legally obliged to purchase the item from the seller at the final bid price. You cannot withdraw your bid after the auction has ended. Failure to complete the purchase may result in account suspension and may expose you to liability.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">3. Listing accuracy</h2>
            <p>
              You must accurately describe items you list for auction. Misrepresentation of condition, authenticity, or other material facts may result in account action and liability. Sellers are responsible for ensuring that they have the right to sell the listed items.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">4. Platform use</h2>
            <p>
              You agree to use BidNest only for lawful purposes. You may not manipulate bids, use fake accounts, or engage in any fraudulent or abusive behaviour. BidNest reserves the right to suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">5. Contact and disputes</h2>
            <p>
              Disputes between buyers and sellers are primarily the responsibility of the parties involved. BidNest may assist with information and account history but is not responsible for the completion of transactions or the quality of items sold. For support, contact the site administrator.
            </p>
          </section>
        </div>

        <div className="mt-10">
          <Link href="/">
            <Button className="bg-amber-500 hover:bg-amber-600">Back to home</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
