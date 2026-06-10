# FC Tournament — AI Project Guide

This document is the authoritative reference for any AI agent working on this codebase.
Read it entirely before touching any code.

**Keeping this document current:** After any change that affects content already described here — schema columns, validation rules, API routes, business logic, conventions, deployment config — update the relevant section(s) of this file in the same commit. Do not update it for implementation details that aren't described here.

---

## 1. What This Is

A full-stack **EA FC 26 tournament management system** for a private group. Players register
themselves, get assigned national teams via a roulette draft, play matches in real life, and
enter the scores here. The app tracks standings, fixtures, and a knockout playoff bracket.

**Live URL:** Production runs on `fc.berke.dev`, dev on `fc-dev.berke.dev`.  
**Branches:** `master` = production, `dev` = staging. Always develop on `dev` unless told otherwise.

---

## 2. Tech Stack

| Technology | Version | Notes |
|---|---|---|
| Next.js | 16.2.7 | App Router. **Read `node_modules/next/dist/docs/` before writing Next.js code — this version has breaking changes from training data.** |
| React | 19.2.4 | |
| TypeScript | 5 | |
| Prisma | 7.8.0 | Client output in `prisma/generated/` (not `node_modules`) |
| PostgreSQL | 16 | Via `@prisma/adapter-pg` + `pg` 8.21.0 |
| Zod | 4.4.3 | Use `.issues` not `.errors` on ZodError |
| Zustand | 5.0.14 | Two stores: adminStore, playerStore |
| Tailwind CSS | 4 | Via `@tailwindcss/postcss` |
| shadcn/ui | 4.10.0 | Components in `components/ui/` |
| lucide-react | 1.17.0 | Icons |

---

## 3. Project Structure

```
fc_tournament/
├── app/
│   ├── (frontend)/          # Player-facing pages
│   │   ├── login/           # Name entry
│   │   ├── draft/           # Team roulette
│   │   ├── dashboard/       # Leaderboard
│   │   ├── fixtures/        # Match schedule + score entry
│   │   └── playoffs/        # Knockout bracket
│   ├── (admin)/             # Admin pages
│   │   └── admin/
│   │       ├── page.tsx     # Main dashboard (tabs)
│   │       ├── login/       # Password entry
│   │       └── settings/    # Tournament config
│   └── api/                 # API routes (see Section 6)
├── components/
│   ├── ui/                  # shadcn components
│   ├── admin/               # Admin tab components
│   ├── dashboard/           # Leaderboard table
│   ├── fixtures/            # Match cards, matchday sections
│   └── frontend/            # Shared frontend components
├── lib/
│   ├── db.ts                # Prisma singleton
│   ├── api.ts               # Client-side fetch wrappers + types
│   ├── standings.ts         # League table computation
│   ├── playoffs.ts          # Round labels, bracket helpers
│   ├── playoff-bracket.ts   # Bracket advancement logic
│   ├── settings.ts          # DB settings helper
│   ├── validation.ts        # Zod schemas
│   ├── admin-auth.ts        # sessionStorage helpers
│   ├── admin-guard.ts       # API auth middleware
│   ├── player-storage.ts    # localStorage helpers
│   ├── teams.json           # 55 national teams
│   └── stores/
│       ├── admin-store.ts   # Zustand admin state
│       └── player-store.ts  # Zustand player state
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── config.ts            # Prisma config (reads .env DATABASE_URL)
│   └── migrations/          # SQL migration files
├── Dockerfile               # 4-stage build
├── docker-compose.yml       # Production (includes db service)
├── docker-compose.dev.yml   # Dev (shares prod Postgres via external network)
├── deploy.sh                # Production deploy
└── deploy-dev.sh            # Dev deploy
```

---

## 4. Database Schema

```prisma
model Player {
  id             String   @id              // UUID assigned at lock-in
  playerName     String
  teamId         String   @unique          // One team per player (enforced)
  teamName       String
  createdAt      DateTime @default(now())
  isDisabled     Boolean  @default(false)  // Blocks login
  isDisqualified Boolean  @default(false)  // Forces -99 pts; disables score entry; irreversible
  canEnterScore  Boolean  @default(true)   // Permission: player can submit match scores

  matchesAsHome  Match[]  @relation("HomePlayer")
  matchesAsAway  Match[]  @relation("AwayPlayer")
  goals          Goal[]
}

model Match {
  id           String   @id @default(uuid())
  homePlayerId String
  awayPlayerId String
  homeScore    Int?                        // Null until played
  awayScore    Int?
  round        Int                         // 1-based; same field for league (matchday) and playoff
  isCompleted  Boolean  @default(false)
  isPlayoff    Boolean  @default(false)
  bracketSlot  Int?                        // Playoff position; -1 = third-place match
  createdAt    DateTime @default(now())

  homePlayer   Player   @relation("HomePlayer", ...)
  awayPlayer   Player   @relation("AwayPlayer", ...)
  goals        Goal[]
}

model DisabledTeam {
  teamId    String   @id                  // Prevents team from appearing in draft
  createdAt DateTime @default(now())
}

model Settings {
  key   String @id
  value String
}

// Keys: tournamentName, registrationLocked, playoffEnabled, playoffTeamCount

model Goal {
  id          String  @id @default(uuid())
  matchId     String
  scorerId    String
  assistantId String?
  isOwnGoal   Boolean @default(false)
  // Note: Goal model exists but is not prominently used in current UI
}
```

