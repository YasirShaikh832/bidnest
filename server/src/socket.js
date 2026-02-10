import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
let ioInstance = null;

export function getIO() {
  return ioInstance;
}

export function setupSocketHandlers(io) {
  ioInstance = io;

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next();
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.userId;
    } catch { }
    next();
  });

  io.on('connection', (socket) => {
    socket.on('join:auction', (auctionId) => {
      if (auctionId) socket.join(`auction:${auctionId}`);
    });

    socket.on('leave:auction', (auctionId) => {
      if (auctionId) socket.leave(`auction:${auctionId}`);
    });

    socket.on('disconnect', () => { });
  });
}
