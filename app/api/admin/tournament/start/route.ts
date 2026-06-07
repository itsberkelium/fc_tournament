import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyAdminRequest } from "@/lib/admin-guard";
import { tournamentStartSchema, validationError } from "@/lib/validation";

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

  try {
    const existingMatches = await db.match.count();
    if (existingMatches > 0) {
      return NextResponse.json({ message: "Turnuva zaten başlatıldı." }, { status: 409 });
    }

    const players = await db.player.findMany({ orderBy: { createdAt: "asc" } });
    if (players.length < 2) {
      return NextResponse.json({ message: "Turnuva için en az 2 oyuncu gerekli." }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = tournamentStartSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    const { doubleLegs, playoffEnabled, playoffTeamCount } = parsed.data;

    await db.settings.upsert({ where: { key: "playoffEnabled" }, update: { value: String(playoffEnabled) }, create: { key: "playoffEnabled", value: String(playoffEnabled) } });
    await db.settings.upsert({ where: { key: "playoffTeamCount" }, update: { value: String(playoffTeamCount) }, create: { key: "playoffTeamCount", value: String(playoffTeamCount) } });

    const matches = buildSchedule(players.map((p) => p.id), doubleLegs);
    await db.match.createMany({ data: matches });

    return NextResponse.json({ success: true, matchCount: matches.length });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ message: "Çakışma hatası." }, { status: 409 });
    return NextResponse.json({ message: "Sunucu hatası." }, { status: 500 });
  }
}
