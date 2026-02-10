import { Router } from 'express';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { normalizeTags } from '../lib/tags.js';

export const auctionRouter = Router();

auctionRouter.get('/', optionalAuth, async (req, res) => {
  try {
    const { search, tags, sort = 'expires' } = req.query;
    const now = new Date();
    const where = {
      status: 'active',
      expiresAt: { gt: now },
      OR: [
        { scheduledStartAt: null },
        { scheduledStartAt: { lte: now } },
      ],
    };
    if (search && String(search).trim()) {
      const term = String(search).trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }
    if (tags) {
      const tagList = normalizeTags(tags);
      if (tagList.length) where.tags = { hasSome: tagList };
    }
    const orderBy = sort === 'price' ? { currentPrice: 'desc' } : { expiresAt: 'asc' };
    const auctions = await prisma.auction.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, profileImageUrl: true } },
        bids: { orderBy: { amount: 'desc' }, take: 1, include: { user: { select: { name: true, email: true } } } },
      },
      orderBy,
    });
    res.json(auctions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch auctions' });
  }
});

auctionRouter.get('/:id', optionalAuth, async (req, res) => {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, profileImageUrl: true } },
        bids: { orderBy: { amount: 'desc' }, include: { user: { select: { id: true, name: true, email: true, profileImageUrl: true } } } },
      },
    });
    if (!auction) return res.status(404).json({ error: 'Auction not found' });
    res.json(auction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch auction' });
  }
});

auctionRouter.post('/', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { emailVerifiedAt: true },
    });
    if (!user?.emailVerifiedAt) {
      return res.status(403).json({ error: 'Email verification required to create auctions. Verify your email first.' });
    }
    const MIN_STARTING_PRICE_RS = 100;
    const { title, description, startingPrice, imageUrl, expiresAt, tags, type, scheduledStartAt } = req.body;
    if (!title || startingPrice == null || !expiresAt) {
      return res.status(400).json({ error: 'Title, startingPrice, and expiresAt required' });
    }
    const numPrice = Number(startingPrice);
    if (isNaN(numPrice) || numPrice < MIN_STARTING_PRICE_RS) {
      return res.status(400).json({ error: `Minimum starting price is Rs. ${MIN_STARTING_PRICE_RS} (PKR)` });
    }
    const expires = new Date(expiresAt);
    const now = new Date();
    if (isNaN(expires.getTime()) || expires <= now) {
      return res.status(400).json({ error: 'expiresAt must be a future date' });
    }
    const tagList = normalizeTags(tags);
    const auctionType = ['standard', 'dutch', 'reserve'].includes(String(type)) ? type : 'standard';
    const scheduled = scheduledStartAt ? new Date(scheduledStartAt) : null;
    if (scheduled && (isNaN(scheduled.getTime()) || scheduled <= now)) {
      return res.status(400).json({ error: 'scheduledStartAt must be a future date' });
    }
    const status = scheduled && scheduled > now ? 'scheduled' : 'active';

    const auction = await prisma.auction.create({
      data: {
        title,
        description: description || null,
        startingPrice: numPrice,
        currentPrice: numPrice,
        imageUrl: imageUrl || null,
        tags: tagList,
        type: auctionType,
        expiresAt: expires,
        scheduledStartAt: scheduled,
        status,
        userId: req.userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    res.status(201).json(auction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create auction' });
  }
});

auctionRouter.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const auction = await prisma.auction.findUnique({ where: { id: req.params.id } });
    if (!auction) return res.status(404).json({ error: 'Auction not found' });
    if (auction.userId !== req.userId) return res.status(403).json({ error: 'Not your auction' });
    if (auction.status !== 'active') return res.status(400).json({ error: 'Cannot edit ended auction' });

    const { title, description, imageUrl, tags } = req.body;
    const data = {};
    if (title !== undefined) data.title = String(title).trim() || auction.title;
    if (description !== undefined) data.description = description ?? auction.description;
    if (imageUrl !== undefined) data.imageUrl = imageUrl ?? auction.imageUrl;
    if (tags !== undefined) data.tags = normalizeTags(tags);

    const updated = await prisma.auction.update({
      where: { id: req.params.id },
      data,
      include: {
        user: { select: { id: true, name: true, email: true, profileImageUrl: true } },
        bids: { orderBy: { amount: 'desc' }, include: { user: { select: { id: true, name: true, email: true, profileImageUrl: true } } } },
      },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update auction' });
  }
});
