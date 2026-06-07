export const dynamic = "force-dynamic";

import db from "@/lib/db";
import { FixturesClient } from "@/components/fixtures/fixtures-client";

export default async function FixturesPage() {
  const [matches, settingsRows] = await Promise.all([
    db.match.findMany({
      include: {
        homePlayer: { select: { id: true, playerName: true, teamId: true, teamName: true } },
        awayPlayer: { select: { id: true, playerName: true, teamId: true, teamName: true } },
      },
      orderBy: [{ round: "asc" }, { createdAt: "asc" }],
    }),
    db.settings.findMany(),
  ]);

  const settings: Record<string, string> = { tournamentName: "EA FC 26 Ligi" };
  for (const row of settingsRows) settings[row.key] = row.value;

  return (
    <FixturesClient
      initialMatches={matches}
      tournamentName={settings.tournamentName}
      playoffEnabled={settings.playoffEnabled === "true"}
    />
  );
}
