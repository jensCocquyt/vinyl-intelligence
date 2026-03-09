# Vinyl Intelligence

Analytics dashboard for your Discogs vinyl collection.

> Built with [Claude Code](https://claude.com/claude-code) by Anthropic.

## Stack

- **Frontend** — Angular 21, `@clerk/clerk-js`, Chart.js
- **Backend** — Node.js, Express, TypeScript, Prisma ORM
- **Database** — PostgreSQL
- **Auth** — Clerk
- **Package manager** — pnpm workspaces

## Getting started

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)
- pnpm (`npm install -g pnpm`)
- A [Clerk](https://clerk.com) account
- A [Discogs](https://www.discogs.com/settings/developers) developer app

### Setup

1. **Start the database**
   ```bash
   docker compose up -d
   ```

2. **Configure the backend**
   ```bash
   cp backend/.env.example backend/.env
   ```
   Fill in `backend/.env`:
   | Variable | Where to find it |
   |---|---|
   | `DATABASE_URL` | Already set for local Docker |
   | `CLERK_SECRET_KEY` | Clerk dashboard → API Keys |
   | `DISCOGS_CONSUMER_KEY` | Discogs developer app settings |
   | `DISCOGS_CONSUMER_SECRET` | Discogs developer app settings |
   | `BACKEND_URL` | `http://localhost:3000` for local dev |
   | `FRONTEND_URL` | `http://localhost:4200` for local dev |

   Set your Discogs app callback URL to: `http://localhost:3000/api/discogs/connect/callback`

3. **Configure the frontend**

   Edit `frontend/src/environments/environment.ts` and set `clerkPublishableKey` to your `pk_test_...` key.

4. **Run migrations**
   ```bash
   cd backend && pnpm db:migrate
   ```

5. **Start everything**
   ```bash
   pnpm dev
   ```
   - Frontend: http://localhost:4200
   - Backend: http://localhost:3000

## Features

- **Discogs OAuth** — connect your Discogs account securely
- **Collection sync** — imports your full collection with pagination and rate limiting
- **Dashboard** — top artists, genres, styles, formats, decades, countries, value overview
- **Collection browser** — searchable and filterable table with sorting and pagination
- **Record detail** — cover, metadata, marketplace value, Discogs link
- **Settings** — connection status, manual sync, sync history

## Project structure

```
vinyl-intelligence/
├── frontend/                   # Angular SPA
│   └── src/app/
│       ├── pages/              # dashboard, collection, settings, sign-in
│       ├── components/         # bar-chart, record-drawer
│       ├── services/           # clerk.service, api.service
│       └── guards/             # auth.guard
├── backend/                    # Express API
│   ├── prisma/schema.prisma    # data model
│   └── src/
│       ├── routes/             # discogs, collection, sync, dashboard
│       └── services/           # discogs.service, sync.service
└── docker-compose.yml          # PostgreSQL
```
