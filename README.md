# BidNest - Real-Time Auction Platform

A full-stack bidding application with real-time updates, JWT authentication, and cross-platform client support.

## Tech Stack

- **Server:** Node.js, Express, Socket.io, Prisma, PostgreSQL
- **Client:** Next.js (App Router), Tailwind CSS, ShadcnUI
- **Real-time:** WebSockets via Socket.io

## Quick Start

### Development (without Docker)

```bash
# Install dependencies
npm install

# Setup database (requires PostgreSQL running)
cd server && npx prisma migrate dev

# Run dev servers
npm run dev
```

### Docker Deployment (single port)

Create a `.env` file in the project root (next to `docker-compose.yml`):

**Server (backend)**

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | (required in prod) | Sign login tokens: `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | `7d` | Token expiry (e.g. `7d`, `24h`) |
| `CLIENT_URL` | `http://localhost:8080` | Allowed CORS / Socket origin |
| `SITE_NAME` | `BidNest` | App name (emails, etc.) |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | — | Push: `npx web-push generate-vapid-keys` |
| `OLLAMA_URL` | — | AI help (e.g. `http://host.docker.internal:11434`) |
| `OLLAMA_MODEL` | `llama2` | Default Ollama model for /api/ai/chat |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | — | Email verification & alerts (Gmail: use app password) |
| `SMTP_FROM` | — | From address (defaults to `{SITE_NAME} <noreply@localhost>`) |

**Client (build-time; rebuild to apply)**

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_DEFAULT_THEME` | — | `light`, `dark`, or empty (system) |
| `NEXT_PUBLIC_SITE_NAME` | `BidNest` | App name in title and PWA |

**Email verification:** Required to create auctions. If SMTP is not set, use dev code **123456** after “Send code to my email”.

```bash
docker-compose up -d
# Access at http://localhost:8080
```

## Project Structure

```
bidnest/
├── server/          # Express API + Socket.io + Prisma
├── client/          # Next.js static export (Electron/Capacitor ready)
└── docker-compose.yml
```
