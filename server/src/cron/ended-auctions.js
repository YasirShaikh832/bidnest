import { prisma } from '../lib/prisma.js';
import { sendEmailToUser } from '../lib/email.js';

export function startEndedAuctionsCron() {
  const INTERVAL_MS = 60_000;

  async function tick() {
    try {
      const now = new Date();
      const ended = await prisma.auction.findMany({
        where: { status: 'active', expiresAt: { lte: now } },
        select: { id: true, title: true },
      });
      for (const auction of ended) {
        await prisma.auction.update({
          where: { id: auction.id },
          data: { status: 'ended' },
        });
        const winner = await prisma.bid.findFirst({
          where: { auctionId: auction.id },
          orderBy: { amount: 'desc' },
          select: { userId: true },
        });
        if (winner) {
          const payload = {
            title: 'You won the bid!',
            body: `Auction "${auction.title}" has ended. You are the winner!`,
            tag: `won-${auction.id}`,
          };
          await sendEmailToUser(winner.userId, payload.title, payload.body);
        }
      }
    } catch (err) {
      console.error('ended-auctions cron:', err);
    }
  }

  tick();
  setInterval(tick, INTERVAL_MS);
}
