import { prisma } from '../lib/prisma.js';

export function startScheduledAuctionsCron() {
  const INTERVAL_MS = 60_000;

  async function tick() {
    try {
      const now = new Date();
      await prisma.auction.updateMany({
        where: { status: 'scheduled', scheduledStartAt: { lte: now } },
        data: { status: 'active' },
      });
    } catch (err) {
      console.error('scheduled-auctions cron:', err);
    }
  }

  tick();
  setInterval(tick, INTERVAL_MS);
}
