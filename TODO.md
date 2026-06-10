# TODO

Deferred improvements. Tick off or remove entries as they're resolved.

- [ ] **Wrap disqualification in a transaction** — `app/api/admin/players/[id]/route.ts`
  completes pending matches via `Promise.all` of separate updates, then flips the player
  flags. A mid-operation failure leaves the data half-updated. Fix: wrap the match
  updates + player update in `db.$transaction`.

- [ ] **Lock-in race returns 500 instead of 409** — if two players lock in the same
  team simultaneously, the second `db.player.create` fails with Prisma `P2002` (unique
  `teamId`), which the generic catch in `app/api/players/lock-in/route.ts` turns into
  a 500. The draft client only refunds the roll on 409. Fix: handle `e?.code === "P2002"`
  with a 409 response, matching the documented behavior in PROJECT.md §10.

- [ ] **Add audit logging for destructive admin actions** — tournament reset and player
  deletion happen immediately with no server-side trail. Log actor + action to make
  admin activity traceable.

- [ ] **Move the auth rate limiter out of process memory** — fine for the current
  single-container deployment, but switch to Redis or a reverse-proxy rule before
  scaling out to multiple instances.
