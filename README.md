# Lig Yöneticisi

A full-stack web application for managing a private EA FC 26 friendly league. Since EA does not provide a public API for private friendlies, this app facilitates a manual workflow for team drafting, matchmaking, and league standings.

## Features

- **Frictionless login** — enter a player name, no password or email required
- **Draft Roulette** — randomly roll one of 55 EA FC 26 national teams (max 3 rolls), with race condition protection to prevent two players from claiming the same team
- **Round-robin league** — automatic standings with points (W=3, D=1, L=0), goal difference, and live rankings
- **Manual match resolution** — scores entered post-match to update the table; past matchdays lock once the next matchday starts
- **Optional playoffs** — knockout bracket seeded from league standings, auto-advancing on score entry
- **Admin panel** — player management, score overrides, disqualification, tournament controls

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Frontend:** React 19, shadcn/ui, Tailwind CSS, Open Sans
- **Backend:** Next.js Route Handlers
- **Database:** PostgreSQL
- **ORM:** Prisma 7
- **Containerization:** Docker / Docker Compose

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL (or Docker)

### 1. Clone and install

```bash
git clone <repo-url>
cd tournament
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in your database credentials:

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://user:password@localhost:5432/fc_tournament?schema=public"
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=fc_tournament
```

### 3. Start the database

Using Docker Compose:

```bash
docker compose up -d db
```

Or point `DATABASE_URL` at an existing PostgreSQL instance.

### 4. Run database migrations

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docker (full stack)

To run the entire app including the database in containers:

```bash
docker compose up --build
```

## Project Structure

```
app/
  (frontend)/
    login/        # Player login page
    draft/        # Team draft roulette
    dashboard/    # League standings
    fixtures/     # Match schedule and score entry
    playoffs/     # Knockout bracket
  (admin)/
    admin/        # Admin dashboard (players, matches, playoffs)
    admin/login/  # Admin password entry
    admin/settings/
  api/            # Route handlers (public + admin)
lib/
  db.ts           # Prisma singleton
  api.ts          # Client-side fetch wrappers
  standings.ts    # League table computation
  playoffs.ts     # Bracket helpers
  teams.json      # All 55 FC 26 national teams
  stores/         # Zustand stores (adminStore, playerStore)
prisma/
  schema.prisma   # Database schema
  generated/      # Prisma client output (import from @/prisma/generated)
```

## Database Schema

**Player** — `id`, `playerName`, `teamId` (unique), `teamName`, `createdAt`, `isDisabled`, `isDisqualified`, `canEnterScore`

**Match** — `id`, `homePlayerId`, `awayPlayerId`, `homeScore`, `awayScore`, `round`, `isCompleted`, `isPlayoff`, `bracketSlot`, `createdAt`

**DisabledTeam** — `teamId` (blocks team from appearing in draft)

**Settings** — `key`, `value` (tournamentName, registrationLocked, playoffEnabled, playoffTeamCount)

**Goal** — `id`, `matchId`, `scorerId`, `assistantId`, `isOwnGoal`
