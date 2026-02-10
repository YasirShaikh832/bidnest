import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { auctionRouter } from './routes/auctions.js';
import { bidRouter } from './routes/bids.js';
import { usersRouter } from './routes/users.js';
import { aiRouter } from './routes/ai.js';
import { setupSocketHandlers } from './socket.js';
import { prisma } from './lib/prisma.js';
import { startEndedAuctionsCron } from './cron/ended-auctions.js';
import { startScheduledAuctionsCron } from './cron/scheduled-auctions.js';

fs.mkdirSync(path.join(process.cwd(), 'uploads'), { recursive: true });

const app = express();
const httpServer = createServer(app);

const corsOrigin = process.env.CLIENT_URL || 'http://localhost:3000';
const io = new Server(httpServer, {
  cors: { origin: corsOrigin, methods: ['GET', 'POST'] },
});

app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', authRouter);
app.use('/api/auctions', auctionRouter);
app.use('/api/bids', bidRouter);
app.use('/api/users', usersRouter);
app.use('/api/ai', aiRouter);

app.get('/api/health', (_, res) => res.json({ ok: true }));

setupSocketHandlers(io);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`BidNest server running on port ${PORT}`);
  startEndedAuctionsCron();
  startScheduledAuctionsCron();
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export { io };