**Important:** Prisma client is generated to `prisma/generated/`, not the default `node_modules`.
Import from `@/prisma/generated`. If you see `(db.match as any)`, it means `prisma generate`
hasn't been run.

---

## 5. Business Logic

### Tournament Phases

**Phase 1 — Registration**
- Players visit `/login`, enter their name
- First-time players are sent to `/draft` to roll for a national team (max 3 rolls)
- Admin can lock registration to prevent new players
- Admin can disable specific national teams from the draft pool (enforced server-side: lock-in rejects disabled teams with 403)

**Phase 2 — League**
- Admin starts tournament from `/admin` → Players tab
- Options: `doubleLegs` (home+away), `playoffEnabled`, `playoffTeamCount`
- Round-robin schedule generated with circular rotation algorithm
- Players enter scores from `/fixtures`
- Standings: W=3, D=1, L=0; ties broken by goal diff, then goals for, then name
- **Disqualified players:** points forced to -99, always sorted last, can't enter scores

**Phase 3 — Playoffs** (optional)
- Only starts after league is 100% complete
- Seeds top N players: 1 vs N, 2 vs N-1, etc.
- `bracketSlot` 0..(N/2-1) for first round matches
- Auto-advances: when both semi-final matches complete, system creates final + third-place match
- Third-place match: `bracketSlot = -1`
- `round` for playoffs = 1, 2, 3... (same field as league matchday)

### Disqualification Rules
- Admin-only, irreversible
- All pending matches auto-completed 0-3 (disqualified player loses)
- Player's `isDisabled` also set to true
- Points → -99 in standings, row dimmed with DSK badge
- DSK badge shown in: leaderboard table, fixtures match cards, admin matches table
- Admin can still edit/save/reset disqualified players' match scores
- Players cannot submit scores for matches involving a disqualified player

### Admin Authentication
- Two roles: `admin` (full access) and `moderator` (score editing only)
- `ADMIN_PASSWORD` env var grants admin role; `MODERATOR_PASSWORD` env var grants moderator role (optional — if unset, only admin login works)
- `/api/admin/auth` returns `{ role }` which the client stores in `sessionStorage` (`fc26_admin_role`) alongside the password
- API routes use `verifyAdminRequest()` (admin-only) or `verifyStaffRequest()` (admin or moderator) from `lib/admin-guard.ts`
- Score routes (`PATCH`/`DELETE /api/admin/matches/[id]`) accept both roles via `verifyStaffRequest()`
- Role in `sessionStorage` is UI-only (tabs, Settings link visibility); actual authorization always re-verifies the password server-side
- Moderator UI: all three tabs visible; Players tab is read-only (no edit/delete/start-tournament); Teams tab can enable/disable teams; Settings page redirects to `/admin`
- Password checks use constant-time comparison (`crypto.timingSafeEqual`); `/api/admin/auth` is rate-limited per IP (10 attempts/minute → 429, in-memory per instance)

### Player Authentication
- Name-only (no passwords) — accepted trade-off: the app serves a private group of trusted friends, so score submission trusts the `playerName` in the request body
- Player identity stored in `localStorage` (`fc26_player`)
- `loadPlayer()` in playerStore validates against DB on every page load
- Disabled players get 403 from `/api/players/me` and see an error on login

---

## 6. API Routes Reference

All admin routes require `Authorization: Bearer <ADMIN_PASSWORD>`.

