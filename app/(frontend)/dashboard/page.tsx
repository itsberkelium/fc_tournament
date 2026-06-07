export const dynamic = "force-dynamic";

import db from "@/lib/db";
import { computeStandings } from "@/lib/standings";
import { getSettings } from "@/lib/settings";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const [players, completedMatches, matchCount, settings] = await Promise.all([
    db.player.findMany(),
    db.match.findMany({ where: { isCompleted: true, isPlayoff: false } }),
    db.match.count({ where: { isPlayoff: false } }),
    getSettings(),
  ]);

  const tournamentStarted = matchCount > 0;
  const playoffEnabled = settings.playoffEnabled === "true";
  const standings = computeStandings(players, completedMatches);

  return (
    <DashboardClient
      initialStandings={standings}
      tournamentName={settings.tournamentName}
      tournamentStarted={tournamentStarted}
      playoffEnabled={playoffEnabled}
    />
  );
}
