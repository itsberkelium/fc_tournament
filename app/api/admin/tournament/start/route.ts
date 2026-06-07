import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyAdminRequest } from "@/lib/admin-guard";

function buildSchedule(playerIds: string[], doubleLegs: boolean) {
  const ids = [...playerIds];
  if (ids.length % 2 !== 0) ids.push(null as unknown as string);

  const numSlots = ids.length;
  const numRounds = numSlots - 1;
  const slots = [...ids];
  const matches: { id: string; homePlayerId: string; awayPlayerId: string; round: number; isCompleted: boolean; isPlayoff: boolean }[] = [];

  for (let round = 0; round < numRounds; round++) {
    for (let k = 0; k < numSlots / 2; k++) {
      const home = slots[k];
      const away = slots[numSlots - 1 - k];
      if (home && away) {
        matches.push({ id: crypto.randomUUID(), homePlayerId: home, awayPlayerId: away, round: round + 1, isCompleted: false, isPlayoff: false });
      }
    }
    const last = slots[numSlots - 1];
    for (let i = numSlots - 1; i > 1; i--) slots[i] = slots[i - 1];
    slots[1] = last;
  }

  if (doubleLegs) {
    const firstLeg = [...matches];
    for (const m of firstLeg) {
      matches.push({ id: crypto.randomUUID(), homePlayerId: m.awayPlayerId, awayPlayerId: m.homePlayerId, round: m.round + numRounds, isCompleted: false, isPlayoff: false });
    }
  }

  return matches;
}

export async function POST(request: NextRequest) {
  const error = verifyAdminRequest(request);
  if (error) return error;

  const existingMatches = await db.match.count();
  if (existingMatches > 0) {
    return NextResponse.json({ message: "Turnuva zaten başlatıldı." }, { status: 409 });
  }

  const players = await db.player.findMany({ orderBy: { createdAt: "asc" } });
  if (players.length < 2) {
    return NextResponse.json({ message: "Turnuva için en az 2 oyuncu gerekli." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const doubleLegs = body.doubleLegs === true;
  const playoffEnabled = body.playoffEnabled === true;
  const playoffTeamCount = Number(body.playoffTeamCount) || 4;

  // Save playoff settings
  await db.settings.upsert({ where: { key: "playoffEnabled" }, update: { value: String(playoffEnabled) }, create: { key: "playoffEnabled", value: String(playoffEnabled) } });
  await db.settings.upsert({ where: { key: "playoffTeamCount" }, update: { value: String(playoffTeamCount) }, create: { key: "playoffTeamCount", value: String(playoffTeamCount) } });

  const matches = buildSchedule(players.map((p: { id: string }) => p.id), doubleLegs);
  await (db.match as any).createMany({ data: matches });

  return NextResponse.json({ success: true, matchCount: matches.length });
}
