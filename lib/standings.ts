import type { Player, Match } from "@/prisma/generated";

export type StandingRow = {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  isDisqualified: boolean;
};

export function computeStandings(players: Player[], matches: Match[]): StandingRow[] {
  const map = new Map<string, StandingRow>();

  for (const p of players) {
    map.set(p.id, {
      playerId: p.id,
      playerName: p.playerName,
      teamId: p.teamId,
      teamName: p.teamName,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
      isDisqualified: p.isDisqualified,
    });
  }

  for (const match of matches) {
    const home = map.get(match.homePlayerId);
    const away = map.get(match.awayPlayerId);
    if (!home || !away || match.homeScore === null || match.awayScore === null) continue;

    home.played++;
    away.played++;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.won++;
      away.lost++;
    } else if (match.homeScore < match.awayScore) {
      away.won++;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
    }
  }

  return [...map.values()]
    .map((r) => ({
      ...r,
      goalDiff: r.goalsFor - r.goalsAgainst,
      points: r.isDisqualified ? -99 : r.won * 3 + r.drawn,
    }))
    .sort((a, b) => {
      // Disqualified always last
      if (a.isDisqualified !== b.isDisqualified) return a.isDisqualified ? 1 : -1;
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.playerName.localeCompare(b.playerName);
    });
}