### Public / Player

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/players/me?playerName=` | None | Check player, returns 403 if disabled |
| POST | `/api/players/lock-in` | None | Register player with team |
| GET | `/api/players/claimed-teams` | None | Returns `{ claimedTeamIds, disabledTeamIds }` |
| PATCH | `/api/matches/[id]` | None (name in body) | Player submits score |
| GET | `/api/leaderboard` | None | Standings array |
| GET | `/api/fixtures` | None | All league matches with player details |
| GET | `/api/playoffs` | None | Full bracket data |
| GET | `/api/settings` | None | Public settings (tournamentName etc.) |
| GET | `/api/admin/tournament/status` | None | `{ started: boolean }` |

### Admin

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/admin/auth` | Verify password |
| GET | `/api/admin/players` | List all players |
| DELETE | `/api/admin/players/[id]` | Delete player |
| PATCH | `/api/admin/players/[id]` | Update permissions / disable / disqualify |
| POST | `/api/admin/teams/[teamId]` | Disable team from draft |
| DELETE | `/api/admin/teams/[teamId]` | Re-enable team |
| GET | `/api/admin/matches` | List league matches (with player info) |
| PATCH | `/api/admin/matches/[id]` | Save score (triggers bracket advancement) |
| DELETE | `/api/admin/matches/[id]` | Reset score to null |
| POST | `/api/admin/tournament/start` | Generate round-robin schedule |
| POST | `/api/admin/tournament/playoffs/start` | Seed and create playoff round 1 |
| DELETE | `/api/admin/tournament` | Reset all matches |
| GET | `/api/admin/settings` | Get all settings |
| PATCH | `/api/admin/settings` | Update settings |

### PATCH `/api/admin/players/[id]` — Actions
```json
{ "action": "updatePermissions", "canEnterScore": true/false }
{ "action": "toggleDisabled" }
{ "action": "disqualify" }  // irreversible; returns affectedMatches[]
```

---

## 7. Key Files Deep Reference

### `lib/api.ts`
The single source of truth for all client-side fetches. Components never write raw `fetch()`.

```typescript
playerApi.getMe(playerName)       // MeResponse: { exists, hasTeam, player, message }
playerApi.lockIn(playerName, teamId)
playerApi.getClaimedTeams()
playerApi.submitMatchScore(id, { playerName, homeScore, awayScore })

adminApi.getPlayers(pw)
adminApi.deletePlayer(id, pw)
adminApi.updatePlayer(id, body, pw)  // PlayerUpdateBody union type
adminApi.startTournament(options, pw)
adminApi.startPlayoffs(pw)
adminApi.getMatches(pw)
adminApi.saveMatchScore(id, body, pw)
adminApi.resetMatch(id, pw)
adminApi.disableTeam(teamId, pw)
adminApi.enableTeam(teamId, pw)
adminApi.getSettings(pw)
adminApi.updateSettings(body, pw)
adminApi.reset(pw)

publicApi.getLeaderboard()
publicApi.getFixtures()
publicApi.getPlayoffs()
```

### `lib/standings.ts` — `computeStandings(players, matches)`
Returns `StandingRow[]` with `isDisqualified`. Disqualified rows: `points = -99`, sorted last.
`StandingRow` fields: `playerId, playerName, teamId, teamName, played, won, drawn, lost, goalsFor, goalsAgainst, goalDiff, points, isDisqualified`

### `lib/playoffs.ts`
- `getTotalRounds(teamCount)` → `Math.log2(teamCount)`
- `getRoundLabel(round, totalRounds)` → Turkish string ("Final", "Yarı Final", "Çeyrek Final", …)
- `getFeederLabel(round, totalRounds, slot, side)` → e.g. "Yarı Final 1. Maç Galibi"
- `getThirdPlaceFeederLabel(totalRounds, side)` → "Yarı Final 1. Maç Mağlubu"

### `lib/playoff-bracket.ts` — `advancePlayoffBracket(existing, homeScore, awayScore)`
Called after a playoff match score is saved. Finds the sibling match; if both are complete,
creates the next-round match. At the final round, also creates the third-place match
(bracketSlot = -1) with the two losers.

### `lib/settings.ts` — `getSettings(extraDefaults?)`
Fetches all `Settings` rows, merges with defaults: `{ tournamentName: "EA FC 26 Ligi", registrationLocked: "false" }`.

### `lib/validation.ts`
Zod schemas used in API routes:
- `scoreSchema` — `{ homeScore: int 0-99, awayScore: int 0-99 }`
- `playerScoreSchema` — extends score with `{ playerName: string }`
- `lockInSchema` — `{ playerName: trimmed string 1-50, teamId: trimmed string 1-100 }`
- `tournamentStartSchema` — `{ doubleLegs: bool, playoffEnabled: bool, playoffTeamCount: int > 0 }`
- `validationError(zodError)` — returns `NextResponse` 400 with joined issue messages

### `lib/stores/admin-store.ts`
Zustand store. `init()` fetches players, tournament status, claimed teams. Fields:
`password, tournamentStarted, playerCount, disabledTeamCount, isInitialized`

### `lib/stores/player-store.ts`
Zustand store. `loadPlayer(router)` is idempotent (skips if `player !== null`).
`clearPlayer(router)` clears localStorage and redirects to `/login`.

