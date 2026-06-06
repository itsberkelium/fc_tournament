import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const [players, matches] = await Promise.all([
    db.player.findMany(),
    db.match.findMany({ where: { isCompleted: true } }),
  ]);

  type Row = {
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
  };

  const map = new Map<string, Row>();
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

  const standings = [...map.values()]
    .map((r) => ({
      ...r,
      goalDiff: r.goalsFor - r.goalsAgainst,
      points: r.won * 3 + r.drawn,
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.playerName.localeCompare(b.playerName);
    });

  return NextResponse.json({ standings });
}
