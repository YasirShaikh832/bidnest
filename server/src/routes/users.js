import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { setOtp, checkOtp } from '../lib/otp.js';
import { sendEmail } from '../lib/email.js';

export const usersRouter = Router();

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'avatars');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
      const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[file.mimetype] || '.jpg';
      cb(null, `${req.userId}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WebP allowed'));
  },
});

const userSelect = {
  id: true,
  email: true,
  name: true,
  profileImageUrl: true,
  emailVerifiedAt: true,
  emailAlerts: true,
  ratingBuyer: true,
  ratingSeller: true,
  darkMode: true,
  themeColor: true,
  currencyFormat: true,
  createdAt: true,
};

usersRouter.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { ...userSelect },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [bidsCount, maxBid, myAuctionsCount] = await Promise.all([
      prisma.bid.count({ where: { userId: req.userId } }),
      prisma.bid.findFirst({
        where: { userId: req.userId },
        orderBy: { amount: 'desc' },
        select: { amount: true },
      }),
      prisma.auction.count({ where: { userId: req.userId } }),
    ]);

    res.json({
      ...user,
      stats: {
        bidsPlaced: bidsCount,
        highestBidEver: maxBid?.amount ?? 0,
        auctionsCreated: myAuctionsCount,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

usersRouter.patch('/me', authMiddleware, async (req, res) => {
  try {
    const { name, profileImageUrl, darkMode, emailAlerts, themeColor, currencyFormat } = req.body;
    const data = {};
    if (name !== undefined) data.name = name || null;
    if (profileImageUrl !== undefined) data.profileImageUrl = profileImageUrl || null;
    if (typeof darkMode === 'boolean') data.darkMode = darkMode;
    if (typeof emailAlerts === 'boolean') data.emailAlerts = emailAlerts;
    if (themeColor !== undefined && ['amber', 'blue', 'green', 'violet', 'rose'].includes(themeColor)) data.themeColor = themeColor;
    if (currencyFormat !== undefined && ['PKR', 'USD', 'EUR'].includes(currencyFormat)) data.currencyFormat = currencyFormat;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: { ...userSelect },
    });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

usersRouter.post('/me/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const profileImageUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { profileImageUrl },
      select: { ...userSelect },
    });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

usersRouter.post('/me/send-email-otp', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { email: true },
    });
    if (!user?.email) return res.status(400).json({ error: 'No email on account' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(user.email, otp);

    const sent = await sendEmail(
      user.email,
      'Your BidNest verification code',
      `Your verification code is: ${otp}\n\nIt expires in 10 minutes.`
    );
    if (!sent) {
      setOtp(user.email, '123456');
      return res.status(200).json({ message: 'Email not configured. Use code 123456 to verify (dev mode).' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send code' });
  }
});

usersRouter.post('/me/verify-email', authMiddleware, async (req, res) => {
  try {
    const codeStr = String(req.body?.code ?? '').trim();
    if (!codeStr) return res.status(400).json({ error: 'Code required' });

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { email: true },
    });
    if (!user?.email) return res.status(400).json({ error: 'No email on account' });

    const ok = checkOtp(user.email, codeStr);
    if (!ok) return res.status(400).json({ error: 'Invalid or expired code' });

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: { emailVerifiedAt: new Date() },
      select: { ...userSelect },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});