### `lib/player-storage.ts`
`localStorage` keys: `fc26_player` (name), `fc26_draft` (rollCount, currentTeamId, seenTeamIds).

### `lib/admin-auth.ts`
`sessionStorage` keys: `fc26_admin` (boolean), `fc26_admin_pw` (password string).

### `lib/teams.json`
55 national teams. Shape: `{ id, name, flag, rating, attack, midfield, defence, stars }`.
`flag` is a `flagcdn.com` country code (e.g. `"gb-eng"` for England).

---

## 8. UI Components Available

shadcn/ui components in `components/ui/`:
`Alert, Badge, Button, Card, Dialog, Input, Label, Separator, Table, Tabs`

**No `DropdownMenu` component exists.** Build custom dropdowns with `useState` + click-outside handler.

Custom components worth knowing:
- `components/flag.tsx` — renders a flag image from flagcdn.com
- `components/star-rating.tsx` — star display for team quality

---

## 9. Deployment

### Environments

| Env | Branch | Port | URL | Docker project |
|---|---|---|---|---|
| Production | `master` | 3000 | `fc.berke.dev` | default |
| Dev/Staging | `dev` | 3001 | `fc-dev.berke.dev` | `fc-dev` |

### Docker Setup
- **Production:** `docker-compose.yml` — includes its own PostgreSQL service
- **Dev:** `docker-compose.dev.yml` — no DB service; attaches to `fc_tournament_default` (prod's Docker network) and uses `${POSTGRES_DB}_dev` database

### CI/CD
`.github/workflows/deploy.yml` — pushes to `master` trigger `deploy-prod`, pushes to `dev` trigger `deploy-dev`. Both SSH into Hetzner server and run the respective deploy script.

**GitHub Secrets required:** `HETZNER_HOST`, `HETZNER_USER`, `HETZNER_PASS`, `APP_DIR`, `DEV_APP_DIR`

### Environment Variables (`.env` on server)
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
ADMIN_PASSWORD=<secret>
POSTGRES_USER=...
POSTGRES_PASSWORD=...
POSTGRES_HOST=...
POSTGRES_DB=...
```

### Migrations
The `migrator` Docker stage runs `prisma migrate deploy` on each deploy. To add a migration,
create a file in `prisma/migrations/<timestamp>_<name>/migration.sql` (no live DB in this
environment, so use manual SQL files rather than `prisma migrate dev`).

---

## 10. Important Conventions & Gotchas

- **Prisma output path:** `prisma/generated/` — import as `@/prisma/generated`, not from `node_modules`
- **Zod v4:** Use `error.issues`, not `error.errors`
- **Next.js 16:** APIs and file structure may differ from training data — check `node_modules/next/dist/docs/`
- **Admin password:** Passed per-call as Bearer token; never stored in component state beyond what `adminStore.password` provides
- **Player name matching:** Case-insensitive in DB queries (`mode: "insensitive"`), but original casing is preserved
- **Bracket slot -1:** The third-place match always uses `bracketSlot = -1` to distinguish it from regular bracket matches
- **`isPlayoff` flag:** Separates league matches (round = matchday) from playoff matches (round = bracket round)
- **Standings sort:** Disqualified players always at bottom regardless of points; -99 is just a visual representation
- **Score entry blocked when:** player's `canEnterScore = false`, OR either player `isDisqualified`, OR player is `isDisabled`. Admin is exempt from all these restrictions.
- **Draft race condition:** If two players lock in the same team simultaneously, the second gets a 409 and their roll is refunded
- **No `gh` CLI available** — use `mcp__github__*` tools for all GitHub interactions
- **Commit author:** Always run `git config user.email noreply@anthropic.com && git config user.name Claude` and `git commit --amend --no-edit --reset-author` after committing, or the stop hook will flag unverified commits
- **Do not push without explicit user approval**

---

## 11. Pages Quick Reference

| Route | Auth | Server/Client | Purpose |
|---|---|---|---|
| `/login` | None | Client | Player name entry, redirects to /draft or /dashboard |
| `/draft` | localStorage | Client | Team roulette (3 rolls max) |
| `/dashboard` | playerStore | Server+Client | Leaderboard, 30s polling if active |
| `/fixtures` | playerStore | Server+Client | All matches, score entry |
| `/playoffs` | playerStore | Server | Bracket/list toggle, redirects if disabled |
| `/admin/login` | None | Client | Admin password entry |
| `/admin` | sessionStorage | Client | Player mgmt, match scores, playoff controls |
| `/admin/settings` | sessionStorage | Client | Tournament name, registration lock, export, reset |
