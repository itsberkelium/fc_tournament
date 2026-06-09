import { NextResponse } from "next/server";
import db from "@/lib/db";
import { computeStandings } from "@/lib/standings";
import { getTotalRounds, getRoundLabel } from "@/lib/playoffs";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSettings({ playoffEnabled: "false", playoffTeamCount: "4" });

  const enabled = settings.playoffEnabled === "true";
  if (!enabled) return NextResponse.json({ enabled: false });

  const teamCount = parseInt(settings.playoffTeamCount, 10);
  const totalRounds = getTotalRounds(teamCount);

  const [players, leagueTotal, leagueDone, playoffMatches] = await Promise.all([
    db.player.findMany(),
    db.match.count({ where: { isPlayoff: false } }),
    db.match.count({ where: { isPlayoff: false, isCompleted: true } }),
    db.match.findMany({
      where: { isPlayoff: true },
      include: {
        homePlayer: { select: { id: true, playerName: true, teamId: true, teamName: true, isDisqualified: true } },
        awayPlayer: { select: { id: true, playerName: true, teamId: true, teamName: true, isDisqualified: true } },
      },
    }),
  ]);

  const leagueComplete = leagueTotal > 0 && leagueDone === leagueTotal;
  const playoffStarted = playoffMatches.length > 0;

  const completedLeagueMatches = await db.match.findMany({ where: { isPlayoff: false, isCompleted: true } });
  const standings = computeStandings(players, completedLeagueMatches);
  const seeds = standings.slice(0, teamCount);

  function getMatchWinner(m: typeof playoffMatches[number] | undefined) {
    if (!m || !m.isCompleted || m.homeScore === null || m.awayScore === null) return null;
    return m.homeScore >= m.awayScore ? m.homePlayer : m.awayPlayer;
  }

  function getMatchLoser(m: typeof playoffMatches[number] | undefined) {
    if (!m || !m.isCompleted || m.homeScore === null || m.awayScore === null) return null;
    return m.homeScore >= m.awayScore ? m.awayPlayer : m.homePlayer;
  }

  const rounds = [];
  for (let r = 1; r <= totalRounds; r++) {
    const matchCount = teamCount / Math.pow(2, r);
    const label = getRoundLabel(r, totalRounds);
    const matches = [];

    for (let slot = 0; slot < matchCount; slot++) {
      const dbMatch = playoffMatches.find((m) => m.round === r && m.bracketSlot === slot);

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
          winnerId: dbMatch.isCompleted
            ? (dbMatch.homeScore! >= dbMatch.awayScore! ? dbMatch.homePlayerId : dbMatch.awayPlayerId)
            : null,
        });
      } else if (r === 1) {
        const homeSeed = seeds[slot] ?? null;
        const awaySeed = seeds[teamCount - 1 - slot] ?? null;
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
      } else {
        // For rounds 2+, populate winners of already-completed feeder matches
        const feederHome = playoffMatches.find((m) => m.round === r - 1 && m.bracketSlot === slot * 2);
        const feederAway = playoffMatches.find((m) => m.round === r - 1 && m.bracketSlot === slot * 2 + 1);
        const homePlayer = getMatchWinner(feederHome);
        const awayPlayer = getMatchWinner(feederAway);
        matches.push({
          slot,
          id: null,
          homePlayer,
          awayPlayer,
          homeScore: null,
          awayScore: null,
          isCompleted: false,
          isPlaceholder: !homePlayer && !awayPlayer,
          leagueNotDone: false,
          winnerId: null,
        });
      }
    }

    rounds.push({ round: r, label, matches });
  }

  let thirdPlaceMatch = null;
  if (totalRounds >= 2) {
    const dbThird = playoffMatches.find((m) => m.round === totalRounds && m.bracketSlot === -1);
    if (dbThird) {
      thirdPlaceMatch = {
        id: dbThird.id,
        homePlayer: dbThird.homePlayer,
        awayPlayer: dbThird.awayPlayer,
        homeScore: dbThird.homeScore,
        awayScore: dbThird.awayScore,
        isCompleted: dbThird.isCompleted,
        isPlaceholder: false,
        winnerId: dbThird.isCompleted
          ? (dbThird.homeScore! >= dbThird.awayScore! ? dbThird.homePlayerId : dbThird.awayPlayerId)
          : null,
      };
    } else {
      // Show known losers from completed semi-finals
      const semi1 = playoffMatches.find((m) => m.round === totalRounds - 1 && m.bracketSlot === 0);
      const semi2 = playoffMatches.find((m) => m.round === totalRounds - 1 && m.bracketSlot === 1);
      const homeLoser = getMatchLoser(semi1);
      const awayLoser = getMatchLoser(semi2);
      thirdPlaceMatch = {
        id: null,
        homePlayer: homeLoser,
        awayPlayer: awayLoser,
        homeScore: null,
        awayScore: null,
        isCompleted: false,
        isPlaceholder: !homeLoser && !awayLoser,
        winnerId: null,
      };
    }
  }

  return NextResponse.json({
    enabled,
    teamCount,
    leagueComplete,
    playoffStarted,
    standings: seeds,
    bracket: { totalRounds, rounds, thirdPlaceMatch },
  });
}
