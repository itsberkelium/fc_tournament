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
  form: Array<"W" | "D" | "L">;
};

export type TournamentStats = {
  completedMatches: number;
  totalGoals: number;
  avgGoalsPerMatch: number;
  cleanSheets: number;
  biggestWin: {
    margin: number;
    homeScore: number;
    awayScore: number;
    homePlayerName: string;
    awayPlayerName: string;
    homeTeamName: string;
    awayTeamName: string;
  } | null;
  highestScoring: {
    total: number;
    homeScore: number;
    awayScore: number;
    homePlayerName: string;
    awayPlayerName: string;
    homeTeamName: string;
    awayTeamName: string;
  } | null;
};

type FormEntry = { round: number; createdAt: Date; result: "W" | "D" | "L" };

export function computeStandings(players: Player[], matches: Match[]): StandingRow[] {
  const map = new Map<string, Omit<StandingRow, "goalDiff" | "points" | "form">>();
  const formMap = new Map<string, FormEntry[]>();

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
      isDisqualified: p.isDisqualified,
    });
    formMap.set(p.id, []);
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

    let homeResult: "W" | "D" | "L";
    let awayResult: "W" | "D" | "L";
    if (match.homeScore > match.awayScore) {
      home.won++;
      away.lost++;
      homeResult = "W";
      awayResult = "L";
    } else if (match.homeScore < match.awayScore) {
      away.won++;
      home.lost++;
      homeResult = "L";
      awayResult = "W";
    } else {
      home.drawn++;
      away.drawn++;
      homeResult = "D";
      awayResult = "D";
    }

    formMap.get(match.homePlayerId)?.push({ round: match.round, createdAt: match.createdAt, result: homeResult });
    formMap.get(match.awayPlayerId)?.push({ round: match.round, createdAt: match.createdAt, result: awayResult });
  }

  return [...map.values()]
    .map((r) => {
      const entries = (formMap.get(r.playerId) ?? [])
        .sort((a, b) => a.round !== b.round ? a.round - b.round : a.createdAt.getTime() - b.createdAt.getTime())
        .slice(-5)
        .map((e) => e.result);
      return {
        ...r,
        goalDiff: r.goalsFor - r.goalsAgainst,
        points: r.isDisqualified ? -99 : r.won * 3 + r.drawn,
        form: entries,
      };
    })
    .sort((a, b) => {
      if (a.isDisqualified !== b.isDisqualified) return a.isDisqualified ? 1 : -1;
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.playerName.localeCompare(b.playerName);
    });
}

type StatsMatch = {
  homeScore: number | null;
  awayScore: number | null;
  homePlayer: { playerName: string; teamName: string };
  awayPlayer: { playerName: string; teamName: string };
};

export function computeTournamentStats(matches: StatsMatch[]): TournamentStats {
  let totalGoals = 0;
  let cleanSheets = 0;
  let completedMatches = 0;
  let biggestWin: TournamentStats["biggestWin"] = null;
  let highestScoring: TournamentStats["highestScoring"] = null;

  for (const m of matches) {
    if (m.homeScore === null || m.awayScore === null) continue;
    completedMatches++;
    const total = m.homeScore + m.awayScore;
    const margin = Math.abs(m.homeScore - m.awayScore);
    totalGoals += total;
    if (m.homeScore === 0 || m.awayScore === 0) cleanSheets++;
    if (!biggestWin || margin > biggestWin.margin) {
      biggestWin = {
        margin,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        homePlayerName: m.homePlayer.playerName,
        awayPlayerName: m.awayPlayer.playerName,
        homeTeamName: m.homePlayer.teamName,
        awayTeamName: m.awayPlayer.teamName,
      };
    }
    if (!highestScoring || total > highestScoring.total) {
      highestScoring = {
        total,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        homePlayerName: m.homePlayer.playerName,
        awayPlayerName: m.awayPlayer.playerName,
        homeTeamName: m.homePlayer.teamName,
        awayTeamName: m.awayPlayer.teamName,
      };
    }
  }

  const avgGoalsPerMatch = completedMatches > 0
    ? Math.round((totalGoals / completedMatches) * 10) / 10
    : 0;

  return { completedMatches, totalGoals, avgGoalsPerMatch, cleanSheets, biggestWin, highestScoring };
}
