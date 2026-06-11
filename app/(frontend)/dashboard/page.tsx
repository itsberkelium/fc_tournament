export const dynamic = "force-dynamic";

import db from "@/lib/db";
import { computeStandings, computeTournamentStats } from "@/lib/standings";
import { getSettings } from "@/lib/settings";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import type { RecentMatch } from "@/lib/api";

export default async function DashboardPage() {
  const [players, leagueMatches, matchCount, settings] = await Promise.all([
    db.player.findMany(),
    db.match.findMany({
      where: { isCompleted: true, isPlayoff: false },
      include: { homePlayer: true, awayPlayer: true },
      orderBy: [{ round: "desc" }, { createdAt: "desc" }],
    }),
    db.match.count({ where: { isPlayoff: false } }),
    getSettings(),
  ]);

  const tournamentStarted = matchCount > 0;
  const playoffEnabled = settings.playoffEnabled === "true";
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

  return (
    <DashboardClient
      initialStandings={standings}
      initialRecentMatches={recentMatches}
      initialStats={stats}
      tournamentName={settings.tournamentName}
      tournamentStarted={tournamentStarted}
      playoffEnabled={playoffEnabled}
    />
  );
}
