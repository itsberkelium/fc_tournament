export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import db from "@/lib/db";
import { computeStandings } from "@/lib/standings";
import { getTotalRounds, getRoundLabel } from "@/lib/playoffs";
import { PlayoffsClient } from "@/components/frontend/playoffs-client";

export default async function PlayoffsPage() {
  const settingsRows = await db.settings.findMany();
  const settings: Record<string, string> = { tournamentName: "EA FC 26 Ligi" };
  for (const row of settingsRows) settings[row.key] = row.value;

  if (settings.playoffEnabled !== "true") redirect("/dashboard");

  const teamCount = parseInt(settings.playoffTeamCount ?? "4", 10);
  const totalRounds = getTotalRounds(teamCount);

  const [players, leagueTotal, leagueDone, playoffMatches] = await Promise.all([
    db.player.findMany(),
    (db.match as any).count({ where: { isPlayoff: false } }),
    (db.match as any).count({ where: { isPlayoff: false, isCompleted: true } }),
    (db.match as any).findMany({
      where: { isPlayoff: true },
      include: {
        homePlayer: { select: { id: true, playerName: true, teamId: true, teamName: true } },
        awayPlayer: { select: { id: true, playerName: true, teamId: true, teamName: true } },
      },
    }),
  ]);

  const leagueComplete = leagueTotal > 0 && leagueDone === leagueTotal;
  const playoffStarted = playoffMatches.length > 0;

  const completedLeagueMatches = await (db.match as any).findMany({ where: { isPlayoff: false, isCompleted: true } });
  const standings = computeStandings(players, completedLeagueMatches);
  const seeds = standings.slice(0, teamCount);

  const rounds = [];
  for (let r = 1; r <= totalRounds; r++) {
    const matchCount = teamCount / Math.pow(2, r);
    const label = getRoundLabel(r, totalRounds);
    const matches = [];

    for (let slot = 0; slot < matchCount; slot++) {
      const dbMatch = (playoffMatches as any[]).find((m: any) => m.round === r && m.bracketSlot === slot);

      if (dbMatch) {
        matches.push({
          slot,
          id: dbMatch.id,
          homePlayer: dbMatch.homePlayer,
          awayPlayer: dbMatch.awayPlayer,
          homeScore: dbMatch.homeScore,
          awayScore: dbMatch.awayScore,
          isCompleted: dbMatch.isCompleted,
          isPlaceholder: false,
          leagueNotDone: false,
          winnerId: dbMatch.isCompleted
            ? (dbMatch.homeScore >= dbMatch.awayScore ? dbMatch.homePlayerId : dbMatch.awayPlayerId)
            : null,
        });
      } else {
        const homeSeed = r === 1 ? seeds[slot] ?? null : null;
        const awaySeed = r === 1 ? seeds[teamCount - 1 - slot] ?? null : null;
        matches.push({
          slot,
          id: null,
          homePlayer: homeSeed ? { id: homeSeed.playerId, playerName: homeSeed.playerName, teamId: homeSeed.teamId, teamName: homeSeed.teamName } : null,
          awayPlayer: awaySeed ? { id: awaySeed.playerId, playerName: awaySeed.playerName, teamId: awaySeed.teamId, teamName: awaySeed.teamName } : null,
          homeScore: null,
          awayScore: null,
          isCompleted: false,
          isPlaceholder: true,
          leagueNotDone: !leagueComplete,
          winnerId: null,
        });
      }
    }

    rounds.push({ round: r, label, matches });
  }

  return (
    <PlayoffsClient
      tournamentName={settings.tournamentName}
      teamCount={teamCount}
      leagueComplete={leagueComplete}
      playoffStarted={playoffStarted}
      bracket={{ totalRounds, rounds }}
    />
  );
}
