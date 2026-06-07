export const dynamic = "force-dynamic";

import db from "@/lib/db";
import { computeStandings } from "@/lib/standings";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const [players, completedMatches, matchCount, settingsRows] = await Promise.all([
    db.player.findMany(),
    (db.match as any).findMany({ where: { isCompleted: true, isPlayoff: false } }),
    (db.match as any).count({ where: { isPlayoff: false } }),
    db.settings.findMany(),
  ]);

  const settings: Record<string, string> = { tournamentName: "EA FC 26 Ligi" };
  for (const row of settingsRows) settings[row.key] = row.value;

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
