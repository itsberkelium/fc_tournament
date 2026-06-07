import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyAdminRequest } from "@/lib/admin-guard";
import { computeStandings } from "@/lib/standings";

export async function POST(request: NextRequest) {
  const error = verifyAdminRequest(request);
  if (error) return error;

  const [settingsRows, players, leagueTotal, leagueDone, playoffCount] = await Promise.all([
    db.settings.findMany(),
    db.player.findMany(),
    (db.match as any).count({ where: { isPlayoff: false } }),
    (db.match as any).count({ where: { isPlayoff: false, isCompleted: true } }),
    (db.match as any).count({ where: { isPlayoff: true } }),
  ]);

  const settings: Record<string, string> = {};
  for (const row of settingsRows) settings[row.key] = row.value;

  if (settings.playoffEnabled !== "true") {
    return NextResponse.json({ message: "Bu turnuvada playoff ayarlanmamış." }, { status: 400 });
  }
  if (leagueTotal === 0) {
    return NextResponse.json({ message: "Lig henüz başlamadı." }, { status: 400 });
  }
  if (leagueDone < leagueTotal) {
    return NextResponse.json({ message: `Lig henüz tamamlanmadı. ${leagueTotal - leagueDone} maç kaldı.` }, { status: 400 });
  }
  if (playoffCount > 0) {
    return NextResponse.json({ message: "Playoff zaten başlatıldı." }, { status: 409 });
  }

  const teamCount = parseInt(settings.playoffTeamCount ?? "4", 10);

  const completedMatches = await (db.match as any).findMany({ where: { isPlayoff: false, isCompleted: true } });
  const standings = computeStandings(players, completedMatches);
  const seeds = standings.slice(0, teamCount);

  if (seeds.length < teamCount) {
    return NextResponse.json({ message: "Playoff için yeterli oyuncu yok." }, { status: 400 });
  }

  const firstRoundMatches = [];
  for (let slot = 0; slot < teamCount / 2; slot++) {
    firstRoundMatches.push({
      id: crypto.randomUUID(),
      homePlayerId: seeds[slot].playerId,
      awayPlayerId: seeds[teamCount - 1 - slot].playerId,
      round: 1,
      isPlayoff: true,
      bracketSlot: slot,
      isCompleted: false,
    });
  }

  await (db.match as any).createMany({ data: firstRoundMatches });

  return NextResponse.json({ success: true, matchCount: firstRoundMatches.length });
}
