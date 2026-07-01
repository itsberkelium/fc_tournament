import { NextResponse } from "next/server";
import db from "@/lib/db";
import { computeStandings, computeTournamentStats } from "@/lib/standings";
import type { RecentMatch } from "@/lib/api";

export async function GET() {
  const [players, leagueMatches] = await Promise.all([
    db.player.findMany(),
    db.match.findMany({
      where: { isCompleted: true, isPlayoff: false },
      include: { homePlayer: true, awayPlayer: true },
      orderBy: [{ updatedAt: { sort: "desc", nulls: "last" } }, { round: "desc" }],
    }),
  ]);

  const standings = computeStandings(players, leagueMatches);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentMatches: RecentMatch[] = leagueMatches.slice(0, 10).map((m: any) => ({
    id: m.id,
    round: m.round,
    homeScore: m.homeScore!,
    awayScore: m.awayScore!,
    homePlayer: { playerName: m.homePlayer.playerName, teamId: m.homePlayer.teamId, teamName: m.homePlayer.teamName },
    awayPlayer: { playerName: m.awayPlayer.playerName, teamId: m.awayPlayer.teamId, teamName: m.awayPlayer.teamName },
  }));

  const stats = computeTournamentStats(leagueMatches);

  return NextResponse.json({ standings, recentMatches, stats });
}
