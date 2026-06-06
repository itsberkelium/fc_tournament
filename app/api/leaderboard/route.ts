import { NextResponse } from "next/server";
import db from "@/lib/db";
import { computeStandings } from "@/lib/standings";

export async function GET() {
  const [players, matches] = await Promise.all([
    db.player.findMany(),
    db.match.findMany({ where: { isCompleted: true } }),
  ]);

  return NextResponse.json({ standings: computeStandings(players, matches) });
}
