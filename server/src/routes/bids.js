import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { getIO } from '../socket.js';
import { sendEmailToUser } from '../lib/email.js';

export const bidRouter = Router();

bidRouter.post('/', authMiddleware, async (req, res) => {
  try {
    const { auctionId, amount, type } = req.body;
    if (!auctionId || amount == null) {
      return res.status(400).json({ error: 'auctionId and amount required' });
    }
    const bidType = ['standard', 'auto', 'proxy'].includes(String(type)) ? type : 'standard';
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
    if (!auction) return res.status(404).json({ error: 'Auction not found' });
    if (auction.status !== 'active') return res.status(400).json({ error: 'Auction has ended' });
    if (auction.expiresAt <= new Date()) return res.status(400).json({ error: 'Auction has expired' });
    if (auction.userId === req.userId) return res.status(400).json({ error: 'Cannot bid on your own auction' });
    if (numAmount <= auction.currentPrice) {
      return res.status(400).json({ error: `Bid must be higher than current price (Rs. ${auction.currentPrice} PKR)` });
    }

    const [bid] = await prisma.$transaction([
      prisma.bid.create({
        data: { auctionId, userId: req.userId, amount: numAmount, type: bidType },
        include: { user: { select: { id: true, name: true, email: true, profileImageUrl: true } } },
      }),
      prisma.auction.update({
        where: { id: auctionId },
        data: { currentPrice: numAmount },
      }),
    ]);

    const io = getIO();
    if (io) {
      io.to(`auction:${auctionId}`).emit('bid', {
        bid: { id: bid.id, amount: bid.amount, createdAt: bid.createdAt, user: bid.user },
        currentPrice: numAmount,
      });
    }

    // Notify previous high bidder they were outbid (if different from new bidder)
    const prevHigh = await prisma.bid.findFirst({
      where: { auctionId, id: { not: bid.id }, amount: { lt: numAmount } },
      orderBy: { amount: 'desc' },
      select: { userId: true },
    });
    const outbidPayload = {
      title: 'You got outbid!',
      body: `Someone placed a higher bid. Current price: Rs. ${numAmount.toFixed(2)} (PKR)`,
      tag: `outbid-${auctionId}`,
    };
    const highestPayload = {
      title: 'You are the highest bidder!',
      body: `Your bid of Rs. ${numAmount.toFixed(2)} (PKR) is currently leading.`,
      tag: `highest-${auctionId}`,
    };
    if (prevHigh && prevHigh.userId !== req.userId) {
      sendEmailToUser(prevHigh.userId, outbidPayload.title, outbidPayload.body).catch(() => { });
    }
    sendEmailToUser(req.userId, highestPayload.title, highestPayload.body).catch(() => { });

    res.status(201).json(bid);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to place bid' });
  }
});

bidRouter.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const bid = await prisma.bid.findUnique({
      where: { id: req.params.id },
      include: { auction: true },
    });
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (bid.userId !== req.userId) return res.status(403).json({ error: 'Not your bid' });
    if (bid.auction.status !== 'active') return res.status(400).json({ error: 'Auction has ended' });

    const remaining = await prisma.bid.findMany({
      where: { auctionId: bid.auctionId, id: { not: bid.id } },
      orderBy: { amount: 'desc' },
      take: 1,
    });
    const newCurrent = remaining[0]?.amount ?? bid.auction.startingPrice;

    await prisma.$transaction([
      prisma.bid.delete({ where: { id: bid.id } }),
      prisma.auction.update({
        where: { id: bid.auctionId },
        data: { currentPrice: newCurrent },
      }),
    ]);

    const io = getIO();
    if (io) {
      io.to(`auction:${bid.auctionId}`).emit('bid:removed', { bidId: bid.id, currentPrice: newCurrent });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete bid' });
  }
});
